--!strict
--[[
	Badge – kleiner Marker fuer ungelesene oder abholbare Inhalte.

	Zwei Formen: reiner Punkt (ohne Zahl) und Zahlenkapsel. Sitzt immer in
	der oberen rechten Ecke seines Elternelements und liegt eine Feinstufe
	darueber, damit ihn kein Icon verdeckt.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Motion = require(UI.Motion)

local Badge = {}

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
	set: (visible: boolean, count: number?) -> (),
}

function Badge.create(parent: GuiObject, zIndex: number): Handle
	local scope = Motion.scope()

	local dot = Instance.new("Frame")
	dot.Name = "Badge"
	dot.Size = UDim2.fromOffset(Theme.Size.badge, Theme.Size.badge)
	dot.Position = UDim2.fromScale(1, 0)
	dot.AnchorPoint = Vector2.new(0.5, 0.5)
	dot.BackgroundColor3 = Theme.Color.danger
	dot.BorderSizePixel = 0
	dot.ZIndex = zIndex
	dot.Visible = false
	dot.Parent = parent
	Theme.corner(dot, Theme.Radius.pill)
	-- Dunkler Ring: hebt den Marker von jeder Untergrundfarbe ab.
	Theme.stroke(dot, Theme.Color.bg0, Theme.Stroke.thin)

	local count = Theme.label({
		name = "Count", parent = dot, text = "", role = "numeric",
		size = Theme.TextSize.xs, color = Theme.Color.bg0,
		xAlign = Enum.TextXAlignment.Center,
		zIndex = zIndex + Theme.Depth.content, stroke = false,
	})

	local scale = Instance.new("UIScale")
	scale.Parent = dot

	return {
		instance = dot,
		set = function(visible: boolean, value: number?)
			if visible and not dot.Visible then
				dot.Visible = true
				scale.Scale = Theme.Scale.panelEnter
				scope:to(scale, { Scale = Theme.Scale.rest }, Theme.Duration.base, "pop")
			elseif not visible and dot.Visible then
				dot.Visible = false
			end
			if value ~= nil and value > 0 then
				count.Text = tostring(value)
				dot.Size = UDim2.fromOffset(Theme.Size.badge + Theme.Space.x8, Theme.Size.badge)
			else
				count.Text = ""
				dot.Size = UDim2.fromOffset(Theme.Size.badge, Theme.Size.badge)
			end
		end,
		destroy = function()
			scope:destroy()
			dot:Destroy()
		end,
	}
end

return Badge
