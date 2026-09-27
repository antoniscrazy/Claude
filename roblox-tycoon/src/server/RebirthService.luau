--!strict
--[[
	RebirthService – Prestige-Schleife.

	Der Spieler tauscht seinen gesamten Fortschritt (Cash + alle gekauften
	Upgrades) gegen einen dauerhaften Einkommensmultiplikator und Gems.

	Was NICHT zurueckgesetzt wird und warum:
	  * Gems          – Hartwaehrung; ein Reset waere faktisch Enteignung.
	  * totalEarned   – Lebenszeit-Statistik, treibt das Leaderboard.
	  * Quests/Codes  – Langzeitziele muessen Rebirths ueberleben, sonst
	                    sind "verdiene 1 Mio" und "5 Rebirths" unerreichbar.
	  * Tagesserie    – haengt an Kalendertagen, nicht am Fortschritt.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Log = require(Shared.Log)
local Remotes = require(Shared.Remotes)

local DataService = require(script.Parent.DataService)
local EconomyService = require(script.Parent.EconomyService)
local PlotService = require(script.Parent.PlotService)
local ProgressionService = require(script.Parent.ProgressionService)

local RebirthService = {}
RebirthService.name = "RebirthService"

function RebirthService.cost(player: Player): number
	local data = DataService.get(player)
	if data == nil then
		return Config.REBIRTH.BASE_COST
	end
	return Config.rebirthCost(data.rebirths)
end

--[[
	Fuehrt einen Rebirth aus. Rueckgabe (ok, Meldung).
	Alle Pruefungen serverseitig - der Client schickt nur die Absicht.
]]
function RebirthService.perform(player: Player): (boolean, string)
	local data = DataService.get(player)
	if data == nil then
		return false, "Profil noch nicht geladen."
	end
	local state = PlotService.forPlayer(player)
	if state == nil then
		return false, "Du hast noch keine Fabrik."
	end

	local cost = Config.rebirthCost(data.rebirths)
	if data.cash < cost then
		return false, `Du brauchst {Format.abbreviate(cost)} $ fuer den naechsten Rebirth.`
	end

	data.rebirths += 1
	data.cash = Config.ECONOMY.START_CASH
	data.gems += Config.REBIRTH.GEMS_PER
	-- Kompletter Neuaufbau der Fabrik: Tabelle ersetzen statt Felder zu
	-- loeschen, damit garantiert kein Eintrag uebrigbleibt.
	data.purchased = {}
	DataService.markDirty(player)

	ProgressionService.setMetric(player, "rebirths", data.rebirths)
	EconomyService.invalidate(player)
	PlotService.resetKeepOwner(state)
	PlotService.refresh(state)

	Remotes.event("PlaySfx"):FireClient(player, "rebirth")
	Log.info("Rebirth", `{player.Name} -> Rebirth {data.rebirths}`)

	local mult = Config.rebirthMultiplier(data.rebirths)
	return true, `Rebirth {data.rebirths}! Einkommen jetzt x{string.format("%.2f", mult)}`
end

function RebirthService.Init()
	-- Die Rebirth-Pads baut PlotBuilder; hier gibt es nichts anzulegen.
end

function RebirthService.Start()
	-- Rebirth-Pad auf jedem Plot verbinden. Einmalig beim Start, nicht
	-- bei jedem Besitzerwechsel - das Pad gehoert zum Plot, nicht zum Spieler.
	-- Cooldown je Plot, nicht je Spieler: eine spielergeschluesselte Tabelle
	-- in dieser Closure wuerde ueber die gesamte Serverlaufzeit wachsen,
	-- weil sie beim Verlassen niemand leert. Pro Plot gibt es ohnehin nur
	-- einen Besitzer, der das Pad ausloesen kann.
	local lastTouch: { [number]: number } = {}
	PlotService.onAssign(function(state: PlotService.PlotState)
		lastTouch[state.index] = 0
	end)

	for _, state in ipairs(PlotService.all()) do
		state.refs.rebirthPad.Touched:Connect(function(hit: BasePart)
			local owner = state.owner
			if owner == nil then
				return
			end
			local character = hit.Parent
			if character == nil or owner.Character ~= character then
				return
			end
			local now = os.clock()
			local previous = lastTouch[state.index]
			if previous ~= nil and now - previous > 0 and now - previous < 3 then
				return
			end
			lastTouch[state.index] = now
			local ok, message = RebirthService.perform(owner)
			Remotes.event("Notify"):FireClient(owner, message, if ok then "success" else "error")
		end)
	end
end

return RebirthService
