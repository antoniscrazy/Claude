--!strict
--[[
	PlotService – Besitz, Zuweisung, Freigabe und Optik der Plots.

	Zustaendig fuer:
	  * 6 Plots beim Serverstart bauen
	  * beim Join automatisch einen freien Plot zuweisen
	  * beim Verlassen den Plot vollstaendig zuruecksetzen und wiederverwenden
	  * die Optik an den Kaufzustand anpassen (welcher Button leuchtet,
	    welcher Dropper steht da, ist die Halle zu)

	NICHT zustaendig fuer Geld, Erze oder Kaufregeln - das ist EconomyService.
	Die Trennung ist wichtig, weil der Reset beim Verlassen sonst an drei
	Stellen halb implementiert waere.
]]

local Players = game:GetService("Players")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Log = require(Shared.Log)
local Theme = require(Shared.Theme)
local Trove = require(Shared.Trove)
local Types = require(Shared.Types)

local DataService = require(script.Parent.DataService)
local PlotBuilder = require(script.Parent.PlotBuilder)

local C = Theme.Color

export type PlotState = {
	index: number,
	refs: PlotBuilder.PlotRefs,
	owner: Player?,
	trove: Trove.Trove,
	oreCount: number,
	conveyorSpeed: number,
}

local PlotService = {}
PlotService.name = "PlotService"

local TweenService = game:GetService("TweenService")

-- Wie tief ein gekaufter Knopf im Boden verschwindet.
local SINK_DEPTH = 4

local plots: { PlotState } = {}
--[[
	Haken, die bei der Zuweisung eines Plots laufen. Andere Dienste haengen
	sich hier ein, um plot- oder spielergebundenen Zustand anzulegen und
	ihn ueber state.trove wieder freizugeben. Ohne diesen Mechanismus
	wuerde beim Recyceln eines Plots der Zustand des Vorbesitzers
	weiterleben - z. B. der Drop-Akkumulator oder ein Beruehrungs-Cooldown.
]]
local assignHooks: { (state: PlotState, player: Player) -> () } = {}
local byPlayer: { [Player]: PlotState } = {}

-- ==========================================================================
-- Zugriff
-- ==========================================================================

function PlotService.onAssign(hook: (state: PlotState, player: Player) -> ())
	table.insert(assignHooks, hook)
end

function PlotService.all(): { PlotState }
	return plots
end

function PlotService.forPlayer(player: Player): PlotState?
	return byPlayer[player]
end

function PlotService.ownerOf(state: PlotState): Player?
	return state.owner
end

--[[
	Distanzpruefung fuer Kaeufe aus der UI heraus.
	Warum ueberhaupt: ohne sie koennte ein Exploiter aus der Lobby heraus
	den kompletten Baum leerkaufen, waehrend ein ehrlicher Spieler auf die
	Pads laufen muss. Der Radius ist grosszuegig (Plotgroesse), damit
	niemand faelschlich blockiert wird, nur weil er in der VIP-Ecke steht.
]]
function PlotService.isNearOwnPlot(player: Player): boolean
	local state = byPlayer[player]
	if state == nil then
		return false
	end
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if root == nil or not root:IsA("BasePart") then
		return false
	end
	local center = state.refs.origin.Position
	local delta = root.Position - center
	-- Nur horizontal messen: ein Spieler auf dem Hallendach ist nah genug.
	return Vector2.new(delta.X, delta.Z).Magnitude <= Config.WORLD.PURCHASE_RADIUS
end

-- ==========================================================================
-- Optik an den Kaufzustand anpassen
-- ==========================================================================

local function isAvailable(purchased: { [string]: boolean }, def: Types.UpgradeDef): boolean
	for _, requirement in ipairs(def.requires) do
		if not purchased[requirement] then
			return false
		end
	end
	return true
end

PlotService.isAvailable = isAvailable

--[[
	Setzt saemtliche sichtbaren Eigenschaften eines Plots neu.
	Bewusst idempotent und komplett: es gibt keine "Teil-Aktualisierung",
	weil genau dort die Fehler entstehen (Plot wird recycelt, ein Rest
	vom Vorbesitzer bleibt stehen).
]]
function PlotService.refresh(state: PlotState)
	local refs = state.refs
	local owner = state.owner
	local data = if owner ~= nil then DataService.get(owner) else nil
	local purchased: { [string]: boolean } = if data ~= nil then data.purchased else {}

	-- Claim-Pad
	if owner ~= nil then
		refs.claimTitle.Text = owner.DisplayName
		refs.claimTitle.TextColor3 = C.success
		refs.claimSub.Text = `Fabrik #{state.index}`
		refs.claimPad.Color = C.success
	else
		refs.claimTitle.Text = `FREI #{state.index}`
		refs.claimTitle.TextColor3 = C.premium
		refs.claimSub.Text = "Wird beim Beitritt vergeben"
		refs.claimPad.Color = C.premium
	end

	-- Dropper: der Startdropper steht, sobald der Plot vergeben ist.
	for id, parts in pairs(refs.dropperBodies) do
		local active = if id == "__base" then owner ~= nil else (purchased[id] == true)
		for _, part in ipairs(parts) do
			part.Transparency = if active then Theme.Alpha.opaque else Theme.Alpha.hidden
			part.CanCollide = active and part.Name ~= "Nozzle"
		end
	end

	-- Veredler
	for id, upgrader in pairs(refs.upgraders) do
		local active = purchased[id] == true
		upgrader.field.Transparency = if active then Theme.Alpha.veil else Theme.Alpha.hidden
		for _, part in ipairs(upgrader.frame) do
			part.Transparency = if active then Theme.Alpha.opaque else Theme.Alpha.hidden
			part.CanCollide = active and part.Name ~= "Lamp"
		end
	end

	-- Halle, Dach, Licht
	local wallsOn = purchased.walls == true
	local roofOn = purchased.roof == true
	for _, part in ipairs(refs.hall) do
		local visible = if part.Name == "HallRoof" or part.Name == "Lamp" then roofOn else wallsOn
		part.Transparency = if visible
			then (if part.Name == "HallRoof" then Theme.Alpha.glass else Theme.Alpha.opaque)
			else Theme.Alpha.hidden
		part.CanCollide = visible and part.Name ~= "Lamp"
	end
	for _, light in ipairs(refs.hallLights) do
		light.Enabled = purchased.lights == true
	end

	-- Bandstreifen nur sichtbar, solange der Plot vergeben ist.
	refs.conveyorBeam.Enabled = owner ~= nil

	-- VIP-Tuer
	local vipBuilt = purchased.vip_room == true
	refs.vipDoor.Transparency = if vipBuilt then Theme.Alpha.veil else Theme.Alpha.hidden
	refs.vipDoor.CanCollide = vipBuilt

	-- Kaufknoepfe: drei klar unterscheidbare Zustaende.
	local cash = if data ~= nil then data.cash else 0
	for id, button in pairs(refs.buttons) do
		local def = button.def
		if purchased[id] then
			-- Gekauft: Knopf versinkt im Boden und verschwindet.
			PlotService.sinkButton(button)
		elseif owner ~= nil and isAvailable(purchased, def) then
			local affordable = cash >= def.price
			PlotService.raiseButton(button)
			button.ring.Color = if affordable then C.primary else C.bg3
			button.ring.Material = if affordable then Theme.Material.neon else Theme.Material.surface
			button.tread.Transparency = if affordable
				then Theme.Alpha.opaque
				else Theme.Alpha.ghost
			button.base.Transparency = if affordable
				then Theme.Alpha.opaque
				else Theme.Alpha.ghost
			button.stroke.Color = if affordable then C.primary else C.bg3
			button.price.TextColor3 = if affordable then C.success else C.textLow
			button.title.TextColor3 = if affordable then C.textHigh else C.textMid
			button.price.Text = `{Format.abbreviate(def.price)} $`
			button.card.BackgroundTransparency = if affordable
				then Theme.Alpha.opaque
				else Theme.Alpha.glass
			button.billboard.Enabled = true
		else
			-- Voraussetzung fehlt: sichtbar, aber eindeutig gesperrt.
			PlotService.raiseButton(button)
			button.ring.Color = C.bg3
			button.ring.Material = Theme.Material.surface
			button.tread.Transparency = Theme.Alpha.ghost
			button.base.Transparency = Theme.Alpha.ghost
			button.stroke.Color = C.bg3
			button.title.TextColor3 = C.textLow
			button.price.TextColor3 = C.textLow
			button.price.Text = "Voraussetzung fehlt"
			button.card.BackgroundTransparency = Theme.Alpha.glass
			button.billboard.Enabled = owner ~= nil
		end
		button.progress.Size = UDim2.fromScale(0, 1)
	end

	-- Rebirth-Schild
	if data ~= nil then
		local cost = Config.rebirthCost(data.rebirths)
		refs.rebirthSub.Text =
			`Rebirth {data.rebirths + 1} - {Format.abbreviate(cost)} $`
	else
		refs.rebirthSub.Text = "-"
	end

	-- Sammler-Zaehler
	refs.collectorSub.Text = if data ~= nil
		then `{Format.abbreviate(data.totalEarned)} $ gesamt`
		else "0 $ gesamt"
end

--[[
	Gekaufter Knopf: versinkt im Boden statt einfach zu verschwinden.
	Der Tween laeuft auf dem Server, weil das Teil dort erzeugt wurde;
	Roblox repliziert die Positionsaenderung an alle Clients.
]]
function PlotService.sinkButton(button: PlotBuilder.ButtonRefs)
	-- Attribut statt Transparenz als Merker: refresh() kann mehrfach
	-- innerhalb der Animationsdauer laufen, und zwei parallele Tweens auf
	-- demselben Teil kaempfen gegeneinander.
	if button.base:GetAttribute("Sunk") == true then
		return
	end
	button.base:SetAttribute("Sunk", true)
	button.billboard.Enabled = false

	local info = Theme.tweenInfo(Theme.Duration.slow, "exit")
	local down = CFrame.new(0, -SINK_DEPTH, 0)
	for _, part in ipairs({ button.base, button.tread, button.ring }) do
		TweenService:Create(part, info, { CFrame = down * part.CFrame }):Play()
		part.CanCollide = false
	end
	for _, part in ipairs(button.bevel) do
		TweenService:Create(part, info, { Transparency = Theme.Alpha.hidden }):Play()
	end
	task.delay(Theme.Duration.slow, function()
		if button.base:GetAttribute("Sunk") ~= true then
			return   -- zwischenzeitlich wieder aufgetaucht (Rebirth)
		end
		button.base.Transparency = Theme.Alpha.hidden
		button.tread.Transparency = Theme.Alpha.hidden
		button.ring.Transparency = Theme.Alpha.hidden
	end)
end

-- Gegenstueck: setzt einen versenkten Knopf zurueck (Rebirth, Plotwechsel).
function PlotService.raiseButton(button: PlotBuilder.ButtonRefs)
	button.base:SetAttribute("Sunk", nil)
	button.base.CFrame = button.homeCFrame
	button.tread.CFrame = button.homeCFrame * CFrame.new(0, 0.85, 0)
	button.ring.CFrame = button.homeCFrame * CFrame.new(0, 0.7, 0)
		* CFrame.Angles(0, 0, math.rad(90))
	button.ring.Transparency = Theme.Alpha.opaque
	button.base.CanCollide = true
	button.tread.CanCollide = true
	for _, part in ipairs(button.bevel) do
		part.Transparency = Theme.Alpha.opaque
	end
end

-- Fortschrittsring beim Draufstehen (0 bis 1).
function PlotService.setButtonProgress(button: PlotBuilder.ButtonRefs, ratio: number)
	button.progress.Size = UDim2.fromScale(math.clamp(ratio, 0, 1), 1)
end

function PlotService.refreshFor(player: Player)
	local state = byPlayer[player]
	if state ~= nil then
		PlotService.refresh(state)
	end
end

-- Bandgeschwindigkeit nach einem Band-Upgrade neu setzen.
function PlotService.applyConveyorSpeed(state: PlotState, speed: number)
	state.conveyorSpeed = speed
	for _, belt in ipairs(state.refs.conveyors) do
		belt.AssemblyLinearVelocity = Vector3.new(speed, 0, 0)
	end
end

-- ==========================================================================
-- Zuweisen und Freigeben
-- ==========================================================================

local function clearOres(state: PlotState)
	for _, ore in ipairs(state.refs.ores:GetChildren()) do
		ore:Destroy()
	end
	state.oreCount = 0
end

function PlotService.assign(player: Player): PlotState?
	if byPlayer[player] ~= nil then
		return byPlayer[player]
	end
	for _, state in ipairs(plots) do
		if state.owner == nil then
			state.owner = player
			byPlayer[player] = state
			clearOres(state)
			PlotService.applyConveyorSpeed(state, Config.ECONOMY.CONVEYOR_BASE_SPEED)
			PlotService.refresh(state)
			player:SetAttribute("PlotIndex", state.index)
			for _, hook in ipairs(assignHooks) do
				hook(state, player)
			end
			Log.info("PlotService", `{player.Name} -> Plot {state.index}`)
			return state
		end
	end
	Log.warn("PlotService", `Kein freier Plot fuer {player.Name}`)
	return nil
end

function PlotService.release(player: Player)
	local state = byPlayer[player]
	if state == nil then
		return
	end
	byPlayer[player] = nil
	state.owner = nil
	-- Alles, was waehrend des Besitzes verbunden wurde, faellt hier weg.
	state.trove:clean()
	clearOres(state)
	state.conveyorSpeed = Config.ECONOMY.CONVEYOR_BASE_SPEED
	PlotService.applyConveyorSpeed(state, state.conveyorSpeed)
	PlotService.refresh(state)
	player:SetAttribute("PlotIndex", nil)
	Log.info("PlotService", `Plot {state.index} freigegeben`)
end

-- Setzt den Plot auf den Startzustand zurueck, ohne den Besitzer zu wechseln
-- (wird beim Rebirth gebraucht).
function PlotService.resetKeepOwner(state: PlotState)
	clearOres(state)
	PlotService.applyConveyorSpeed(state, Config.ECONOMY.CONVEYOR_BASE_SPEED)
	PlotService.refresh(state)
end

function PlotService.teleportToPlot(player: Player)
	local state = byPlayer[player]
	if state == nil then
		return
	end
	local character = player.Character
	if character == nil then
		return
	end
	local root = character:FindFirstChild("HumanoidRootPart")
	if root ~= nil and root:IsA("BasePart") then
		root.CFrame = state.refs.spawnCFrame
	end
end

-- ==========================================================================
-- Lifecycle
-- ==========================================================================

function PlotService.Init()
	local folder = Instance.new("Folder")
	folder.Name = "Plots"
	folder.Parent = workspace

	local world = Config.WORLD
	local columns = world.PLOT_COLUMNS
	local rows = math.ceil(world.PLOT_COUNT / columns)

	for index = 1, world.PLOT_COUNT do
		local col = (index - 1) % columns
		local row = math.floor((index - 1) / columns)
		local x = (col - (columns - 1) / 2) * world.PLOT_SPACING_X
		local z = (row - (rows - 1) / 2) * world.PLOT_SPACING_Z
		local origin = CFrame.new(x, 0, z)
		local refs = PlotBuilder.build(index, origin, folder)
		plots[index] = {
			index = index,
			refs = refs,
			owner = nil,
			trove = Trove.new(),
			oreCount = 0,
			conveyorSpeed = Config.ECONOMY.CONVEYOR_BASE_SPEED,
		}
		PlotService.refresh(plots[index])
	end
	Log.info("PlotService", `{world.PLOT_COUNT} Plots gebaut`)
end

function PlotService.Start()
	local function setup(player: Player)
		-- Erst das Profil abwarten: ohne Daten wuerde refresh() alle
		-- gekauften Upgrades als "nicht gekauft" zeichnen und der Spieler
		-- saehe fuer einen Moment einen leeren Plot.
		DataService.await(player, 20)
		if player.Parent == nil then
			return
		end
		PlotService.assign(player)
		if player.Character ~= nil then
			PlotService.teleportToPlot(player)
		end
	end

	Players.PlayerAdded:Connect(function(player: Player)
		task.spawn(setup, player)
		player.CharacterAdded:Connect(function()
			-- Kurz warten, bis der Charakter vollstaendig geladen ist,
			-- sonst laeuft das CFrame-Setzen gegen das Spawn-Verhalten.
			task.wait(0.35)
			PlotService.teleportToPlot(player)
		end)
	end)
	Players.PlayerRemoving:Connect(PlotService.release)
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(setup, player)
	end
end

return PlotService
