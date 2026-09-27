--!strict
--[[
	Trove – Aufraeumtabelle gegen Memory Leaks.

	Jede Verbindung, jede Instanz und jeder Timer, den ein Dienst anlegt,
	wandert in einen Trove. Beim Spielerabgang oder Plot-Reset wird der Trove
	einmal geleert und damit garantiert ALLES freigegeben - statt in jedem
	Dienst eine eigene, unvollstaendige Aufraeumliste zu pflegen.

	Bewusst minimal gehalten: add / connect / extend / clean / destroy.
]]

export type Trove = {
	_objects: { any },
	_cleaning: boolean,

	add: <T>(self: Trove, object: T) -> T,
	connect: (self: Trove, signal: RBXScriptSignal, handler: (...any) -> ()) -> RBXScriptConnection,
	extend: (self: Trove) -> Trove,
	remove: (self: Trove, object: any) -> boolean,
	clean: (self: Trove) -> (),
	destroy: (self: Trove) -> (),
}

local Trove = {}
Trove.__index = Trove

-- Raeumt genau ein Objekt auf. Die Reihenfolge der Faelle ist bewusst:
-- Funktionen zuerst (billigster Test), dann Verbindungen, dann Instanzen.
local function cleanupOne(object: any)
	local t = typeof(object)
	if t == "function" then
		object()
	elseif t == "RBXScriptConnection" then
		object:Disconnect()
	elseif t == "Instance" then
		object:Destroy()
	elseif t == "table" then
		if typeof(object.destroy) == "function" then
			object:destroy()
		elseif typeof(object.Destroy) == "function" then
			object:Destroy()
		end
	end
end

function Trove.new(): Trove
	return (setmetatable({ _objects = {}, _cleaning = false }, Trove) :: any) :: Trove
end

-- Nimmt ein Objekt auf und gibt es unveraendert zurueck, damit sich
-- `local c = trove:add(part.Touched:Connect(fn))` in einer Zeile schreibt.
function Trove.add<T>(self: Trove, object: T): T
	table.insert(self._objects, object)
	return object
end

function Trove.connect(self: Trove, signal: RBXScriptSignal, handler: (...any) -> ()): RBXScriptConnection
	local conn = signal:Connect(handler)
	table.insert(self._objects, conn)
	return conn
end

-- Ein Unter-Trove, der mitgeleert wird. Praktisch fuer "alles zu diesem
-- einen Plot", das innerhalb eines laengerlebigen Troves liegt.
function Trove.extend(self: Trove): Trove
	local sub = Trove.new()
	table.insert(self._objects, sub)
	return sub
end

function Trove.remove(self: Trove, object: any): boolean
	local index = table.find(self._objects, object)
	if index == nil then
		return false
	end
	table.remove(self._objects, index)
	cleanupOne(object)
	return true
end

function Trove.clean(self: Trove)
	if self._cleaning then
		-- Schutz gegen Rekursion: ein aufgeraeumtes Objekt darf beim
		-- Aufraeumen nicht denselben Trove nochmal leeren.
		return
	end
	self._cleaning = true
	-- Rueckwaerts: zuletzt angelegte Objekte zuerst freigeben.
	for i = #self._objects, 1, -1 do
		local object = self._objects[i]
		self._objects[i] = nil
		-- Der Wrapper mit explizitem Rueckgabetyp ist noetig, damit pcall
		-- laut Typechecker zwei Werte liefert (cleanupOne gibt nichts zurueck).
		local ok, err = pcall(function(): string?
			cleanupOne(object)
			return nil
		end)
		if not ok then
			warn("[Trove] Aufraeumen fehlgeschlagen: " .. tostring(err))
		end
	end
	self._cleaning = false
end

function Trove.destroy(self: Trove)
	self:clean()
end

return Trove
