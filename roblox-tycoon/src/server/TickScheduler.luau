--!strict
--[[
	TickScheduler – der EINZIGE Heartbeat des Servers.

	Warum das wichtig ist: 6 Plots x 7 Droppern x eigener Verbindung waeren
	42 Heartbeat-Handler, die 60-mal pro Sekunde feuern. Das kostet auf einem
	Mittelklasse-Android messbar Frames, weil jeder Handler einen eigenen
	Luau-Kontextwechsel ausloest. Stattdessen laeuft hier genau eine
	Heartbeat-Verbindung, die alle Aufgaben in festen Frequenzen
	batchweise abarbeitet.

	Fehlerpolitik: eine geworfene Aufgabe darf den Scheduler nicht killen und
	den Output nicht fluten. Deshalb pcall + gedrosseltes Log + Abschaltung
	nach zu vielen Fehlern in Folge.
]]

local RunService = game:GetService("RunService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Log = require(Shared.Log)

type Task = {
	name: string,
	period: number,
	accum: number,
	fn: (dt: number) -> (),
	failures: number,
	disabled: boolean,
}

local MAX_CONSECUTIVE_FAILURES = 10

local TickScheduler = {}
TickScheduler.name = "TickScheduler"

local tasks: { Task } = {}
local connection: RBXScriptConnection? = nil

--[[
	Registriert eine Aufgabe mit fester Frequenz.
	hz = Aufrufe pro Sekunde. Die Aufgabe bekommt die tatsaechlich
	vergangene Zeit als Argument, nicht die Soll-Periode - so bleibt die
	Oekonomie auch bei Serverlast korrekt (kein Einkommensverlust bei Lag).
]]
function TickScheduler.every(name: string, hz: number, fn: (dt: number) -> ())
	assert(hz > 0, "hz muss > 0 sein")
	table.insert(tasks, {
		name = name,
		period = 1 / hz,
		accum = 0,
		fn = fn,
		failures = 0,
		disabled = false,
	})
	Log.debug("TickScheduler", `Aufgabe registriert: {name} @ {hz} Hz`)
end

function TickScheduler.Init()
	-- Nichts zu verdrahten: Aufgaben registrieren sich selbst ueber every().
end

function TickScheduler.Start()
	assert(connection == nil, "TickScheduler laeuft bereits")
	connection = RunService.Heartbeat:Connect(function(dt: number)
		-- Die Schleifenvariable heisst bewusst NICHT 'task': sie wuerde
		-- sonst die globale task-Bibliothek beschatten, und ein spaeter
		-- eingefuegtes task.spawn in diesem Block wuerde stillschweigend
		-- auf die Aufgabentabelle zugreifen.
		for _, entry in ipairs(tasks) do
			if entry.disabled then
				continue
			end
			entry.accum += dt
			if entry.accum < entry.period then
				continue
			end
			local elapsed = entry.accum
			entry.accum = 0

			local ok, err = pcall(function(): string?
				entry.fn(elapsed)
				return nil
			end)
			if ok then
				entry.failures = 0
			else
				entry.failures += 1
				Log.throttled(
					"tick_" .. entry.name, 5, 3, "TickScheduler",
					`Aufgabe '{entry.name}' fehlgeschlagen ({entry.failures}x): {tostring(err)}`
				)
				if entry.failures >= MAX_CONSECUTIVE_FAILURES then
					entry.disabled = true
					Log.error("TickScheduler",
						`Aufgabe '{entry.name}' nach {MAX_CONSECUTIVE_FAILURES} Fehlern abgeschaltet`)
				end
			end
		end
	end)
	Log.info("TickScheduler", `gestartet mit {#tasks} Aufgaben`)
end

function TickScheduler.Stop()
	if connection ~= nil then
		connection:Disconnect()
		connection = nil
	end
end

return TickScheduler
