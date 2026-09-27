--!strict
--[[
	ItemSlot – ein Shop-Eintrag.

	Aufbau (vier Ebenen):
	  Card
	   +- Preview (ViewportFrame mit echtem 3D-Modell)
	   +- Textblock (Name, Beschreibung)  -> UIListLayout
	   +- Fussleiste (Preis + Button oder Status)

	Drei Zustaende, die sich nicht nur in der Farbe unterscheiden:
	  * kaufbar   – Akzentrand, Preis in Cash-Farbe, Knopf aktiv
	  * zu teuer  – Rand neutral, Preis gedaempft, Knopf deaktiviert
	  * gesperrt  – Vorschau abgedunkelt, Schloss-Symbol, Voraussetzungstext
	  * gekauft   – abgedunkelt, Haekchen statt Knopf

	Nur Farbe zu aendern reicht nicht: Symbol und Text tragen dieselbe
	Aussage, damit der Zustand auch ohne Farbwahrnehmung lesbar ist.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Format = require(Shared.Format)
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Icon = require(UI.Icon)
local Motion = require(UI.Motion)
local Preview = require(UI.Preview)
local Button = require(script.Parent.Button)

local ItemSlot = {}

export type State = "buyable" | "tooExpensive" | "locked" | "owned"

export type Props = {
	parent: Instance,
	id: string,
	rank: number,
	title: string,
	description: string,
	price: number,
	kind: Preview.Kind,
	zIndex: number,
	layoutOrder: number,
	onBuy: (() -> ())?,
}

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
	setState: (state: State, detail: string?) -> (),
	celebrate: () -> (),
	reject: () -> (),
}

function ItemSlot.create(props: Props): Handle
	local scope = Motion.scope()
	local zIndex = props.zIndex

	local card = Theme.Card({
		name = "Slot_" .. props.id, parent = props.parent,
		size = UDim2.fromOffset(Theme.Size.slotWidth, Theme.Size.slotHeight),
		fill = Theme.Color.bg2,
		radius = Theme.Radius.card,
		zIndex = zIndex,
	})
	card.LayoutOrder = props.layoutOrder
	Theme.padding(card, { all = Theme.Space.x12 })
	local cardStroke = card:FindFirstChildOfClass("UIStroke")

	-- Rangzahl als kleiner Chip oben links
	local rankChip = Instance.new("Frame")
	rankChip.Name = "Rank"
	rankChip.Size = UDim2.fromOffset(Theme.Space.x24, Theme.Space.x24)
	rankChip.Position = UDim2.fromScale(0, 0)
	rankChip.BackgroundColor3 = Theme.Color.bg0
	rankChip.BorderSizePixel = 0
	rankChip.ZIndex = zIndex + Theme.Depth.overlay
	rankChip.Parent = card
	Theme.corner(rankChip, Theme.Radius.chip)
	Theme.label({
		parent = rankChip, text = tostring(props.rank), role = "numeric",
		size = Theme.TextSize.xs, color = Theme.Color.textLow,
		xAlign = Enum.TextXAlignment.Center,
		zIndex = zIndex + Theme.Depth.overlay, stroke = false,
	})

	local preview = Preview.create({
		parent = card, kind = props.kind, accent = Theme.Color.primary,
		size = UDim2.new(1, 0, 0, Theme.Size.slotPreview),
		zIndex = zIndex + Theme.Depth.content,
	})

	-- Schloss ueber der Vorschau, nur im Zustand "gesperrt"
	local lockOverlay = Instance.new("Frame")
	lockOverlay.Name = "Lock"
	lockOverlay.Size = UDim2.fromScale(1, 1)
	lockOverlay.BackgroundColor3 = Theme.Color.bg0
	lockOverlay.BackgroundTransparency = Theme.Alpha.veil
	lockOverlay.BorderSizePixel = 0
	lockOverlay.Visible = false
	lockOverlay.ZIndex = zIndex + Theme.Depth.raised
	lockOverlay.Parent = preview.instance
	Theme.corner(lockOverlay, Theme.Radius.control)
	Icon.create({
		name = "lock", parent = lockOverlay, size = Theme.Size.pillIcon,
		color = Theme.Color.textMid, zIndex = zIndex + Theme.Depth.overlay,
		anchor = Vector2.new(0.5, 0.5), position = UDim2.fromScale(0.5, 0.5),
	})

	local title = Theme.label({
		name = "Title", parent = card, text = props.title, role = "heading",
		size = Theme.TextSize.md, color = Theme.Color.textHigh,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x24),
		position = UDim2.fromOffset(0, Theme.Size.slotPreview + Theme.Space.x8),
		zIndex = zIndex + Theme.Depth.content,
	})
	local description = Theme.label({
		name = "Desc", parent = card, text = props.description, role = "body",
		size = Theme.TextSize.xs, color = Theme.Color.textLow,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x32),
		position = UDim2.fromOffset(0, Theme.Size.slotPreview + Theme.Space.x32),
		wrapped = true, yAlign = Enum.TextYAlignment.Top,
		zIndex = zIndex + Theme.Depth.content, stroke = false,
	})

	local price = Theme.label({
		name = "Price", parent = card, text = Format.abbreviate(props.price) .. " $",
		role = "numeric",
		size = Theme.TextSize.md, color = Theme.Color.success,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x24),
		position = UDim2.new(0, 0, 1, -(Theme.Size.controlHeight + Theme.Space.x24)),
		zIndex = zIndex + Theme.Depth.content,
	})

	local buy = Button.create({
		parent = card, text = "KAUFEN", variant = "primary", icon = "plus",
		size = UDim2.new(1, 0, 0, Theme.Size.controlHeight),
		position = UDim2.new(0, 0, 1, -Theme.Size.controlHeight),
		zIndex = zIndex + Theme.Depth.content,
		textSize = Theme.TextSize.sm,
		onActivated = props.onBuy,
	})

	-- Statuszeile, ersetzt den Knopf bei "gekauft"
	local ownedRow = Instance.new("Frame")
	ownedRow.Name = "Owned"
	ownedRow.Size = UDim2.new(1, 0, 0, Theme.Size.controlHeight)
	ownedRow.Position = UDim2.new(0, 0, 1, -Theme.Size.controlHeight)
	ownedRow.BackgroundTransparency = Theme.Alpha.hidden
	ownedRow.Visible = false
	ownedRow.ZIndex = zIndex + Theme.Depth.content
	ownedRow.Parent = card
	Theme.list({
		parent = ownedRow, gap = Theme.Space.x8,
		direction = Enum.FillDirection.Horizontal,
		hAlign = Enum.HorizontalAlignment.Center,
		vAlign = Enum.VerticalAlignment.Center,
	})
	local ownedIcon = Icon.create({
		name = "check", parent = ownedRow, size = Theme.Size.iconSm,
		color = Theme.Color.success, zIndex = zIndex + Theme.Depth.raised,
		layoutOrder = 1,
	})
	ownedIcon.LayoutOrder = 1
	Theme.label({
		parent = ownedRow, text = "GEKAUFT", role = "heading",
		size = Theme.TextSize.sm, color = Theme.Color.success,
		layoutSize = UDim2.fromOffset(Theme.Size.pillWidth / 2, Theme.Size.controlHeight),
		xAlign = Enum.TextXAlignment.Left,
		zIndex = zIndex + Theme.Depth.raised, layoutOrder = 2, stroke = false,
	})

	local function setState(state: State, detail: string?)
		local owned = state == "owned"
		local locked = state == "locked"
		local affordable = state == "buyable"

		lockOverlay.Visible = locked
		ownedRow.Visible = owned
		buy.instance.Visible = not owned
		price.Visible = not owned

		description.Text = detail or props.description

		scope:to(card, {
			BackgroundTransparency = if owned or locked
				then Theme.Alpha.glass
				else Theme.Alpha.opaque,
		}, Theme.Duration.base, "enter")

		if cardStroke ~= nil then
			scope:to(cardStroke, {
				Color = if owned then Theme.Color.successDeep
					elseif affordable then Theme.Color.primary
					else Theme.Color.bg3,
			}, Theme.Duration.base, "enter")
		end

		scope:to(title, {
			TextColor3 = if locked then Theme.Color.textLow else Theme.Color.textHigh,
		}, Theme.Duration.fast, "enter")
		scope:to(price, {
			TextColor3 = if affordable then Theme.Color.success else Theme.Color.textLow,
		}, Theme.Duration.fast, "enter")

		if owned then
			return
		end
		if locked then
			buy.setState("disabled")
			buy.setText("GESPERRT")
		elseif affordable then
			buy.setState("idle")
			buy.setText("KAUFEN")
		else
			buy.setState("disabled")
			buy.setText("ZU TEUER")
		end
	end

	setState("locked")

	return {
		instance = card,
		setState = setState,

		-- Erfolgreicher Kauf: einmaliges gruenes Pulsieren.
		celebrate = function()
			if cardStroke ~= nil then
				scope:to(cardStroke, {
					Color = Theme.Color.success, Thickness = Theme.Stroke.thick,
				}, Theme.Duration.fast, "pop")
				task.delay(Theme.Duration.slow, function()
					if card.Parent == nil then
						return
					end
					scope:to(cardStroke, {
						Color = Theme.Color.successDeep, Thickness = Theme.Stroke.hair,
					}, Theme.Duration.slow, "exit")
				end)
			end
		end,

		-- Zu wenig Geld: Ruetteln am Knopf, kein Popup.
		reject = buy.shake,

		destroy = function()
			buy.destroy()
			preview.destroy()
			scope:destroy()
			card:Destroy()
		end,
	}
end

return ItemSlot
