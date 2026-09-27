--!strict
--[[
	GemsScreen – Gem-Pakete und Gamepasses.

	Gold ist hier - und nur hier - die Leitfarbe. Das ist die Regel aus
	dem Design-System: premium markiert Monetarisierung und wird nirgends
	dekorativ verwendet, damit Spieler die Farbe eindeutig lesen.

	Pakete ohne eingetragene Produkt-Id zeigen "BALD" und sind deaktiviert,
	statt einen Kaufdialog zu oeffnen, der sofort fehlschlaegt.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Remotes = require(Shared.Remotes)
local Theme = require(Shared.Theme)
local Types = require(Shared.Types)

local Client = script.Parent.Parent
local Icon = require(Client.UI.Icon)
local Layers = require(Client.UI.Layers)
local Button = require(Client.UI.Components.Button)
local Panel = require(Client.UI.Components.Panel)

local GemsScreen = {}

export type Handle = {
	destroy: (() -> ()),
	update: (state: Types.ClientState) -> (),
	toggle: () -> (),
	close: () -> (),
	isOpen: () -> boolean,
}

function GemsScreen.create(gui: ScreenGui, root: GuiObject): Handle
	local panelZ = Layers.at("panel", Theme.Depth.content)

	local panel = Panel.create({
		parent = root, gui = gui, name = "Gems",
		title = "GEM-PAKETE", subtitle = "Hartwaehrung und Vorteile",
		accent = Theme.Color.premium, scrolling = true,
	})
	Theme.list({ parent = panel.body, gap = Theme.Space.x8 })

	local buttons: { Button.Handle } = {}

	for index, product in ipairs(Config.GEM_PRODUCTS) do
		local card = Theme.Card({
			name = product.id, parent = panel.body,
			size = UDim2.new(1, -Theme.Space.x8, 0, Theme.Size.rowHeight + Theme.Space.x8),
			fill = Theme.Color.bg2, radius = Theme.Radius.card,
			strokeColor = Theme.Color.premiumDeep,
			zIndex = panelZ + Theme.Depth.content, shadow = false,
		})
		card.LayoutOrder = index
		Theme.padding(card, { all = Theme.Space.x12 })

		local badge = Instance.new("Frame")
		badge.Size = UDim2.fromOffset(Theme.Size.pillIcon + Theme.Space.x8,
			Theme.Size.pillIcon + Theme.Space.x8)
		badge.Position = UDim2.fromScale(0, 0.5)
		badge.AnchorPoint = Vector2.new(0, 0.5)
		badge.BackgroundColor3 = Theme.Color.gem
		badge.BorderSizePixel = 0
		badge.ZIndex = panelZ + Theme.Depth.raised
		badge.Parent = card
		Theme.corner(badge, Theme.Radius.pill)
		Icon.create({
			name = "gem", parent = badge, size = Theme.Size.iconInner,
			color = Theme.Color.bg0, zIndex = panelZ + Theme.Depth.overlay,
			anchor = Vector2.new(0.5, 0.5), position = UDim2.fromScale(0.5, 0.5),
		})

		Theme.label({
			parent = card, text = product.label, role = "heading",
			size = Theme.TextSize.md, color = Theme.Color.textHigh,
			layoutSize = UDim2.new(1, -(Theme.Size.pillWidth + Theme.Space.x32), 1, 0),
			position = UDim2.fromOffset(Theme.Size.pillIcon + Theme.Space.x24, 0),
			zIndex = panelZ + Theme.Depth.raised,
		})

		local available = product.productId ~= 0
		local productKey = product.id
		local buy = Button.create({
			parent = card,
			text = if available then "KAUFEN" else "BALD",
			variant = "premium", icon = if available then "plus" else "lock",
			size = UDim2.fromOffset(Theme.Size.pillWidth / 2, Theme.Size.controlHeight),
			position = UDim2.new(1, 0, 0.5, 0),
			anchor = Vector2.new(1, 0.5),
			zIndex = panelZ + Theme.Depth.raised,
			textSize = Theme.TextSize.sm,
			onActivated = function()
				Remotes.event("PromptGemProduct"):FireServer(productKey)
			end,
		})
		if not available then
			buy.setState("disabled")
		end
		table.insert(buttons, buy)
	end

	Theme.divider(panel.body, #Config.GEM_PRODUCTS + 1)

	-- Besitzstand der Gamepasses, rein informativ.
	local passInfo = Theme.label({
		parent = panel.body, text = "", role = "body",
		size = Theme.TextSize.sm, color = Theme.Color.textMid,
		layoutSize = UDim2.new(1, 0, 0, Theme.Size.rowHeight),
		wrapped = true, yAlign = Enum.TextYAlignment.Top,
		zIndex = panelZ, stroke = false,
	})
	passInfo.LayoutOrder = #Config.GEM_PRODUCTS + 2

	local function update(state: Types.ClientState)
		local lines: { string } = {}
		table.insert(lines, if state.owns2xCash
			then "2x Cash: aktiv"
			else "2x Cash: nicht im Besitz")
		table.insert(lines, if state.ownsVip
			then "VIP-Pass: aktiv, die Lounge steht offen"
			else "VIP-Pass: nicht im Besitz")
		passInfo.Text = table.concat(lines, "\n")
	end

	return {
		update = update,
		toggle = panel.toggle,
		close = panel.close,
		isOpen = panel.isOpen,
		destroy = function()
			for _, button in ipairs(buttons) do
				button.destroy()
			end
			panel.destroy()
		end,
	}
end

return GemsScreen
