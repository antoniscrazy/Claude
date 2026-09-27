--!strict
--[[
	Layers – feste ZIndex-Baender.

	Ohne zentrale Vergabe landet frueher oder spaeter ein Tooltip hinter
	einem Panel oder ein Toast hinter dem Modal-Overlay, und jemand
	"repariert" das mit ZIndex = 9999. Die Baender aus Theme.Layer sind
	100 breit; innerhalb eines Bandes vergibt Theme.Depth die Feinstufen.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local Layers = {}

export type Band = "world" | "hud" | "panel" | "modal" | "toast" | "tooltip"

function Layers.base(band: Band): number
	return (Theme.Layer :: { [string]: number })[band]
end

-- Ebene innerhalb eines Bandes: Layers.at("panel", Theme.Depth.content)
function Layers.at(band: Band, depth: number): number
	return Layers.base(band) + depth
end

return Layers
