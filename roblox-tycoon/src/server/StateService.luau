--!strict
--[[
	StateService – die einzige Stelle, an der Serverzustand zum Client geht.

	Warum gebuendelt statt "jeder Dienst feuert selbst":
	  * Ein Kauf aendert Cash, den gekauften Satz, die verfuegbaren Buttons,
	    das Einkommen und moeglicherweise einen Quest-Zaehler. Fuenf
	    Einzelnachrichten pro Kauf waeren Netzwerklast ohne Nutzen.
	  * Ohne zentrale Stelle wuerde frueher oder spaeter ein Dienst etwas
	    schicken, das der Client nicht wissen darf.

	Ablauf: Dienste setzen ueber DataService.markDirty() nur ein Flag.
	Dieser Dienst prueft es mit STATE_PUSH_HZ und schickt dann genau einen
	vollstaendigen Schnappschuss. Dadurch gibt es keinen Abhaengigkeits-
	zyklus - kein Dienst braucht eine Referenz auf StateService.

	Hier haengen ausserdem alle eingehenden Remotes, damit man in EINER
	Datei sieht, was der Client ueberhaupt ausloesen kann.
]]

local Players = game:GetService("Players")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Log = require(Shared.Log)
local RateLimiter = require(Shared.RateLimiter)
local Remotes = require(Shared.Remotes)
local Types = require(Shared.Types)

local DataService = require(script.Parent.DataService)
local EconomyService = require(script.Parent.EconomyService)
local MonetizationService = require(script.Parent.MonetizationService)
local PlotService = require(script.Parent.PlotService)
local ProgressionService = require(script.Parent.ProgressionService)
local RebirthService = require(script.Parent.RebirthService)
local RemoteGuard = require(script.Parent.RemoteGuard)
local TickScheduler = require(script.Parent.TickScheduler)

local StateService = {}
StateService.name = "StateService"

-- ==========================================================================
-- leaderstats (die eingebaute Roblox-Rangliste oben rechts)
-- ==========================================================================

local function ensureLeaderstats(player: Player): (IntValue, IntValue)
	local existing = player:FindFirstChild("leaderstats")
	if existing ~= nil then
		local cash = existing:FindFirstChild("Cash")
		local rebirths = existing:FindFirstChild("Rebirths")
		if cash ~= nil and cash:IsA("IntValue") and rebirths ~= nil and rebirths:IsA("IntValue") then
			return cash, rebirths
		end
		existing:Destroy()
	end

	local folder = Instance.new("Folder")
	folder.Name = "leaderstats"

	local cash = Instance.new("IntValue")
	cash.Name = "Cash"
	cash.Parent = folder

	local rebirths = Instance.new("IntValue")
	rebirths.Name = "Rebirths"
	rebirths.Parent = folder

	folder.Parent = player
	return cash, rebirths
end

-- ==========================================================================
-- Schnappschuss
-- ==========================================================================

local function snapshot(player: Player, data: Types.ProfileData): Types.ClientState
	local available: { [string]: boolean } = {}
	for _, def in ipairs(Config.UPGRADES) do
		if not data.purchased[def.id] and PlotService.isAvailable(data.purchased, def) then
			available[def.id] = true
		end
	end

	local state = PlotService.forPlayer(player)

	return {
		cash = data.cash,
		gems = data.gems,
		rebirths = data.rebirths,
		totalEarned = data.totalEarned,
		incomePerSecond = EconomyService.incomePerSecond(player),
		purchased = data.purchased,
		available = available,
		plotIndex = if state ~= nil then state.index else nil,
		rebirthCost = Config.rebirthCost(data.rebirths),
		rebirthMultiplier = Config.rebirthMultiplier(data.rebirths),
		nextRebirthMultiplier = Config.rebirthMultiplier(data.rebirths + 1),
		dailyReady = ProgressionService.dailyReady(player),
		dailyStreak = data.dailyStreak,
		quests = data.quests,
		claimedQuests = data.claimedQuests,
		owns2xCash = MonetizationService.owns2xCash(player),
		ownsVip = MonetizationService.ownsVip(player),
	}
end

local function push(player: Player)
	local data = DataService.get(player)
	if data == nil then
		return
	end
	local cash, rebirths = ensureLeaderstats(player)
	cash.Value = math.clamp(math.floor(data.cash), -2147483648, 2147483647)
	rebirths.Value = data.rebirths
	Remotes.event("StateChanged"):FireClient(player, snapshot(player, data))
end

function StateService.pushNow(player: Player)
	push(player)
end

-- ==========================================================================
-- Eingehende Remotes
-- ==========================================================================

local function bindRemotes()
	RemoteGuard.bindEvent("RequestPurchase", RemoteGuard.stringArg(64),
		function(player: Player, upgradeId: any)
			local ok, message = EconomyService.purchase(player, upgradeId :: string)
			Remotes.event("Notify"):FireClient(player, message, if ok then "success" else "error")
		end)

	RemoteGuard.bindEvent("RequestRebirth", RemoteGuard.noArgs(),
		function(player: Player)
			local ok, message = RebirthService.perform(player)
			Remotes.event("Notify"):FireClient(player, message, if ok then "success" else "error")
		end)

	RemoteGuard.bindEvent("PromptGemProduct", RemoteGuard.stringArg(32),
		function(player: Player, productKey: any)
			MonetizationService.promptGemProduct(player, productKey :: string)
		end)

	RemoteGuard.bindFunction("RedeemCode", RemoteGuard.stringArg(32),
		function(player: Player, code: any): (boolean, string)
			return ProgressionService.redeemCode(player, code :: string)
		end)

	RemoteGuard.bindFunction("ClaimDaily", RemoteGuard.noArgs(),
		function(player: Player): (boolean, string)
			return ProgressionService.claimDaily(player)
		end)

	RemoteGuard.bindFunction("ClaimQuest", RemoteGuard.stringArg(64),
		function(player: Player, questId: any): (boolean, string)
			return ProgressionService.claimQuest(player, questId :: string)
		end)
end

-- ==========================================================================
-- Lifecycle
-- ==========================================================================

function StateService.Init()
	-- Remotes existieren bereits (Bootstrap ruft Remotes.initServer auf),
	-- gebunden wird erst in Start().
end

function StateService.Start()
	bindRemotes()

	Players.PlayerAdded:Connect(function(player: Player)
		task.spawn(function()
			-- Auf das Profil warten, sonst wuerde der erste Schnappschuss
			-- Nullwerte enthalten und die UI kurz "0 $" zeigen, obwohl
			-- der Spieler Millionen hat.
			if DataService.await(player, 25) ~= nil then
				push(player)
			end
		end)
	end)

	Players.PlayerRemoving:Connect(function(player: Player)
		RateLimiter.clear(player.UserId)
	end)

	-- Regelmaessig, aber nur bei Aenderung senden.
	TickScheduler.every("statepush", Config.ECONOMY.STATE_PUSH_HZ, function()
		for _, player in ipairs(Players:GetPlayers()) do
			if DataService.consumeDirty(player) then
				push(player)
			end
		end
	end)

	-- Zusaetzlich alle 5 s ein Vollabgleich. Faengt den Fall ab, dass eine
	-- Aenderung ohne markDirty passiert ist, und haelt Einkommen und
	-- Tagesbelohnungs-Countdown in der UI aktuell.
	task.spawn(function()
		while true do
			task.wait(5)
			for _, player in ipairs(Players:GetPlayers()) do
				push(player)
			end
		end
	end)

	Log.info("StateService", "Remotes gebunden, Replikation laeuft")
end

return StateService
