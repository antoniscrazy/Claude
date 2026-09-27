--!strict
--[[
	Card – duenne Huelle um Theme.Card, damit Bildschirme eine Komponente
	mit Cleanup verwenden statt die Factory direkt.

	Die vier Schichten (Schatten, Flaeche, Rand, Verlauf) liegen bewusst
	in Theme.Card und nicht hier: auch Weltobjekte und Panels nutzen sie,
	und eine zweite Implementierung wuerde unweigerlich abweichen.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local Card = {}

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
}

function Card.create(props: Theme.CardProps): Handle
	local frame = Theme.Card(props)
	return {
		instance = frame,
		destroy = function()
			frame:Destroy()
		end,
	}
end

return Card
