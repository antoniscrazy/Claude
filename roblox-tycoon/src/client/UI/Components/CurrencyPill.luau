--!strict
--[[
	CurrencyPill – Guthabenanzeige im HUD.

	Aufbau: rundes Icon-Feld in Akzentfarbe, Zahl rechts davon,
	optionaler Plus-Knopf ganz rechts.

	Zwei Details, die den Unterschied machen:

	  * Die Zahl zaehlt hoch statt zu springen. Ein NumberValue wird
	    getweent, sein Changed-Ereignis formatiert den Text. Bei
	    reduzierter Bewegung ist die Tweendauer 0 und der Wert steht sofort.
	  * Die Zahl ist RECHTSBUENDIG in einem Feld fester Breite. Gotham hat
	    keine Tabellenziffern; linksbuendig wuerde der Text bei jeder
	    Stellenaenderung sichtbar zappeln.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Format = require(Shared.Format)
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Icon = require(UI.Icon)
local Motion = require(UI.Motion)

local CurrencyPill = {}

export type Props = {
	parent: Instance?,
	icon: Icon.Name,
	caption: string,
	accent: Color3,
	zIndex: number,
	layoutOrder: number?,
	onPlus: (() -> ())?,
}

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
	setValue: (value: number) -> (),
	flashError: () -> (),
}

function CurrencyPill.create(props: Props): Handle
	local scope = Motion.scope()

	local card = Theme.Card({
		name = "Pill_" .. props.icon,
		parent = props.parent,
		size = UDim2.fromOffset(Theme.Size.pillWidth, Theme.Size.pillHeight),
		fill = Theme.Color.bg2,
		radius = Theme.Radius.pill,
		zIndex = props.zIndex,
	})
	card.LayoutOrder = props.layoutOrder or 0
	Theme.padding(card, { all = Theme.Space.x4, right = Theme.Space.x12 })

	-- Rundes Icon-Feld
	local badge = Instance.new("Frame")
	badge.Name = "IconField"
	badge.Size = UDim2.fromOffset(Theme.Size.pillIcon + Theme.Space.x8,
		Theme.Size.pillIcon + Theme.Space.x8)
	badge.Position = UDim2.fromScale(0, 0.5)
	badge.AnchorPoint = Vector2.new(0, 0.5)
	badge.BackgroundColor3 = props.accent
	badge.BorderSizePixel = 0
	badge.ZIndex = props.zIndex + Theme.Depth.content
	badge.Parent = card
	Theme.corner(badge, Theme.Radius.pill)
	Theme.gradient(badge, props.accent, Theme.Elevation.transparency / Theme.Space.x8)
	Icon.create({
		name = props.icon, parent = badge, size = Theme.Size.iconInner,
		color = Theme.Color.bg0, zIndex = props.zIndex + Theme.Depth.raised,
		anchor = Vector2.new(0.5, 0.5), position = UDim2.fromScale(0.5, 0.5),
	})

	Theme.label({
		name = "Caption", parent = card, text = props.caption, role = "body",
		size = Theme.TextSize.xs, color = Theme.Color.textLow,
		layoutSize = UDim2.new(1, -(Theme.Size.pillIcon + Theme.Space.x32), 0, Theme.Space.x16),
		position = UDim2.fromOffset(Theme.Size.pillIcon + Theme.Space.x16, Theme.Space.x4),
		zIndex = props.zIndex + Theme.Depth.content, stroke = false,
	})

	local value = Theme.label({
		name = "Value", parent = card, text = "0", role = "numeric",
		size = Theme.TextSize.lg, color = Theme.Color.textHigh,
		layoutSize = UDim2.new(1, -(Theme.Size.pillIcon + Theme.Space.x32), 0, Theme.Space.x24),
		position = UDim2.fromOffset(Theme.Size.pillIcon + Theme.Space.x16, Theme.Space.x16),
		-- Rechtsbuendig: siehe Kopfkommentar (Ziffern zappeln sonst).
		xAlign = Enum.TextXAlignment.Right,
		zIndex = props.zIndex + Theme.Depth.content,
	})

	-- Der getweente Zwischenwert fuer das Hochzaehlen.
	local counter = Instance.new("NumberValue")
	counter.Parent = card
	local displayed = 0

	scope:track(counter.Changed:Connect(function(current: number)
		value.Text = Format.abbreviate(current)
	end))

	return {
		instance = card,

		setValue = function(target: number)
			if target == displayed then
				return
			end
			-- Farbe kurz anpassen: Zuwachs gruen, Abzug in Akzentfarbe.
			local rising = target > displayed
			displayed = target
			scope:to(counter, { Value = target }, Theme.Duration.countUp, "enter")
			scope:to(value, {
				TextColor3 = if rising then Theme.Color.success else props.accent,
			}, Theme.Duration.fast, "enter")
			task.delay(Theme.Duration.countUp, function()
				if card.Parent == nil then
					return
				end
				scope:to(value, { TextColor3 = Theme.Color.textHigh },
					Theme.Duration.slow, "exit")
			end)
		end,

		-- "Zu wenig Geld": Zahl blinkt rot, kein Popup.
		flashError = function()
			scope:to(value, { TextColor3 = Theme.Color.danger }, Theme.Duration.press, "enter")
			task.delay(Theme.Duration.slow, function()
				if card.Parent == nil then
					return
				end
				scope:to(value, { TextColor3 = Theme.Color.textHigh },
					Theme.Duration.base, "exit")
			end)
		end,

		destroy = function()
			scope:destroy()
			card:Destroy()
		end,
	}
end

return CurrencyPill
