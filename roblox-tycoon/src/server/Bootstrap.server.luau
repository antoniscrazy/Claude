--!strict
--[[
	Bootstrap – Einstiegspunkt des Servers.

	Zwei-Phasen-Lifecycle, weil die Reihenfolge sonst nicht beherrschbar ist:

	  Init()  – darf NICHT yielden. Hier werden nur Instanzen angelegt und
	            Referenzen verdrahtet. Nach Abschluss aller Init-Aufrufe
	            steht die Welt, und jeder Dienst darf davon ausgehen, dass
	            die anderen existieren.
	  Start() – darf yielden. Hier werden Ereignisse verbunden, Threads
	            gestartet und Webaufrufe gemacht.

	Wuerde man beides mischen, haette z. B. EconomyService.Start die Plots
	noch nicht, weil PlotService.Init erst spaeter liefe. Die Liste unten
	ist deshalb bewusst von Hand sortiert und nicht alphabetisch.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Log = require(Shared.Log)
local Remotes = require(Shared.Remotes)

-- Remotes muessen existieren, bevor irgendein Dienst sie bindet oder ein
-- Client sie sucht.
Remotes.initServer()

local Server = script.Parent

type LifecycleModule = {
	name: string,
	Init: (() -> ())?,
	Start: (() -> ())?,
}

-- Reihenfolge = Abhaengigkeitsreihenfolge.
-- Die Annotation ist noetig, damit Luau den Elementtyp nicht vom ERSTEN
-- Eintrag ableitet; jeder Dienst erfuellt LifecycleModule per Breiten-
-- Subtyping (zusaetzliche Felder wie TickScheduler.every stoeren nicht).
local services: { LifecycleModule } = {
	require(Server.TickScheduler),
	require(Server.DataService),
	require(Server.WorldService),
	require(Server.PlotService),
	require(Server.MonetizationService),
	require(Server.ProgressionService),
	require(Server.EconomyService),
	require(Server.RebirthService),
	require(Server.LeaderboardService),
	require(Server.StateService),
}

local function phase(label: string, key: "Init" | "Start")
	for _, module in ipairs(services) do
		-- Bewusst kein dynamischer Index ueber einen String: eine
		-- Fallunterscheidung bleibt typsicher, module[key] waere ein
		-- any-Zugriff.
		local fn: (() -> ())? = if key == "Init" then module.Init else module.Start
		if fn == nil then
			continue
		end
		local startedAt = os.clock()
		-- pcall pro Dienst: ein kaputter Dienst darf nicht das ganze Spiel
		-- verhindern. Der Rest laeuft weiter und der Fehler steht genau
		-- einmal im Output statt als Kaskade.
		local ok, err = pcall(function(): string?
			fn()
			return nil
		end)
		local ms = (os.clock() - startedAt) * 1000
		if ok then
			Log.debug("Bootstrap", `{label} {module.name} in {string.format("%.1f", ms)} ms`)
		else
			Log.error("Bootstrap", `{label} {module.name} FEHLGESCHLAGEN: {tostring(err)}`)
		end
	end
end

local bootStart = os.clock()
phase("Init", "Init")
phase("Start", "Start")
Log.info("Bootstrap",
	`Server bereit in {string.format("%.0f", (os.clock() - bootStart) * 1000)} ms ` ..
	`({#services} Dienste)`)
