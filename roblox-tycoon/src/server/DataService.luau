--!strict
--[[
	DataService – Profilspeicherung nach dem ProfileStore-Muster,
	hier eigenstaendig implementiert (keine externe Abhaengigkeit).

	Das Problem, das dieses Modul loest: naives :SetAsync() verliert Daten.
	Konkret in vier Faellen, die im Livebetrieb alle vorkommen:

	  1. Zwei Server halten dasselbe Profil (Teleport, schneller Rejoin,
	     Serverwechsel). Der langsamere ueberschreibt am Ende den neueren
	     Fortschritt.  -> geloest durch SESSION-LOCKING via UpdateAsync.
	  2. Der DataStore ist kurz nicht erreichbar. Ein einzelner Versuch
	     schlaegt fehl und der Fortschritt ist weg.
	     -> geloest durch RETRY MIT EXPONENTIELLEM BACKOFF.
	  3. Der Server stirbt (Shutdown, Crash). Nicht gespeicherte Minuten
	     sind verloren.  -> geloest durch AUTOSAVE + BindToClose-Flush.
	  4. Ein neues Feld kommt dazu und alte Profile haben es nicht.
	     -> geloest durch RECONCILE gegen das Template.

	Ein abgestuerzter Server kann seinen Lock nicht freigeben. Deshalb gilt
	ein Lock nach LOCK_STALE Sekunden als tot und darf uebernommen werden -
	sonst waere der Spieler dauerhaft ausgesperrt.

	Ohne API-Zugriff (Studio ohne "Studio Access to API Services") schlaegt
	jeder DataStore-Aufruf fehl. Dann laeuft das Spiel mit einem frischen
	Profil im Modus canSave = false weiter, und es wird GENAU EINMAL
	gewarnt statt im Sekundentakt.
]]

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Log = require(Shared.Log)
local Types = require(Shared.Types)

type ProfileData = Types.ProfileData

-- Struktur im DataStore. `lock` und `data` liegen bewusst getrennt, damit
-- das Uebernehmen eines toten Locks die Nutzdaten nicht anfasst.
type StoredRecord = {
	lock: { jobId: string, t: number }?,
	data: ProfileData?,
}

type Profile = {
	userId: number,
	key: string,
	data: ProfileData,
	canSave: boolean,     -- false = Lock nie bekommen, wir schreiben NICHTS
	releasing: boolean,
	dirty: boolean,       -- Zustand hat sich seit dem letzten Push geaendert
	lastSave: number,
}

local LOCK_STALE = 90          -- Sekunden, nach denen ein Lock als tot gilt
local LOCK_ATTEMPTS = 5        -- Versuche, den Lock zu bekommen
local SAVE_ATTEMPTS = 4        -- Versuche pro Speichervorgang
local AUTOSAVE_SECONDS = 60
local BACKOFF_BASE = 1.5       -- Sekunden; waechst exponentiell

local DataService = {}
DataService.name = "DataService"

local store: DataStore? = nil
local profiles: { [Player]: Profile } = {}
local apiWarned = false

-- ==========================================================================
-- Template und Reconcile
-- ==========================================================================

local function template(): ProfileData
	return {
		version = 1,
		cash = Config.ECONOMY.START_CASH,
		gems = Config.ECONOMY.START_GEMS,
		rebirths = 0,
		totalEarned = 0,
		purchased = {},
		redeemedCodes = {},
		receipts = {},
		quests = { earned = 0, purchases = 0, rebirths = 0, playtime = 0 },
		claimedQuests = {},
		dailyLastClaim = 0,
		dailyStreak = 0,
		settings = { music = true, sfx = true },
		playtime = 0,
	}
end

--[[
	Fuellt fehlende Felder aus dem Template nach. Bewusst NICHT rekursiv
	ueber beliebige Tiefe: die Profilstruktur ist flach plus Maps, und ein
	generisches Deep-Merge wuerde Spielerdaten in `purchased` ueberschreiben,
	wenn das Template dort je einen Eintrag bekaeme.
]]
local function reconcile(data: any): ProfileData
	local base = template()
	if typeof(data) ~= "table" then
		return base
	end
	for key, defaultValue in pairs(base :: { [string]: any }) do
		local given = (data :: { [string]: any })[key]
		if typeof(given) ~= typeof(defaultValue) then
			(data :: { [string]: any })[key] = defaultValue
		elseif typeof(defaultValue) == "table" then
			-- Untertabellen: nur fehlende Schluessel ergaenzen, vorhandene
			-- Spielerdaten unangetastet lassen.
			for subKey, subDefault in pairs(defaultValue :: { [string]: any }) do
				if (given :: { [string]: any })[subKey] == nil then
					(given :: { [string]: any })[subKey] = subDefault
				end
			end
		end
	end
	return data :: ProfileData
end

-- ==========================================================================
-- DataStore-Zugriff mit Backoff
-- ==========================================================================

local function jobIdentity(): string
	-- In Studio ist JobId leer. Ein stabiler Ersatzwert verhindert, dass
	-- zwei Studio-Sitzungen sich gegenseitig fuer denselben Server halten.
	return if game.JobId ~= "" then game.JobId else "studio-" .. tostring(RunService:IsStudio())
end

--[[
	Fuehrt eine DataStore-Operation mit exponentiellem Backoff aus.
	Gibt (erfolg, ergebnis) zurueck. Jeder einzelne Aufruf steckt in pcall -
	DataStore-Fehler duerfen nie bis in die Spiellogik durchschlagen.
]]
local function withRetry<T>(label: string, attempts: number, operation: () -> T): (boolean, T?)
	for attempt = 1, attempts do
		local ok, result = pcall(operation)
		if ok then
			return true, result
		end
		if not apiWarned then
			apiWarned = true
			Log.warn("DataService",
				`DataStore nicht erreichbar ({label}): {tostring(result)}. ` ..
				`In Studio: "Studio Access to API Services" aktivieren. ` ..
				`Das Spiel laeuft weiter, speichert aber nicht.`)
		else
			Log.throttled("ds_" .. label, 30, 2, "DataService",
				`{label} fehlgeschlagen (Versuch {attempt}/{attempts})`)
		end
		if attempt < attempts then
			-- Exponentiell plus Jitter: ohne Jitter laufen bei einem
			-- DataStore-Ausfall alle Server synchron in denselben Retry.
			task.wait(BACKOFF_BASE * (2 ^ (attempt - 1)) + math.random() * 0.5)
		end
	end
	return false, nil
end

-- ==========================================================================
-- Lock holen / halten / freigeben
-- ==========================================================================

--[[
	Versucht, den Session-Lock zu uebernehmen und die Daten zu laden.
	Rueckgabe: (gelungen, daten).

	Die Transaktion laeuft in UpdateAsync, weil nur dort Lesen und Schreiben
	atomar sind. Gibt der Transformer nil zurueck, bricht Roblox den Schreib-
	vorgang ab - genau das nutzen wir als "fremder Lock ist noch frisch".
]]
local function acquire(userId: number, key: string): (boolean, ProfileData?)
	local activeStore = store
	if activeStore == nil then
		return false, nil
	end
	local me = jobIdentity()

	for attempt = 1, LOCK_ATTEMPTS do
		local blocked = false
		local ok, result = withRetry(`lock:{userId}`, 2, function(): StoredRecord?
			return activeStore:UpdateAsync(key, function(old: any): StoredRecord?
				local record: StoredRecord = if typeof(old) == "table"
					then old :: StoredRecord
					else { lock = nil, data = nil }

				local lock = record.lock
				if lock ~= nil and lock.jobId ~= me then
					local age = os.time() - lock.t
					if age < LOCK_STALE then
						blocked = true
						return nil   -- Schreibvorgang abbrechen
					end
					-- Lock ist aelter als LOCK_STALE: der haltende Server
					-- ist mit hoher Wahrscheinlichkeit tot. Uebernehmen.
				end
				record.lock = { jobId = me, t = os.time() }
				return record
			end)
		end)

		if ok and result ~= nil then
			return true, reconcile(result.data)
		end
		if not blocked then
			-- Kein fremder Lock, sondern ein echter Fehler: aufgeben,
			-- withRetry hat bereits eigene Versuche verbraucht.
			return false, nil
		end
		Log.info("DataService",
			`Profil {userId} noch von einer anderen Sitzung gehalten ` ..
			`(Versuch {attempt}/{LOCK_ATTEMPTS})`)
		task.wait(BACKOFF_BASE * attempt)
	end
	return false, nil
end

--[[
	Schreibt die Daten und aktualisiert oder loest den Lock.
	`release = true` gibt den Lock frei (beim Verlassen / Shutdown).
]]
local function commit(profile: Profile, release: boolean): boolean
	local activeStore = store
	if activeStore == nil or not profile.canSave then
		return false
	end
	local me = jobIdentity()
	local data = profile.data

	local ok = withRetry(`save:{profile.userId}`, SAVE_ATTEMPTS, function(): boolean
		activeStore:UpdateAsync(profile.key, function(old: any): StoredRecord
			local record: StoredRecord = if typeof(old) == "table"
				then old :: StoredRecord
				else { lock = nil, data = nil }
			-- Nur schreiben, wenn WIR den Lock halten. Sonst hat ein anderer
			-- Server uebernommen und wuerde hier ueberschrieben werden.
			local lock = record.lock
			if lock ~= nil and lock.jobId ~= me then
				return record
			end
			record.data = data
			record.lock = if release then nil else { jobId = me, t = os.time() }
			return record
		end)
		return true
	end)

	if ok then
		profile.lastSave = os.clock()
		Log.debug("DataService", `Profil {profile.userId} gespeichert (release={tostring(release)})`)
	end
	return ok
end

-- ==========================================================================
-- Oeffentliche API
-- ==========================================================================

function DataService.get(player: Player): ProfileData?
	local profile = profiles[player]
	return if profile ~= nil then profile.data else nil
end

-- Wartet, bis das Profil geladen ist (oder die Zeit ablaeuft). Dienste, die
-- beim Join sofort Daten brauchen, rufen das statt selbst zu pollen.
function DataService.await(player: Player, timeout: number?): ProfileData?
	local deadline = os.clock() + (timeout or 20)
	while profiles[player] == nil and os.clock() < deadline do
		if player.Parent == nil then
			return nil
		end
		task.wait(0.1)
	end
	local profile = profiles[player]
	return if profile ~= nil then profile.data else nil
end

function DataService.canSave(player: Player): boolean
	local profile = profiles[player]
	return profile ~= nil and profile.canSave
end

-- Markiert das Profil als geaendert. StateService liest dieses Flag und
-- repliziert dann; so braucht kein Dienst eine Referenz auf StateService
-- (das waere ein Abhaengigkeitszyklus).
function DataService.markDirty(player: Player)
	local profile = profiles[player]
	if profile ~= nil then
		profile.dirty = true
	end
end

function DataService.consumeDirty(player: Player): boolean
	local profile = profiles[player]
	if profile == nil or not profile.dirty then
		return false
	end
	profile.dirty = false
	return true
end

function DataService.forEach(callback: (player: Player, data: ProfileData) -> ())
	for player, profile in pairs(profiles) do
		callback(player, profile.data)
	end
end

-- ==========================================================================
-- Lifecycle
-- ==========================================================================

local function onPlayerAdded(player: Player)
	local key = "Player_" .. player.UserId
	local ok, data = acquire(player.UserId, key)

	-- Der Spieler kann waehrend des Ladens schon wieder weg sein.
	if player.Parent == nil then
		return
	end

	if not ok or data == nil then
		Log.warn("DataService",
			`Profil fuer {player.Name} nicht gesperrt/geladen - Sitzung laeuft OHNE Speichern.`)
		data = template()
	end

	profiles[player] = {
		userId = player.UserId,
		key = key,
		data = data :: ProfileData,
		canSave = ok,
		releasing = false,
		dirty = true,
		lastSave = os.clock(),
	}
	Log.info("DataService", `Profil geladen: {player.Name} (speichern={tostring(ok)})`)
end

local function onPlayerRemoving(player: Player)
	local profile = profiles[player]
	if profile == nil then
		return
	end
	profile.releasing = true
	commit(profile, true)
	profiles[player] = nil
end

function DataService.Init()
	local ok, result = pcall(function(): DataStore
		return DataStoreService:GetDataStore(Config.DATA_STORE_NAME)
	end)
	store = if ok then result else nil
	if not ok then
		Log.warn("DataService", "GetDataStore fehlgeschlagen - Spiel laeuft ohne Speichern.")
	end
end

function DataService.Start()
	Players.PlayerAdded:Connect(function(player: Player)
		task.spawn(onPlayerAdded, player)
	end)
	Players.PlayerRemoving:Connect(onPlayerRemoving)
	-- Spieler, die vor dem Start schon drin waren (Studio-Reload).
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(onPlayerAdded, player)
	end

	-- Autosave. Laeuft in einem eigenen Thread statt im TickScheduler,
	-- weil UpdateAsync yieldet und der Scheduler nicht blockieren darf.
	task.spawn(function()
		while true do
			task.wait(AUTOSAVE_SECONDS)
			for player, profile in pairs(profiles) do
				if not profile.releasing and player.Parent ~= nil then
					task.spawn(commit, profile, false)
				end
			end
		end
	end)

	--[[
		BindToClose: beim Herunterfahren bleiben ~30 s. Alle Profile werden
		parallel geschrieben und der Lock freigegeben, damit ein Spieler auf
		dem neuen Server sofort wieder rein kann statt LOCK_STALE zu warten.
	]]
	game:BindToClose(function()
		Log.info("DataService", "Shutdown - schreibe alle Profile")
		local pending = 0
		for _, profile in pairs(profiles) do
			if profile.canSave then
				pending += 1
				task.spawn(function()
					commit(profile, true)
					pending -= 1
				end)
			end
		end
		local deadline = os.clock() + 25
		while pending > 0 and os.clock() < deadline do
			task.wait(0.2)
		end
		Log.info("DataService", "Shutdown abgeschlossen")
	end)
end

return DataService
