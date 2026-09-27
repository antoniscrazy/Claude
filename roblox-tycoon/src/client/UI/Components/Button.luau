--!strict
--[[
	Button – die Standardaktion.

	Varianten: primary, secondary, ghost, danger, premium, success.
	Zustaende: idle, hover, pressed, disabled, loading.

	Aufbau (vier Ebenen, mehr nicht):
	  TextButton (Flaeche, Radius, Rand, Verlauf)
	   +- UIScale        (Hover/Press-Feedback, veraendert NICHT die Groesse
	   |                  im Layout - sonst rechnet das UIListLayout jeden
	   |                  Frame neu und die Liste zappelt)
	   +- UIPadding      (Text klebt nie am Rand)
	   +- Inhalt         (Icon + Label in einem UIListLayout)

	Auf Touchgeraeten gibt es keinen Hover-Zustand - ein haengengebliebener
	Hover nach dem Antippen sieht aus wie ein Fehler.
]]

local UserInputService = game:GetService("UserInputService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Icon = require(UI.Icon)
local Motion = require(UI.Motion)
local Types = require(UI.Types)

local Button = {}

export type Props = {
	parent: Instance?,
	text: string,
	variant: Theme.Variant?,
	icon: Icon.Name?,
	size: UDim2?,
	position: UDim2?,
	anchor: Vector2?,
	zIndex: number,
	layoutOrder: number?,
	textSize: number?,
	onActivated: (() -> ())?,
}

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
	setState: (state: Types.ButtonState) -> (),
	setText: (text: string) -> (),
	setVariant: (variant: Theme.Variant) -> (),
	shake: () -> (),
	pulse: (color: Color3) -> (),
}

function Button.create(props: Props): Handle
	local variant: Theme.Variant = props.variant or "primary"
	local colors = Theme.variant(variant)
	local scope = Motion.scope()
	local state: Types.ButtonState = "idle"
	local touch = UserInputService.TouchEnabled and not UserInputService.MouseEnabled

	local button = Instance.new("TextButton")
	button.Name = "Button"
	button.Size = props.size or UDim2.new(1, 0, 0, Theme.Size.controlHeight)
	button.Position = props.position or UDim2.fromScale(0, 0)
	button.AnchorPoint = props.anchor or Vector2.zero
	button.BackgroundColor3 = colors.fill
	button.BorderSizePixel = 0
	button.AutoButtonColor = false
	button.Text = ""
	button.ZIndex = props.zIndex
	button.LayoutOrder = props.layoutOrder or 0
	button.Parent = props.parent

	Theme.corner(button, Theme.Radius.control)
	local stroke = Theme.stroke(button, colors.border, Theme.Stroke.thin)
	local gradient = Theme.gradient(button, colors.fill, Theme.Elevation.transparency / Theme.Space.x8)
	Theme.padding(button, { left = Theme.Space.x12, right = Theme.Space.x12 })

	local scale = Instance.new("UIScale")
	scale.Parent = button

	-- Inhalt: Icon und Text nebeneinander, zentriert, ueber ein Layout.
	local content = Instance.new("Frame")
	content.Name = "Content"
	content.Size = UDim2.fromScale(1, 1)
	content.BackgroundTransparency = Theme.Alpha.hidden
	content.ZIndex = props.zIndex + Theme.Depth.content
	content.Parent = button
	Theme.list({
		parent = content, gap = Theme.Space.x8,
		direction = Enum.FillDirection.Horizontal,
		hAlign = Enum.HorizontalAlignment.Center,
		vAlign = Enum.VerticalAlignment.Center,
	})

	local iconHolder: Frame? = nil
	if props.icon ~= nil then
		iconHolder = Icon.create({
			name = props.icon, parent = content, size = Theme.Size.iconSm,
			color = colors.label, zIndex = props.zIndex + Theme.Depth.raised,
			layoutOrder = 1,
		})
	end

	local label = Theme.label({
		name = "Text", parent = content, text = props.text, role = "heading",
		size = props.textSize or Theme.TextSize.md, color = colors.label,
		layoutSize = UDim2.fromOffset(0, Theme.Size.controlHeight),
		autoSize = Enum.AutomaticSize.X,
		xAlign = Enum.TextXAlignment.Center,
		zIndex = props.zIndex + Theme.Depth.raised,
		layoutOrder = 2,
		-- Auf gefuellten Akzentflaechen ist der Kontrast rechnerisch
		-- gesichert; eine Kontur wuerde die Schrift dort nur verschmieren.
		stroke = variant == "ghost" or variant == "secondary",
	})

	-- Ladeanzeige: rotierender Ring, ersetzt den Text.
	local spinner = Instance.new("Frame")
	spinner.Name = "Spinner"
	spinner.Size = UDim2.fromOffset(Theme.Size.iconSm, Theme.Size.iconSm)
	spinner.Position = UDim2.fromScale(0.5, 0.5)
	spinner.AnchorPoint = Vector2.new(0.5, 0.5)
	spinner.BackgroundTransparency = Theme.Alpha.hidden
	spinner.ZIndex = props.zIndex + Theme.Depth.overlay
	spinner.Visible = false
	spinner.Parent = button
	local spinnerArc = Instance.new("Frame")
	spinnerArc.Size = UDim2.fromScale(1, 1)
	spinnerArc.BackgroundTransparency = Theme.Alpha.hidden
	spinnerArc.ZIndex = spinner.ZIndex
	spinnerArc.Parent = spinner
	Theme.stroke(spinnerArc, colors.label, Theme.Stroke.thin)
	Theme.corner(spinnerArc, Theme.Radius.pill)
	local notch = Instance.new("Frame")
	notch.Size = UDim2.fromScale(0.5, 0.5)
	notch.BackgroundColor3 = colors.fill
	notch.BorderSizePixel = 0
	notch.ZIndex = spinner.ZIndex + Theme.Depth.content
	notch.Parent = spinnerArc
	local spinTween: Tween? = nil

	-- ---- Zustandslogik ---------------------------------------------------

	local function fillFor(current: Types.ButtonState): Color3
		if current == "hover" then
			return colors.fillHover
		elseif current == "pressed" then
			return colors.fillPressed
		end
		return colors.fill
	end

	local function apply(next_: Types.ButtonState, duration: number)
		state = next_
		local disabled = next_ == "disabled"
		local loading = next_ == "loading"

		button.Active = not (disabled or loading)
		button.AutoButtonColor = false
		content.Visible = not loading
		spinner.Visible = loading

		local targetScale = if next_ == "hover" then Theme.Scale.hover
			elseif next_ == "pressed" then Theme.Scale.pressed
			else Theme.Scale.rest

		scope:to(button, {
			BackgroundColor3 = fillFor(next_),
			-- Deaktiviert: Flaeche halbdurchlaessig, damit sie sich
			-- eindeutig von "nur dunkler" unterscheidet.
			BackgroundTransparency = if disabled then Theme.Alpha.ghost else Theme.Alpha.opaque,
		}, duration, "enter")
		scope:to(scale, { Scale = targetScale }, duration, if next_ == "pressed" then "press" else "enter")
		scope:to(stroke, {
			Transparency = if disabled then Theme.Alpha.veil else Theme.Alpha.opaque,
		}, duration, "enter")
		scope:to(label, {
			TextTransparency = if disabled then Theme.Alpha.veil else Theme.Alpha.opaque,
		}, duration, "enter")

		if loading then
			local info = Theme.loopInfo(Theme.Duration.spin)
			if info ~= nil and spinTween == nil then
				spinTween = game:GetService("TweenService"):Create(
					spinnerArc, info, { Rotation = 360 })
				local active = spinTween
				if active ~= nil then
					active:Play()
				end
			end
		elseif spinTween ~= nil then
			spinTween:Cancel()
			spinTween:Destroy()
			spinTween = nil
			spinnerArc.Rotation = 0
		end
	end

	-- ---- Eingaben ----------------------------------------------------------

	if not touch then
		scope:track(button.MouseEnter:Connect(function()
			if state == "idle" then
				apply("hover", Theme.Duration.fast)
			end
		end))
		scope:track(button.MouseLeave:Connect(function()
			if state == "hover" or state == "pressed" then
				apply("idle", Theme.Duration.fast)
			end
		end))
	end

	scope:track(button.MouseButton1Down:Connect(function()
		if state == "disabled" or state == "loading" then
			return
		end
		apply("pressed", Theme.Duration.press)
	end))
	scope:track(button.MouseButton1Up:Connect(function()
		if state == "disabled" or state == "loading" then
			return
		end
		-- Loslassen federt ueber Back/Out zurueck.
		state = if touch then "idle" else "hover"
		scope:to(button, { BackgroundColor3 = fillFor(state) }, Theme.Duration.fast, "enter")
		scope:to(scale, { Scale = Theme.Scale.rest }, Theme.Duration.base, "pop")
	end))
	scope:track(button.Activated:Connect(function()
		if state == "disabled" or state == "loading" then
			return
		end
		local callback = props.onActivated
		if callback ~= nil then
			callback()
		end
	end))

	apply("idle", Theme.Duration.fast)

	-- ---- Handle -------------------------------------------------------------

	local handle: Handle
	handle = {
		instance = button,

		setState = function(next_: Types.ButtonState)
			apply(next_, Theme.Duration.fast)
		end,

		setText = function(text: string)
			label.Text = text
		end,

		setVariant = function(nextVariant: Theme.Variant)
			colors = Theme.variant(nextVariant)
			stroke.Color = colors.border
			label.TextColor3 = colors.label
			notch.BackgroundColor3 = colors.fill
			gradient.Color = ColorSequence.new({
				ColorSequenceKeypoint.new(0, colors.fill),
				ColorSequenceKeypoint.new(1, colors.fill),
			})
			if iconHolder ~= nil then
				Icon.recolor(iconHolder, colors.label)
			end
			apply(state, Theme.Duration.fast)
		end,

		--[[
			Fehlermeldung ohne Popup: kurzes horizontales Ruetteln.
			Drei Schwingungen in Theme.Duration.shake, danach exakt zurueck
			auf die Ausgangsposition - sonst wandert der Knopf im Layout.
		]]
		shake = function()
			local home = button.Position
			local amount = Theme.Space.x8 - Theme.Space.x2
			local step = Theme.Duration.shake / Theme.Space.x4
			local offsets = { amount, -amount, amount * 0.6, -amount * 0.6, 0 }
			task.spawn(function()
				for _, dx in ipairs(offsets) do
					scope:to(button, {
						Position = home + UDim2.fromOffset(dx, 0),
					}, step, "enter")
					task.wait(step)
				end
				button.Position = home
			end)
		end,

		-- Einmaliges Aufleuchten, z. B. nach erfolgreichem Kauf.
		pulse = function(color: Color3)
			scope:to(stroke, { Color = color, Thickness = Theme.Stroke.thick },
				Theme.Duration.fast, "pop")
			task.delay(Theme.Duration.base, function()
				if button.Parent == nil then
					return
				end
				scope:to(stroke, { Color = colors.border, Thickness = Theme.Stroke.thin },
					Theme.Duration.slow, "exit")
			end)
		end,

		destroy = function()
			if spinTween ~= nil then
				spinTween:Cancel()
				spinTween:Destroy()
				spinTween = nil
			end
			scope:destroy()
			button:Destroy()
		end,
	}
	return handle
end

return Button
