--!strict
--[[
	RemoteGuard – die Tuersteher-Schicht vor jedem eingehenden Remote.

	Grundsatz des Projekts: der Client sendet ausschliesslich ABSICHTEN
	("ich will Upgrade X kaufen"). Er sendet nie Betraege, nie Ergebnisse,
	nie Zustaende. Alles, was hier ankommt, gilt als potenziell gefaelscht.

	Jeder Handler laeuft durch drei Pruefungen, bevor er die Fachlogik sieht:
	  1. Rate-Limit  – schuetzt den Server vor Remote-Spam in Schleifen.
	  2. Typpruefung – ein Exploiter kann statt eines Strings eine Tabelle,
	                   eine Instanz oder nil senden; ungeprueft fliegt die
	                   Fachlogik dann mit einem Laufzeitfehler auseinander.
	  3. pcall       – ein Fehler in der Fachlogik darf weder den Remote-
	                   Thread killen noch den Output fluten.

	Distanz- und Besitzpruefungen gehoeren NICHT hierher, sondern in die
	jeweilige Fachlogik, weil nur die weiss, was "nah genug" bedeutet.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Log = require(Shared.Log)
local RateLimiter = require(Shared.RateLimiter)
local Remotes = require(Shared.Remotes)

local RemoteGuard = {}
RemoteGuard.name = "RemoteGuard"

-- Validator: bekommt die Rohargumente, gibt die geprueften zurueck oder nil.
export type Validator = (...any) -> ...any

-- Haeufigster Fall: genau ein String mit Laengenbegrenzung.
function RemoteGuard.stringArg(maxLength: number): Validator
	return function(value: any): ...any
		if typeof(value) ~= "string" then
			return nil
		end
		if #value == 0 or #value > maxLength then
			return nil
		end
		return value
	end
end

-- Kein Argument erwartet. Alles, was trotzdem kommt, wird verworfen.
function RemoteGuard.noArgs(): Validator
	return function(): ...any
		return true
	end
end

local function limitFor(name: string): number
	local limit = (Config.RATE_LIMITS :: { [string]: number })[name]
	-- Unbekannte Remotes bekommen absichtlich ein sehr enges Budget,
	-- damit ein vergessener Eintrag nicht zur offenen Tuer wird.
	return limit or 1
end

--[[
	Bindet einen Handler an ein RemoteEvent (Client -> Server, ohne Rueckgabe).
]]
function RemoteGuard.bindEvent(name: string, validator: Validator, handler: (player: Player, ...any) -> ())
	local remote = Remotes.event(name)
	local limit = limitFor(name)
	remote.OnServerEvent:Connect(function(player: Player, ...: any)
		if not RateLimiter.consume(player.UserId, name, limit) then
			Log.throttled(`rl_{name}_{player.UserId}`, 10, 2, "RemoteGuard",
				`Rate-Limit fuer {player.Name} auf {name}`)
			return
		end
		local checked = table.pack(validator(...))
		if checked.n == 0 or checked[1] == nil then
			Log.throttled(`bad_{name}_{player.UserId}`, 10, 2, "RemoteGuard",
				`Ungueltige Argumente von {player.Name} auf {name}`)
			return
		end
		local ok, err = pcall(function(): string?
			handler(player, table.unpack(checked, 1, checked.n))
			return nil
		end)
		if not ok then
			Log.throttled(`err_{name}`, 5, 3, "RemoteGuard",
				`Handler '{name}' fehlgeschlagen: {tostring(err)}`)
		end
	end)
end

--[[
	Bindet einen Handler an eine RemoteFunction. Der Rueckgabewert ist immer
	(ok: boolean, message: string) - die UI zeigt die Nachricht direkt an.
	Bei Rate-Limit oder Fehler wird bewusst eine neutrale Meldung geliefert,
	statt intern Auskunft zu geben.
]]
function RemoteGuard.bindFunction(
	name: string,
	validator: Validator,
	handler: (player: Player, ...any) -> (boolean, string)
)
	local remote = Remotes.fn(name)
	local limit = limitFor(name)
	remote.OnServerInvoke = function(player: Player, ...: any): (boolean, string)
		if not RateLimiter.consume(player.UserId, name, limit) then
			return false, "Zu schnell - bitte kurz warten."
		end
		local checked = table.pack(validator(...))
		if checked.n == 0 or checked[1] == nil then
			return false, "Ungueltige Eingabe."
		end
		local ok, a, b = pcall(handler, player, table.unpack(checked, 1, checked.n))
		if not ok then
			Log.throttled(`err_{name}`, 5, 3, "RemoteGuard",
				`Handler '{name}' fehlgeschlagen: {tostring(a)}`)
			return false, "Da ist etwas schiefgelaufen."
		end
		return (a :: boolean), (b :: string)
	end
end

return RemoteGuard
