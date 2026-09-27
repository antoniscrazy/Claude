--!strict
--[[
	Log – strukturiertes Logging mit Level.

	Warum eigenes Logging statt print(): im Live-Betrieb ist der Output sonst
	nach wenigen Minuten unlesbar. Ueber Config.LOG_LEVEL laesst sich die
	Geschwaetzigkeit zentral drehen, ohne print-Aufrufe zu suchen.
	Zusaetzlich drosselt `throttled` wiederkehrende Meldungen, damit ein
	Fehler in einer Schleife nicht 10.000 Zeilen produziert.
]]

local Config = require(script.Parent.Config)

local Log = {}

local LEVEL_NAMES = { [0] = "DEBUG", [1] = "INFO", [2] = "WARN", [3] = "ERROR" }

-- Zeitpunkt der letzten Ausgabe je Drossel-Schluessel.
local lastEmit: { [string]: number } = {}

local function emit(level: number, scope: string, message: string)
	if level < Config.LOG_LEVEL then
		return
	end
	local line = string.format("[%s][%s] %s", LEVEL_NAMES[level] or "?", scope, message)
	if level >= 3 then
		-- warn statt error: ein Logeintrag darf niemals den aufrufenden
		-- Thread abbrechen.
		warn(line)
	elseif level == 2 then
		warn(line)
	else
		print(line)
	end
end

function Log.debug(scope: string, message: string)
	emit(0, scope, message)
end

function Log.info(scope: string, message: string)
	emit(1, scope, message)
end

function Log.warn(scope: string, message: string)
	emit(2, scope, message)
end

function Log.error(scope: string, message: string)
	emit(3, scope, message)
end

--[[
	Gibt eine Meldung hoechstens alle `seconds` Sekunden aus.
	Gedacht fuer Fehler, die in einer Schleife auftreten koennen
	(z. B. DataStore nicht erreichbar).
]]
function Log.throttled(key: string, seconds: number, level: number, scope: string, message: string)
	local now = os.clock()
	local last = lastEmit[key]
	if last ~= nil and now - last < seconds then
		return
	end
	lastEmit[key] = now
	emit(level, scope, message)
end

return Log
