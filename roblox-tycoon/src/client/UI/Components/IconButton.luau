--!strict
--[[
	IconButton – quadratischer Knopf fuer die HUD-Leiste.

	Unterschiede zum Button: kein Text in der Flaeche, dafuer Tooltip bei
	Hover und optionaler Badge. Die Kantenlaenge kommt aus
	Responsive.minTouchSize(), damit die Flaeche auch bei der kleinsten
	erlaubten UIScale noch ueber 44 px liegt.
]]

local UserInputService = game:GetService("UserInputService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Icon = require(UI.Icon)
local Motion = require(UI.Motion)
local Responsive = require(UI.Responsive)
local Badge = require(script.Parent.Badge)
local Tooltip = require(script.Parent.Tooltip)

local IconButton = {}

export type Props = {
	parent: Instance?,
	icon: Icon.Name,
	tooltip: string,
	zIndex: number,
	layoutOrder: number?,
	accent: Color3?,
	onActivated: (() -> ())?,
}

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
	setBadge: (visible: boolean, count: number?) -> (),
	setActive: (active: boolean) -> (),
}

function IconButton.create(props: Props): Handle
	local scope = Motion.scope()
	local accent = props.accent or Theme.Color.primary
	local touch = UserInputService.TouchEnabled and not UserInputService.MouseEnabled
	local side = Responsive.minTouchSize()

	local button = Instance.new("TextButton")
	button.Name = "IconButton_" .. props.icon
	button.Size = UDim2.fromOffset(side, side)
	button.BackgroundColor3 = Theme.Color.bg2
	button.BorderSizePixel = 0
	button.AutoButtonColor = false
	button.Text = ""
	button.ZIndex = props.zIndex
	button.LayoutOrder = props.layoutOrder or 0
	button.Parent = props.parent

	Theme.shadow(button, Theme.Radius.control)
	Theme.corner(button, Theme.Radius.control)
	local stroke = Theme.stroke(button, Theme.Color.bg3, Theme.Stroke.hair)
	Theme.gradient(button, Theme.Color.bg2, Theme.Elevation.transparency / Theme.Space.x8)

	local glyph = Icon.create({
		name = props.icon, parent = button, size = Theme.Size.iconInner,
		color = Theme.Color.textMid, zIndex = props.zIndex + Theme.Depth.content,
		anchor = Vector2.new(0.5, 0.5), position = UDim2.fromScale(0.5, 0.5),
	})

	local scale = Instance.new("UIScale")
	scale.Parent = button

	local badge = Badge.create(button, props.zIndex + Theme.Depth.overlay)
	local active = false

	local function paint(hover: boolean, pressed: boolean)
		local fill = if pressed then Theme.Color.bg1
			elseif hover or active then Theme.Color.bg3
			else Theme.Color.bg2
		scope:to(button, { BackgroundColor3 = fill }, Theme.Duration.fast, "enter")
		scope:to(stroke, { Color = if hover or active then accent else Theme.Color.bg3 },
			Theme.Duration.fast, "enter")
		Icon.recolor(glyph, if hover or active then accent else Theme.Color.textMid)
		scope:to(scale, {
			Scale = if pressed then Theme.Scale.pressed
				elseif hover then Theme.Scale.hover
				else Theme.Scale.rest,
		}, if pressed then Theme.Duration.press else Theme.Duration.fast,
			if pressed then "press" else "enter")
	end

	if not touch then
		scope:track(button.MouseEnter:Connect(function()
			paint(true, false)
			Tooltip.show(button, props.tooltip)
		end))
		scope:track(button.MouseLeave:Connect(function()
			paint(false, false)
			Tooltip.hide()
		end))
	end
	scope:track(button.MouseButton1Down:Connect(function()
		paint(true, true)
	end))
	scope:track(button.MouseButton1Up:Connect(function()
		scope:to(scale, { Scale = Theme.Scale.rest }, Theme.Duration.base, "pop")
		paint(not touch, false)
	end))
	scope:track(button.Activated:Connect(function()
		local callback = props.onActivated
		if callback ~= nil then
			callback()
		end
	end))

	return {
		instance = button,
		setBadge = badge.set,
		setActive = function(value: boolean)
			active = value
			paint(false, false)
		end,
		destroy = function()
			badge.destroy()
			scope:destroy()
			button:Destroy()
		end,
	}
end

return IconButton
