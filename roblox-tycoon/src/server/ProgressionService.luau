--!strict
--[[
	ProgressionService – alles, was den Spieler ueber die erste Stunde
	hinaus bindet: Quests/Erfolge, Tagesbelohnung und Codes.

	Zentrale Regel dieses Moduls: JEDE Zeitpruefung laeuft gegen os.time()
	auf dem SERVER. Der Client bekommt nur zu sehen, ob der Knopf
	druckbar ist. Wuerde man dem Client die Zeit glauben, waere die
	Tagesbelohnung mit einer Systemuhr-Aenderung beliebig oft abholbar -
	das ist der klassische Exploit bei genau diesem Feature.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Log = require(Shared.Log)
local Remotes = require(Shared.Remotes)
local Types = require(Shared.Types)

local DataService = require(script.Parent.DataService)

local ProgressionService = {}
ProgressionService.name = "ProgressionService"

local function notify(player: Player, text: string, kind: string)
	Remotes.event("Notify"):FireClient(player, text, kind)
end

local function questById(id: string): Types.QuestDef?
	for _, quest in ipairs(Config.QUESTS) do
		if quest.id == id then
			return quest
		end
	end
	return nil
end

-- ==========================================================================
-- Quest-Zaehler
-- ==========================================================================

--[[
	Erhoeht einen Fortschrittszaehler. Aufrufer sind EconomyService
	(Einnahmen, Kaeufe) und RebirthService. Der Zaehler ist absichtlich
	monoton steigend und wird beim Rebirth NICHT zurueckgesetzt - sonst
	waeren Langzeit-Erfolge nach jedem Rebirth wieder unerreichbar.
]]
function ProgressionService.addMetric(player: Player, metric: string, amount: number)
	local data = DataService.get(player)
	if data == nil or amount <= 0 then
		return
	end
	data.quests[metric] = (data.quests[metric] or 0) + amount
	DataService.markDirty(player)
end

function ProgressionService.setMetric(player: Player, metric: string, value: number)
	local data = DataService.get(player)
	if data == nil then
		return
	end
	if (data.quests[metric] or 0) < value then
		data.quests[metric] = value
		DataService.markDirty(player)
	end
end

function ProgressionService.claimQuest(player: Player, questId: string): (boolean, string)
	local data = DataService.get(player)
	if data == nil then
		return false, "Profil noch nicht geladen."
	end
	local quest = questById(questId)
	if quest == nil then
		return false, "Unbekannte Aufgabe."
	end
	if data.claimedQuests[questId] then
		return false, "Schon abgeholt."
	end
	local progress = data.quests[quest.metric] or 0
	if progress < quest.target then
		return false, `Noch nicht geschafft ({Format.abbreviate(progress)}/{Format.abbreviate(quest.target)}).`
	end
	data.claimedQuests[questId] = true
	data.gems += quest.rewardGems
	DataService.markDirty(player)
	Log.info("Progression", `{player.Name} hat Quest {questId} abgeholt`)
	return true, `+{quest.rewardGems} Gems fuer "{quest.label}"`
end

-- ==========================================================================
-- Tagesbelohnung
-- ==========================================================================

function ProgressionService.dailyReady(player: Player): boolean
	local data = DataService.get(player)
	if data == nil then
		return false
	end
	return os.time() - data.dailyLastClaim >= Config.DAILY.COOLDOWN
end

function ProgressionService.claimDaily(player: Player): (boolean, string)
	local data = DataService.get(player)
	if data == nil then
		return false, "Profil noch nicht geladen."
	end
	local now = os.time()
	local elapsed = now - data.dailyLastClaim
	if elapsed < Config.DAILY.COOLDOWN then
		local remaining = Config.DAILY.COOLDOWN - elapsed
		return false, `Naechste Belohnung in {Format.duration(remaining)}.`
	end

	-- Serie: laeuft weiter, wenn innerhalb von STREAK_RESET abgeholt wird.
	if data.dailyLastClaim > 0 and elapsed <= Config.DAILY.STREAK_RESET then
		data.dailyStreak = math.min(Config.DAILY.MAX_STREAK, data.dailyStreak + 1)
	else
		data.dailyStreak = 1
	end
	data.dailyLastClaim = now

	local cash = Config.DAILY.BASE_CASH + Config.DAILY.CASH_PER_STREAK * (data.dailyStreak - 1)
	data.cash += cash
	local message = `Tag {data.dailyStreak}: +{Format.abbreviate(cash)} $`
	if data.dailyStreak >= Config.DAILY.MAX_STREAK then
		data.gems += Config.DAILY.GEMS_AT_MAX
		message ..= ` und +{Config.DAILY.GEMS_AT_MAX} Gems`
	end
	DataService.markDirty(player)
	return true, message
end

-- ==========================================================================
-- Codes
-- ==========================================================================

function ProgressionService.redeemCode(player: Player, rawCode: string): (boolean, string)
	local data = DataService.get(player)
	if data == nil then
		return false, "Profil noch nicht geladen."
	end
	-- Normalisieren: Spieler tippen Codes mit Leerzeichen und in Grossbuchstaben.
	local code = string.lower((string.gsub(rawCode, "%s", "")))
	if #code == 0 then
		return false, "Bitte einen Code eingeben."
	end
	local reward = Config.CODES[code]
	if reward == nil then
		return false, "Dieser Code ist ungueltig."
	end
	if data.redeemedCodes[code] then
		return false, "Code bereits eingeloest."
	end

	data.redeemedCodes[code] = true
	local parts: { string } = {}
	if reward.cash ~= nil then
		data.cash += reward.cash
		table.insert(parts, `{Format.abbreviate(reward.cash)} $`)
	end
	if reward.gems ~= nil then
		data.gems += reward.gems
		table.insert(parts, `{reward.gems} Gems`)
	end
	DataService.markDirty(player)
	Log.info("Progression", `{player.Name} hat Code '{code}' eingeloest`)
	return true, "Eingeloest: " .. table.concat(parts, " und ")
end

-- ==========================================================================
-- Lifecycle
-- ==========================================================================

function ProgressionService.Init()
	-- Keine Instanzen noetig; der Dienst arbeitet nur auf Profildaten.
end

function ProgressionService.Start()
	-- Spielzeit zaehlen. Laeuft absichtlich als eigener Thread mit grober
	-- Aufloesung statt im Scheduler: eine Sekunde Genauigkeit reicht voellig
	-- und belastet den Tick nicht.
	task.spawn(function()
		while true do
			task.wait(10)
			DataService.forEach(function(player: Player, data: Types.ProfileData)
				data.playtime += 10
				data.quests.playtime = data.playtime
			end)
		end
	end)
	Log.info("Progression", `{#Config.QUESTS} Quests, {#Config.GEM_PRODUCTS} Gem-Pakete aktiv`)
end

-- Benachrichtigung nach aussen sichtbar machen (RebirthService nutzt sie).
ProgressionService.notify = notify

return ProgressionService
