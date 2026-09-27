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

local function refresh()
	local activeStore = store
	if activeStore == nil then
		WorldService.setLeaderboardRows({ "Bestenliste nicht verfuegbar" })
		return
	end
	local ok, pages = pcall(function(): DataStorePages?
		return activeStore:GetSortedAsync(false, Config.LEADERBOARD.TOP_N)
	end)
	if not ok or pages == nil then
		Log.throttled("lb_read", 120, 2, "Leaderboard", "Bestenliste konnte nicht gelesen werden")
		return
	end

	local rows: { string } = {}
	local entries = pages:GetCurrentPage()
	for rank, entry in ipairs(entries) do
		local userId = tonumber(entry.key)
		if userId == nil then
			continue
		end
		local value = entry.value
		local amount = if typeof(value) == "number" then value else 0
		table.insert(rows, string.format("%2d.  %-20s  %s $",
			rank, nameFor(userId), Format.abbreviate(amount)))
		if rank >= Config.LEADERBOARD.TOP_N then
			break
		end
	end
	if #rows == 0 then
		rows = { "Noch keine Eintraege - sei der Erste!" }
	end
	WorldService.setLeaderboardRows(rows)
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
