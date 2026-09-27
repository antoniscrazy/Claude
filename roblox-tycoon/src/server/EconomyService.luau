--!strict
--[[
	EconomyService – die eigentliche Tycoon-Schleife.

	Dropper -> Foerderband -> Veredler -> Sammler -> Geld.

	Performance-Entscheidungen, die hier bewusst getroffen wurden:

	* Das Band bewegt die Erze ueber AssemblyLinearVelocity eines
	  VERANKERTEN Teils. Die Physik-Engine erledigt das in C++; es laeuft
	  kein einziger Luau-Frame dafuer. Der veraltete Weg (BasePart.Velocity
	  oder ein BodyVelocity pro Erz) wuerde pro Erz ein Constraint kosten.
	* Es gibt genau zwei periodische Aufgaben im ganzen Modul (Drop und
	  Sweep), beide im zentralen TickScheduler. Kein Heartbeat pro Dropper,
	  kein task.spawn pro Erz, kein while-Loop pro Plot.
	* Multiplikatoren werden gecacht und nur bei Kauf/Rebirth/Gamepass
	  verworfen. Sonst laege bei 6 Plots x 10 Hz eine Neuberechnung ueber
	  25 Upgrades pro Tick an.
	* Harte Obergrenze an Erzen pro Plot plus Verfallszeit. Ohne beides
	  fuellt ein Spieler, der den Sammler blockiert, den Server mit Teilen.
]]

local PhysicsService = game:GetService("PhysicsService")
local Players = game:GetService("Players")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Log = require(Shared.Log)
local Remotes = require(Shared.Remotes)
local Types = require(Shared.Types)

local DataService = require(script.Parent.DataService)
local MonetizationService = require(script.Parent.MonetizationService)
local PlotService = require(script.Parent.PlotService)
local ProgressionService = require(script.Parent.ProgressionService)
local TickScheduler = require(script.Parent.TickScheduler)

local ORE_GROUP = "Ores"
local CHARACTER_GROUP = "Characters"

type Multipliers = {
	dropRate: number,      -- Faktor auf die Drop-Frequenz
	collector: number,     -- Faktor auf die Auszahlung
	conveyorSpeed: number,
	incomePerSecond: number,
}

local EconomyService = {}
EconomyService.name = "EconomyService"

local multCache: { [Player]: Multipliers } = {}
-- Akkumulierte Zeit pro Plot und Dropper, damit Drops unabhaengig von der
-- Tickfrequenz exakt im konfigurierten Takt fallen.
local dropAccum: { [number]: { [string]: number } } = {}
-- Kurze Sperre pro Spieler nach einer fehlgeschlagenen Pad-Beruehrung,
-- damit ein Spieler, der auf einem Pad steht, nicht 60 Meldungen pro
-- Sekunde bekommt.
local padCooldown: { [Player]: number } = {}

-- ==========================================================================
-- Multiplikatoren
-- ==========================================================================

local function dropperDefs(purchased: { [string]: boolean }): { [string]: Types.DropperDef }
	local out: { [string]: Types.DropperDef } = {
		__base = Config.ECONOMY.START_DROPPER,
	}
	for id, bought in pairs(purchased) do
		if not bought then
			continue
		end
		local def = Config.UPGRADES_BY_ID[id]
		if def ~= nil and def.effect.kind == "dropper" then
			out[id] = {
				value = def.effect.value or 0,
				interval = def.effect.interval or 1,
			}
		end
	end
	return out
end

local function computeMultipliers(player: Player): Multipliers
	local data = DataService.get(player)
	local blank: Multipliers = {
		dropRate = 1, collector = 1,
		conveyorSpeed = Config.ECONOMY.CONVEYOR_BASE_SPEED,
		incomePerSecond = 0,
	}
	if data == nil then
		return blank
	end

	local dropRate = 1
	local collector = 1
	local upgraderMult = 1
	local speed = Config.ECONOMY.CONVEYOR_BASE_SPEED

	for id, bought in pairs(data.purchased) do
		if not bought then
			continue
		end
		local def = Config.UPGRADES_BY_ID[id]
		if def == nil then
			continue
		end
		local effect = def.effect
		if effect.kind == "rate" then
			dropRate *= effect.factor or 1
		elseif effect.kind == "collector" then
			collector *= effect.mult or 1
		elseif effect.kind == "upgrader" then
			upgraderMult *= effect.mult or 1
		elseif effect.kind == "speed" then
			speed = math.max(speed, effect.speed or speed)
		end
	end

	-- Anzeige-Einkommen: was pro Sekunde beim Sammler ankaeme, wenn kein
	-- Erz verloren geht. Dieselbe Formel wie im Balancing-Simulator.
	local raw = 0
	for _, dropper in pairs(dropperDefs(data.purchased)) do
		raw += dropper.value / (dropper.interval / dropRate)
	end
	local global = Config.rebirthMultiplier(data.rebirths) * MonetizationService.cashMultiplier(player)

	return {
		dropRate = dropRate,
		collector = collector,
		conveyorSpeed = speed,
		incomePerSecond = raw * upgraderMult * collector * global,
	}
end

local function multipliers(player: Player): Multipliers
	local cached = multCache[player]
	if cached ~= nil then
		return cached
	end
	local fresh = computeMultipliers(player)
	multCache[player] = fresh
	return fresh
end

-- Muss nach jedem Kauf, Rebirth und Gamepass-Kauf aufgerufen werden.
function EconomyService.invalidate(player: Player)
	multCache[player] = nil
	local state = PlotService.forPlayer(player)
	if state ~= nil then
		PlotService.applyConveyorSpeed(state, multipliers(player).conveyorSpeed)
	end
end

function EconomyService.incomePerSecond(player: Player): number
	return multipliers(player).incomePerSecond
end

-- ==========================================================================
-- Geld gutschreiben
-- ==========================================================================

local function award(player: Player, amount: number)
	local data = DataService.get(player)
	if data == nil or amount <= 0 then
		return
	end
	data.cash += amount
	data.totalEarned += amount
	DataService.markDirty(player)
	ProgressionService.addMetric(player, "earned", amount)
end

-- ==========================================================================
-- Erze
-- ==========================================================================

local function spawnOre(state: PlotService.PlotState, id: string, dropper: Types.DropperDef)
	if state.oreCount >= Config.ECONOMY.MAX_ORES_PER_PLOT then
		return
	end
	-- Explizit optional: der Map-Index liefert laut Typ ein CFrame, aber
	-- eine unbekannte Dropper-Id gibt zur Laufzeit nil.
	local spawnCFrame: CFrame? = state.refs.dropSpawns[id]
	if spawnCFrame == nil then
		return
	end

	local ore = Instance.new("Part")
	ore.Name = "Ore"
	ore.Size = Config.ECONOMY.ORE_SIZE
	ore.CFrame = spawnCFrame :: CFrame
	ore.Material = Enum.Material.Neon
	ore.Color = Config.COLORS.ACCENT
	ore.Anchored = false
	ore.CanCollide = true
	ore.CastShadow = false
	ore.CollisionGroup = ORE_GROUP
	-- Leicht und traege genug, damit das Band sie sauber mitnimmt, ohne
	-- dass sie beim Aufprall wegspringen.
	ore.CustomPhysicalProperties = PhysicalProperties.new(0.6, 0.3, 0, 1, 1)
	ore:SetAttribute("OreValue", dropper.value)
	ore:SetAttribute("ExpireAt", os.clock() + Config.ECONOMY.ORE_LIFETIME)
	ore.Parent = state.refs.ores
	state.oreCount += 1
end

local function onDropTick(_dt: number)
	for _, state in ipairs(PlotService.all()) do
		local owner = state.owner
		if owner == nil then
			continue
		end
		local data = DataService.get(owner)
		if data == nil then
			continue
		end

		local accum = dropAccum[state.index]
		if accum == nil then
			accum = {}
			dropAccum[state.index] = accum
		end

		local rate = multipliers(owner).dropRate
		local period = 1 / Config.ECONOMY.DROP_TICK_HZ
		for id, dropper in pairs(dropperDefs(data.purchased)) do
			local elapsed = (accum[id] or 0) + period * rate
			local interval = dropper.interval
			if elapsed >= interval then
				-- Rest behalten statt auf 0 setzen: sonst verliert ein
				-- schneller Dropper bei jedem Tick Bruchteile eines Drops.
				elapsed -= interval
				spawnOre(state, id, dropper)
			end
			accum[id] = elapsed
		end
	end
end

--[[
	Aufraeumen. Laeuft mit 2 Hz und macht drei Dinge:
	  * abgelaufene Erze entfernen (ein Erz, das irgendwo klemmt, wuerde
	    sonst bis zum Serverende Physik kosten)
	  * heruntergefallene Erze entfernen
	  * den Zaehler mit der Wirklichkeit abgleichen, statt ihn nur
	    hochzuzaehlen (Zaehler driften sonst unweigerlich auseinander)
]]
local function onSweepTick(_dt: number)
	local now = os.clock()
	local killY = Config.ECONOMY.ORE_FALL_KILL_Y
	for _, state in ipairs(PlotService.all()) do
		local children = state.refs.ores:GetChildren()
		local alive = 0
		for _, child in ipairs(children) do
			if not child:IsA("BasePart") then
				continue
			end
			local expireAt = child:GetAttribute("ExpireAt")
			local expired = typeof(expireAt) == "number" and now >= expireAt
			if expired or child.Position.Y < killY then
				child:Destroy()
			else
				alive += 1
			end
		end
		state.oreCount = alive
	end
end

-- ==========================================================================
-- Kauf
-- ==========================================================================

--[[
	Die einzige Stelle im Projekt, an der ein Upgrade gekauft werden kann -
	egal ob per Pad-Beruehrung oder per Shop-Knopf. Jede Pruefung steht hier
	und ist einzeln begruendet.
]]
function EconomyService.purchase(player: Player, upgradeId: string): (boolean, string)
	-- (1) Kennen wir das Upgrade ueberhaupt? Der Client schickt eine Id;
	--     ein Exploiter schickt "gib_mir_alles".
	local def = Config.UPGRADES_BY_ID[upgradeId]
	if def == nil then
		return false, "Unbekanntes Upgrade."
	end

	-- (2) Profil geladen? Sonst wuerde ein Kauf in einem Zustand landen,
	--     der gleich vom Laden ueberschrieben wird.
	local data = DataService.get(player)
	if data == nil then
		return false, "Profil noch nicht geladen."
	end

	-- (3) Besitzt der Spieler ueberhaupt einen Plot? Ohne Plot gibt es
	--     nichts zu bebauen.
	local state = PlotService.forPlayer(player)
	if state == nil then
		return false, "Du hast noch keine Fabrik."
	end

	-- (4) Schon gekauft? Verhindert Doppelabbuchung bei mehrfachem
	--     Touched-Event auf demselben Pad.
	if data.purchased[upgradeId] then
		return false, "Schon gekauft."
	end

	-- (5) Abhaengigkeiten erfuellt? Ohne diese Pruefung koennte der Client
	--     den kompletten Baum ueberspringen und direkt das letzte Upgrade
	--     kaufen.
	if not PlotService.isAvailable(data.purchased, def) then
		return false, "Voraussetzung fehlt."
	end

	-- (6) Ist der Spieler nah genug an seiner eigenen Fabrik? Verhindert
	--     Fernkaeufe aus der Lobby per gefaelschtem Remote.
	if not PlotService.isNearOwnPlot(player) then
		return false, "Du musst bei deiner Fabrik stehen."
	end

	-- (7) Genug Geld? Der Server rechnet, nie der Client.
	if data.cash < def.price then
		return false, `Es fehlen {Format.abbreviate(def.price - data.cash)} $.`
	end

	data.cash -= def.price
	data.purchased[upgradeId] = true
	DataService.markDirty(player)

	EconomyService.invalidate(player)
	PlotService.refresh(state)
	ProgressionService.addMetric(player, "purchases", 1)

	Remotes.event("PlaySfx"):FireClient(player, "purchase")
	Log.debug("Economy", `{player.Name} kauft {upgradeId} fuer {def.price}`)
	return true, `{def.label} gekauft!`
end

-- ==========================================================================
-- Beruehrungs-Handler (einmal pro Plot, nicht pro Besitzerwechsel)
-- ==========================================================================

local function playerFromHit(hit: BasePart): Player?
	local character = hit.Parent
	if character == nil then
		return nil
	end
	return Players:GetPlayerFromCharacter(character)
end

local function connectPlot(state: PlotService.PlotState)
	local refs = state.refs

	-- Sammler: Erz einloesen.
	refs.collector.Touched:Connect(function(hit: BasePart)
		local owner = state.owner
		if owner == nil then
			return
		end
		local value = hit:GetAttribute("OreValue")
		if typeof(value) ~= "number" then
			return
		end
		-- Attribut sofort entfernen: Touched kann im selben Frame mehrfach
		-- feuern, und ohne diese Sperre wird dasselbe Erz doppelt bezahlt.
		hit:SetAttribute("OreValue", nil)
		hit:Destroy()
		state.oreCount = math.max(0, state.oreCount - 1)

		local data = DataService.get(owner)
		if data == nil then
			return
		end
		local mult = multipliers(owner)
		local payout = value
			* mult.collector
			* Config.rebirthMultiplier(data.rebirths)
			* MonetizationService.cashMultiplier(owner)
		award(owner, payout)
	end)

	-- Veredler: Erzwert erhoehen.
	for id, upgrader in pairs(refs.upgraders) do
		local def = Config.UPGRADES_BY_ID[id]
		local factor = def.effect.mult or 1
		local marker = "Up_" .. id
		upgrader.field.Touched:Connect(function(hit: BasePart)
			local owner = state.owner
			if owner == nil then
				return
			end
			local data = DataService.get(owner)
			if data == nil or not data.purchased[id] then
				return
			end
			local value = hit:GetAttribute("OreValue")
			if typeof(value) ~= "number" then
				return
			end
			-- Ein Erz darf jeden Veredler nur einmal passieren, sonst
			-- multipliziert ein auf dem Feld liegendes Erz endlos.
			if hit:GetAttribute(marker) ~= nil then
				return
			end
			hit:SetAttribute(marker, true)
			hit:SetAttribute("OreValue", value * factor)
			hit.Color = Config.COLORS.CASH
			hit.Size = hit.Size * 1.08
		end)
	end

	-- Kauf-Pads.
	for id, button in pairs(refs.buttons) do
		button.pad.Touched:Connect(function(hit: BasePart)
			local player = playerFromHit(hit)
			if player == nil or player ~= state.owner then
				return
			end
			local now = os.clock()
			local until_ = padCooldown[player]
			if until_ ~= nil and now < until_ then
				return
			end
			padCooldown[player] = now + 0.5

			local ok, message = EconomyService.purchase(player, id)
			if not ok then
				-- Bei Misserfolg laenger sperren: der Spieler steht meist
				-- noch mehrere Sekunden auf dem Pad.
				padCooldown[player] = now + 2
			end
			Remotes.event("Notify"):FireClient(player, message, if ok then "success" else "error")
		end)
	end
end

-- ==========================================================================
-- Lifecycle
-- ==========================================================================

function EconomyService.Init()
	--[[
		Kollisionsgruppen: Erze sollen mit der Welt kollidieren, aber NICHT
		mit Spielern. Ohne diese Trennung kickt ein Spieler, der auf dem
		Band steht, die Erze vom Plot - und auf einem fremden Plot koennte
		er den Nachbarn sabotieren.
	]]
	-- Einzeln registrieren: ein gemeinsames pcall wuerde nach dem ersten
	-- Fehler abbrechen und die zweite Gruppe nie anlegen.
	for _, group in ipairs({ ORE_GROUP, CHARACTER_GROUP }) do
		local ok = pcall(function()
			PhysicsService:RegisterCollisionGroup(group)
		end)
		if not ok then
			Log.debug("Economy", `Kollisionsgruppe '{group}' existierte bereits`)
		end
	end
	pcall(function()
		PhysicsService:CollisionGroupSetCollidable(ORE_GROUP, CHARACTER_GROUP, false)
		PhysicsService:CollisionGroupSetCollidable(ORE_GROUP, ORE_GROUP, true)
	end)
end

function EconomyService.Start()
	for _, state in ipairs(PlotService.all()) do
		connectPlot(state)
	end

	-- Charaktere in ihre Kollisionsgruppe stecken.
	local function tagCharacter(character: Model)
		for _, descendant in ipairs(character:GetDescendants()) do
			if descendant:IsA("BasePart") then
				descendant.CollisionGroup = CHARACTER_GROUP
			end
		end
		character.DescendantAdded:Connect(function(descendant: Instance)
			if descendant:IsA("BasePart") then
				descendant.CollisionGroup = CHARACTER_GROUP
			end
		end)
	end
	local function hookPlayer(player: Player)
		if player.Character ~= nil then
			tagCharacter(player.Character)
		end
		player.CharacterAdded:Connect(tagCharacter)
	end
	Players.PlayerAdded:Connect(hookPlayer)
	for _, player in ipairs(Players:GetPlayers()) do
		hookPlayer(player)
	end

	Players.PlayerRemoving:Connect(function(player: Player)
		multCache[player] = nil
		padCooldown[player] = nil
	end)

	--[[
		Zustand, der an EINEN Besitz gebunden ist, wird beim Freigeben des
		Plots mitgeloescht. Ohne das erbt der naechste Besitzer den
		Drop-Akkumulator des Vorgaengers (und bekaeme im ersten Tick
		gratis mehrere Erze), und die Cache-Tabellen wuechsen ueber die
		Serverlaufzeit mit jedem Spielerwechsel.
	]]
	PlotService.onAssign(function(state: PlotService.PlotState, player: Player)
		dropAccum[state.index] = {}
		state.trove:add(function()
			dropAccum[state.index] = nil
			multCache[player] = nil
			padCooldown[player] = nil
		end)
	end)

	TickScheduler.every("drop", Config.ECONOMY.DROP_TICK_HZ, onDropTick)
	TickScheduler.every("sweep", Config.ECONOMY.SWEEP_TICK_HZ, onSweepTick)
end

return EconomyService
