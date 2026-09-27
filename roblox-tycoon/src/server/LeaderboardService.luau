--!strict
--[[
	LeaderboardService – globale Bestenliste auf einer Tafel in der Lobby.

	OrderedDataStore statt eigener Sortierung: nur der bietet serverseitig
	sortierte Seiten. Der Wert ist `totalEarned`, gedeckelt auf 2^53 bzw.
	den zulaessigen Integer-Bereich des OrderedDataStore - bei hohen
	Rebirths laeuft eine ungedeckelte Zahl sonst ueber und der Eintrag
	wird abgelehnt.

	Namen werden ueber Players:GetNameFromUserIdAsync aufgeloest und
	gecacht; der Aufruf ist ratenbegrenzt und darf nicht pro Aktualisierung
	fuer 50 Eintraege neu laufen.
]]

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Log = require(Shared.Log)

local DataService = require(script.Parent.DataService)
local WorldService = require(script.Parent.WorldService)

-- OrderedDataStore akzeptiert nur ganzzahlige Werte in diesem Bereich.
local MAX_ORDERED_VALUE = 9_000_000_000_000

local LeaderboardService = {}
LeaderboardService.name = "LeaderboardService"

local store: OrderedDataStore? = nil
local nameCache: { [number]: string } = {}

local function nameFor(userId: number): string
	local cached = nameCache[userId]
	if cached ~= nil then
		return cached
	end
	local ok, result = pcall(function(): string
		return Players:GetNameFromUserIdAsync(userId)
	end)
	local name = if ok then result else ("Spieler " .. tostring(userId))
	nameCache[userId] = name
	return name
end

local function publish()
	local activeStore = store
	if activeStore == nil then
		return
	end
	DataService.forEach(function(player: Player, data)
		if not DataService.canSave(player) then
			return
		end
		local value = math.clamp(math.floor(data.totalEarned), 0, MAX_ORDERED_VALUE)
		local ok, err = pcall(function()
			activeStore:SetAsync(tostring(player.UserId), value)
		end)
		if not ok then
			Log.throttled("lb_publish", 60, 2, "Leaderboard",
				`Veroeffentlichen fehlgeschlagen: {tostring(err)}`)
		end
	end)
end

--[[
	Avatarbilder. GetUserThumbnailAsync yieldet und ist ratenbegrenzt,
	deshalb laeuft es nach dem Zeichnen der Tafel in einem eigenen Thread
	und nur fuer Spieler, deren Bild noch nicht bekannt ist.
]]
local avatarCache: { [number]: string } = {}

local function loadAvatar(rank: number, userId: number)
	local cached = avatarCache[userId]
	if cached ~= nil then
		WorldService.setLeaderboardAvatar(rank, cached)
		return
	end
	task.spawn(function()
		local ok, image = pcall(function(): string
			local content = Players:GetUserThumbnailAsync(
				userId,
				Enum.ThumbnailType.HeadShot,
				Enum.ThumbnailSize.Size100x100
			)
			return content
		end)
		if not ok then
			Log.throttled("avatar", 120, 2, "Leaderboard", "Avatarbild nicht ladbar")
			return
		end
		avatarCache[userId] = image
		WorldService.setLeaderboardAvatar(rank, image)
	end)
end

local function refresh()
	local activeStore = store
	if activeStore == nil then
		WorldService.setLeaderboardEmpty(true)
		return
	end
	local ok, pages = pcall(function(): DataStorePages?
		return activeStore:GetSortedAsync(false, Config.LEADERBOARD.TOP_N)
	end)
	if not ok or pages == nil then
		Log.throttled("lb_read", 120, 2, "Leaderboard", "Bestenliste konnte nicht gelesen werden")
		return
	end

	local entries: { WorldService.Entry } = {}
	for rank, entry in ipairs(pages:GetCurrentPage()) do
		local userId = tonumber(entry.key)
		if userId == nil then
			continue
		end
		local value = entry.value
		local amount = if typeof(value) == "number" then value else 0
		table.insert(entries, {
			rank = rank,
			userId = userId,
			name = nameFor(userId),
			amount = Format.abbreviate(amount),
		})
		if rank >= Config.LEADERBOARD.TOP_N then
			break
		end
	end

	WorldService.setLeaderboardRows(entries)
	WorldService.setLeaderboardEmpty(#entries == 0)
	for _, entry in ipairs(entries) do
		loadAvatar(entry.rank, entry.userId)
	end

	-- Der Namens-Cache waechst sonst ueber die Serverlaufzeit mit jedem
	-- neuen Spieler in der Bestenliste.
	local cachedNames = 0
	for _ in pairs(nameCache) do
		cachedNames += 1
	end
	if cachedNames > Config.LEADERBOARD.TOP_N * 10 then
		table.clear(nameCache)
		table.clear(avatarCache)
	end
end

function LeaderboardService.Init()
	local ok, result = pcall(function(): OrderedDataStore
		return DataStoreService:GetOrderedDataStore(Config.LEADERBOARD_STORE_NAME)
	end)
	store = if ok then result else nil
	if not ok then
		Log.warn("Leaderboard", "OrderedDataStore nicht verfuegbar - Tafel bleibt leer.")
	end
end

function LeaderboardService.Start()
	-- Eigene Threads statt TickScheduler: beide Aufgaben yielden auf
	-- Webaufrufe, und der Scheduler darf nie blockieren.
	task.spawn(function()
		while true do
			refresh()
			task.wait(Config.LEADERBOARD.REFRESH_SECONDS)
		end
	end)
	task.spawn(function()
		while true do
			task.wait(Config.LEADERBOARD.PUBLISH_SECONDS)
			publish()
		end
	end)
end

return LeaderboardService
