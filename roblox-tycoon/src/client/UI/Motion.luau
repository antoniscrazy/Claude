--!strict
--[[
	Motion – jede Bewegung im Spiel laeuft hier durch.

	Zwei Gruende fuer eine eigene Schicht statt direkter TweenService-Aufrufe:

	  1. Aufraeumen. Ein Tween haelt eine Referenz auf seine Instanz. Wird
	     ein Panel zerstoert, waehrend ein Tween laeuft, laeuft der Tween
	     weiter und schreibt auf ein totes Objekt. Ueber `Scope` gehoert
	     jeder Tween zu einem Besitzer und wird mit ihm abgebrochen.
	  2. Reduzierte Bewegung. Theme.duration() gibt bei aktivem
	     "Reduce Motion" 0 zurueck. Ein Tween mit Dauer 0 setzt den Zielwert
	     sofort - das Layout bleibt identisch, nur die Interpolation faellt
	     weg. Es gibt deshalb keinen zweiten Codepfad dafuer.
]]

local TweenService = game:GetService("TweenService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local Motion = {}

export type Scope = {
	_tweens: { Tween },
	_connections: { RBXScriptConnection },
	_dead: boolean,

	to: (self: Scope, target: Instance, goal: { [string]: any },
	     seconds: number, easing: string?) -> Tween,
	track: (self: Scope, connection: RBXScriptConnection) -> RBXScriptConnection,
	cancel: (self: Scope) -> (),
	destroy: (self: Scope) -> (),
}

local ScopeImpl = {}
ScopeImpl.__index = ScopeImpl

function Motion.scope(): Scope
	return (setmetatable(
		{ _tweens = {}, _connections = {}, _dead = false },
		ScopeImpl
	) :: any) :: Scope
end

function ScopeImpl.to(self: Scope, target: Instance, goal: { [string]: any },
	seconds: number, easing: string?): Tween
	local tween = TweenService:Create(target, Theme.tweenInfo(seconds, easing), goal)
	if self._dead then
		-- Nach dem Aufraeumen darf nichts mehr starten, sonst haengt ein
		-- Tween an einem Panel, das gerade geschlossen wurde.
		return tween
	end
	table.insert(self._tweens, tween)
	-- Beendete Tweens aus der Liste nehmen, sonst waechst sie bei einem
	-- oft geoeffneten Panel unbegrenzt.
	tween.Completed:Once(function()
		local index = table.find(self._tweens, tween)
		if index ~= nil then
			table.remove(self._tweens, index)
		end
	end)
	tween:Play()
	return tween
end

function ScopeImpl.track(self: Scope, connection: RBXScriptConnection): RBXScriptConnection
	table.insert(self._connections, connection)
	return connection
end

function ScopeImpl.cancel(self: Scope)
	for _, tween in ipairs(self._tweens) do
		tween:Cancel()
		tween:Destroy()
	end
	table.clear(self._tweens)
end

function ScopeImpl.destroy(self: Scope)
	self._dead = true
	self:cancel()
	for _, connection in ipairs(self._connections) do
		connection:Disconnect()
	end
	table.clear(self._connections)
end

-- Anzahl laufender Tweens - fuer den Leak-Test.
function Motion.liveCount(scope: Scope): number
	return #scope._tweens
end

return Motion
