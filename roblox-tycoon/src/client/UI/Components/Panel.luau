--!strict
--[[
	Panel – der Rahmen aller Dialoge.

	Aufbau:
	  Card (Schatten, Radius panel, Rand, Verlauf)
	   +- Header  (Titel, Untertitel, Close)
	   +- Divider
	   +- Body    (Frame oder ScrollingFrame, je nach `scrolling`)

	Groesse: Scale-basiert mit UISizeConstraint als Deckel und einem
	UIAspectRatioConstraint, dessen Verhaeltnis je nach Ausrichtung
	umgeschaltet wird. Ein fest eingestelltes Querformat-Verhaeltnis
	waere im Hochformat nur noch ein flacher Streifen.

	Ein- und Ausblenden laeuft IMMER ueber Tween (Scale 0.92 -> 1 plus
	Transparenz); `Visible` wird nur am Ende der Ausblend-Animation
	gesetzt, nie als alleiniges Mittel.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Icon = require(UI.Icon)
local Layers = require(UI.Layers)
local Motion = require(UI.Motion)
local Responsive = require(UI.Responsive)
local Modal = require(script.Parent.Modal)

local Panel = {}

export type Props = {
	parent: Instance,
	gui: ScreenGui,
	name: string,
	title: string,
	subtitle: string?,
	scrolling: boolean?,
	accent: Color3?,
	onClose: (() -> ())?,
}

export type Handle = {
	instance: GuiObject,
	body: GuiObject,
	destroy: (() -> ()),
	open: () -> (),
	close: () -> (),
	toggle: () -> (),
	isOpen: () -> boolean,
	setSubtitle: (text: string) -> (),
}

local ASPECT_LANDSCAPE = 1.45
local ASPECT_PORTRAIT = 0.78

function Panel.create(props: Props): Handle
	local scope = Motion.scope()
	local accent = props.accent or Theme.Color.primary
	local zIndex = Layers.at("panel", Theme.Depth.base)
	local open = false

	local card = Theme.Card({
		name = props.name, parent = props.parent,
		size = UDim2.fromScale(0.9, 0.84),
		position = UDim2.fromScale(0.5, 0.5),
		anchor = Vector2.new(0.5, 0.5),
		fill = Theme.Color.bg1,
		radius = Theme.Radius.panel,
		strokeColor = accent,
		zIndex = zIndex,
		visible = false,
	})

	local sizeLimit = Instance.new("UISizeConstraint")
	sizeLimit.MaxSize = Vector2.new(Theme.Size.panelWidth, Theme.Size.panelHeight)
	sizeLimit.MinSize = Vector2.new(Theme.Size.slotWidth, Theme.Size.panelHeaderHeight * 3)
	sizeLimit.Parent = card

	local aspect = Instance.new("UIAspectRatioConstraint")
	aspect.AspectType = Enum.AspectType.FitWithinMaxSize
	aspect.DominantAxis = Enum.DominantAxis.Width
	aspect.Parent = card

	local scale = Instance.new("UIScale")
	scale.Parent = card

	-- ---- Kopfzeile -------------------------------------------------------
	local header = Instance.new("Frame")
	header.Name = "Header"
	header.Size = UDim2.new(1, 0, 0, Theme.Size.panelHeaderHeight)
	header.BackgroundTransparency = Theme.Alpha.hidden
	header.ZIndex = zIndex + Theme.Depth.content
	header.Parent = card
	Theme.padding(header, { left = Theme.Space.x24, right = Theme.Space.x16, top = Theme.Space.x16 })

	Theme.label({
		name = "Title", parent = header, text = props.title, role = "display",
		size = Theme.TextSize.xl, color = accent,
		layoutSize = UDim2.new(1, -Theme.Size.iconButton, 0, Theme.Space.x32),
		zIndex = zIndex + Theme.Depth.raised,
	})
	local subtitle = Theme.label({
		name = "Subtitle", parent = header, text = props.subtitle or "", role = "body",
		size = Theme.TextSize.sm, color = Theme.Color.textLow,
		layoutSize = UDim2.new(1, -Theme.Size.iconButton, 0, Theme.Space.x16),
		position = UDim2.fromOffset(0, Theme.Space.x32),
		zIndex = zIndex + Theme.Depth.raised, stroke = false,
	})

	local close = Instance.new("TextButton")
	close.Name = "Close"
	close.Size = UDim2.fromOffset(Responsive.minTouchSize(), Responsive.minTouchSize())
	close.Position = UDim2.fromScale(1, 0)
	close.AnchorPoint = Vector2.new(1, 0)
	close.BackgroundColor3 = Theme.Color.bg3
	close.BorderSizePixel = 0
	close.AutoButtonColor = false
	close.Text = ""
	close.ZIndex = zIndex + Theme.Depth.raised
	close.Parent = header
	Theme.corner(close, Theme.Radius.control)
	local closeStroke = Theme.stroke(close, Theme.Color.bg3, Theme.Stroke.hair)
	local closeGlyph = Icon.create({
		name = "close", parent = close, size = Theme.Size.iconSm,
		color = Theme.Color.textMid, zIndex = zIndex + Theme.Depth.overlay,
		anchor = Vector2.new(0.5, 0.5), position = UDim2.fromScale(0.5, 0.5),
	})
	scope:track(close.MouseEnter:Connect(function()
		scope:to(closeStroke, { Color = Theme.Color.danger }, Theme.Duration.fast, "enter")
		Icon.recolor(closeGlyph, Theme.Color.danger)
	end))
	scope:track(close.MouseLeave:Connect(function()
		scope:to(closeStroke, { Color = Theme.Color.bg3 }, Theme.Duration.fast, "enter")
		Icon.recolor(closeGlyph, Theme.Color.textMid)
	end))

	local divider = Theme.divider(card, 0)
	divider.Position = UDim2.fromOffset(0, Theme.Size.panelHeaderHeight)
	divider.ZIndex = zIndex + Theme.Depth.content

	-- ---- Inhalt ------------------------------------------------------------
	local body: GuiObject
	if props.scrolling then
		local scroll = Instance.new("ScrollingFrame")
		scroll.Name = "Body"
		scroll.BackgroundTransparency = Theme.Alpha.hidden
		scroll.BorderSizePixel = 0
		scroll.ScrollBarThickness = Theme.Size.scrollBar
		scroll.ScrollBarImageColor3 = Theme.Color.bg3
		scroll.ScrollBarImageTransparency = Theme.Alpha.veil
		scroll.CanvasSize = UDim2.new()
		scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
		scroll.ScrollingDirection = Enum.ScrollingDirection.Y
		scroll.ElasticBehavior = Enum.ElasticBehavior.Never
		body = scroll
	else
		local frame = Instance.new("Frame")
		frame.Name = "Body"
		frame.BackgroundTransparency = Theme.Alpha.hidden
		body = frame
	end
	body.Size = UDim2.new(1, 0, 1, -(Theme.Size.panelHeaderHeight + Theme.Size.dividerHeight))
	body.Position = UDim2.fromOffset(0, Theme.Size.panelHeaderHeight + Theme.Size.dividerHeight)
	body.ZIndex = zIndex + Theme.Depth.content
	body.Parent = card
	Theme.padding(body, { all = Theme.Space.x16 })

	-- ---- Ausrichtung ---------------------------------------------------------
	local function applyViewport()
		local viewport = Responsive.read(props.gui)
		aspect.AspectRatio = if viewport.portrait then ASPECT_PORTRAIT else ASPECT_LANDSCAPE
	end
	applyViewport()
	scope:track(props.gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(applyViewport))

	-- ---- Oeffnen und Schliessen -------------------------------------------------
	local function doOpen()
		if open then
			return
		end
		open = true
		Modal.push()
		card.Visible = true
		scale.Scale = Theme.Scale.panelEnter
		card.BackgroundTransparency = Theme.Alpha.hidden
		scope:to(scale, { Scale = Theme.Scale.rest }, Theme.Duration.base, "enter")
		scope:to(card, { BackgroundTransparency = Theme.Alpha.opaque },
			Theme.Duration.base, "enter")
	end

	local function doClose()
		if not open then
			return
		end
		open = false
		Modal.pop()
		scope:to(scale, { Scale = Theme.Scale.panelEnter }, Theme.Duration.base, "exit")
		local fade = scope:to(card, { BackgroundTransparency = Theme.Alpha.hidden },
			Theme.Duration.base, "exit")
		fade.Completed:Once(function()
			if not open then
				card.Visible = false
			end
		end)
		local callback = props.onClose
		if callback ~= nil then
			callback()
		end
	end

	scope:track(close.Activated:Connect(doClose))

	return {
		instance = card,
		body = body,
		open = doOpen,
		close = doClose,
		toggle = function()
			if open then
				doClose()
			else
				doOpen()
			end
		end,
		isOpen = function(): boolean
			return open
		end,
		setSubtitle = function(text: string)
			subtitle.Text = text
		end,
		destroy = function()
			if open then
				Modal.pop()
				open = false
			end
			scope:destroy()
			card:Destroy()
		end,
	}
end

return Panel
