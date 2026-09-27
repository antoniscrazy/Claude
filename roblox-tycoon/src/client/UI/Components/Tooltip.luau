--!strict
--[[
	Tooltip – einer fuer das ganze Interface.

	Bewusst ein Singleton statt eines Tooltips pro Knopf: es kann immer
	nur einer sichtbar sein, und ein wandernder Tooltip haelt die
	Instanzzahl konstant statt mit jedem Knopf zu wachsen.

	Auf Touchgeraeten wird der Tooltip nie angezeigt - es gibt dort kein
	Hover, und ein Tooltip beim Antippen verdeckt nur das Ziel.
]]

local UserInputService = game:GetService("UserInputService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Layers = require(UI.Layers)
local Motion = require(UI.Motion)

local Tooltip = {}

local frame: Frame? = nil
local label: TextLabel? = nil
local scope = Motion.scope()

function Tooltip.build(root: GuiObject)
	if frame ~= nil then
		return
	end
	local zIndex = Layers.at("tooltip", Theme.Depth.base)
	local card = Theme.Card({
		name = "Tooltip", parent = root,
		size = UDim2.fromOffset(Theme.Size.tooltipMaxWidth, Theme.Size.controlHeightSm),
		anchor = Vector2.new(0.5, 1),
		fill = Theme.Color.bg3,
		radius = Theme.Radius.control,
		zIndex = zIndex,
		padding = Theme.Space.x8,
		visible = false,
	})
	card.AutomaticSize = Enum.AutomaticSize.X

	label = Theme.label({
		parent = card, text = "", role = "body",
		size = Theme.TextSize.sm, color = Theme.Color.textHigh,
		layoutSize = UDim2.fromScale(1, 1),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = zIndex + Theme.Depth.content,
	})
	frame = card
end

-- Zeigt den Tooltip mittig ueber dem uebergebenen Element.
function Tooltip.show(anchor: GuiObject, text: string)
	if UserInputService.TouchEnabled and not UserInputService.MouseEnabled then
		return
	end
	local card, textLabel = frame, label
	if card == nil or textLabel == nil then
		return
	end
	textLabel.Text = text
	local position = anchor.AbsolutePosition
	local size = anchor.AbsoluteSize
	card.Position = UDim2.fromOffset(
		math.floor(position.X + size.X / 2),
		math.floor(position.Y - Theme.Space.x8)
	)
	card.Visible = true
	card.BackgroundTransparency = Theme.Alpha.hidden
	scope:to(card, { BackgroundTransparency = Theme.Alpha.opaque }, Theme.Duration.fast, "enter")
end

function Tooltip.hide()
	local card = frame
	if card == nil or not card.Visible then
		return
	end
	local tween = scope:to(card, { BackgroundTransparency = Theme.Alpha.hidden },
		Theme.Duration.fast, "exit")
	tween.Completed:Once(function()
		if frame ~= nil then
			frame.Visible = false
		end
	end)
end

function Tooltip.destroy()
	scope:destroy()
	if frame ~= nil then
		frame:Destroy()
		frame = nil
		label = nil
	end
end

return Tooltip
