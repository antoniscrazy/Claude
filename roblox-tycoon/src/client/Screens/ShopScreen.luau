--!strict
--[[
	ShopScreen – Upgrade-Panel mit Reiterspalte und Raster aus ItemSlots.

	Aufbau:
	  Panel
	   +- Body
	       +- Tabs (links, senkrecht)
	       +- ScrollingFrame (rechts, UIGridLayout)
	           +- ItemSlot je Upgrade
	       +- EmptyState (nur sichtbar, wenn ein Reiter leer ist)

	Die Slots werden EINMAL gebaut und danach nur ein- bzw. ausgeblendet
	und aktualisiert. Sie bei jedem Zustands-Push neu zu erzeugen hiesse,
	25 ViewportFrames pro Sekunde wegzuwerfen - das ist der teuerste
	Fehler, den man in dieser UI machen kann.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Remotes = require(Shared.Remotes)
local Theme = require(Shared.Theme)
local Types = require(Shared.Types)

local Client = script.Parent.Parent
local Layers = require(Client.UI.Layers)
local Preview = require(Client.UI.Preview)
local EmptyState = require(Client.UI.Components.EmptyState)
local ItemSlot = require(Client.UI.Components.ItemSlot)
local Panel = require(Client.UI.Components.Panel)
local Tabs = require(Client.UI.Components.Tabs)

local ShopScreen = {}

-- Wird vom Bootstrap gesetzt: meldet, welcher Kauf gerade abgeschickt
-- wurde, damit die Serverantwort dem richtigen Slot zugeordnet wird.
ShopScreen.onRequest = function(_upgradeId: string) end

export type Handle = {
	destroy: (() -> ()),
	update: (state: Types.ClientState) -> (),
	toggle: () -> (),
	close: () -> (),
	isOpen: () -> boolean,
	onPurchaseResult: (upgradeId: string, success: boolean) -> (),
}

local TABS: { Tabs.Item } = {
	{ id = "all", label = "Alle" },
	{ id = "dropper", label = "Bohrer" },
	{ id = "upgrader", label = "Oefen" },
	{ id = "boost", label = "Tempo" },
	{ id = "build", label = "Gebaeude" },
}

-- Ordnet eine Upgrade-Art einem Reiter und einem Vorschaumodell zu.
local function categoryOf(kind: string): (string, Preview.Kind)
	if kind == "dropper" then
		return "dropper", "dropper" :: Preview.Kind
	elseif kind == "upgrader" then
		return "upgrader", "upgrader" :: Preview.Kind
	elseif kind == "collector" then
		return "upgrader", "collector" :: Preview.Kind
	elseif kind == "rate" then
		return "boost", "rate" :: Preview.Kind
	elseif kind == "speed" then
		return "boost", "speed" :: Preview.Kind
	end
	return "build", "cosmetic" :: Preview.Kind
end

function ShopScreen.create(gui: ScreenGui, root: GuiObject): Handle
	local panelZ = Layers.at("panel", Theme.Depth.content)

	local panel = Panel.create({
		parent = root, gui = gui, name = "Shop",
		title = "FABRIK-UPGRADES",
		subtitle = "0 von " .. tostring(#Config.UPGRADES) .. " gekauft",
		accent = Theme.Color.primary,
	})

	local tabs: Tabs.Handle
	local slots: { [string]: ItemSlot.Handle } = {}
	local categories: { [string]: string } = {}
	local empty: EmptyState.Handle

	local grid = Instance.new("ScrollingFrame")
	grid.Name = "Grid"
	grid.Size = UDim2.new(1, -(Theme.Size.tabWidth + Theme.Space.x16), 1, 0)
	grid.Position = UDim2.fromOffset(Theme.Size.tabWidth + Theme.Space.x16, 0)
	grid.BackgroundTransparency = Theme.Alpha.hidden
	grid.BorderSizePixel = 0
	grid.ScrollBarThickness = Theme.Size.scrollBar
	grid.ScrollBarImageColor3 = Theme.Color.primary
	grid.ScrollBarImageTransparency = Theme.Alpha.veil
	grid.CanvasSize = UDim2.new()
	grid.AutomaticCanvasSize = Enum.AutomaticSize.Y
	grid.ScrollingDirection = Enum.ScrollingDirection.Y
	grid.ElasticBehavior = Enum.ElasticBehavior.Never
	grid.ZIndex = panelZ
	grid.Parent = panel.body

	local layout = Instance.new("UIGridLayout")
	layout.CellSize = UDim2.fromOffset(Theme.Size.slotWidth, Theme.Size.slotHeight)
	layout.CellPadding = UDim2.fromOffset(Theme.Space.x12, Theme.Space.x12)
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.HorizontalAlignment = Enum.HorizontalAlignment.Left
	layout.Parent = grid
	Theme.padding(grid, { right = Theme.Space.x12 })

	local function applyFilter()
		local selected = tabs.selected()
		local visible = 0
		for id, slot in pairs(slots) do
			local show = selected == "all" or categories[id] == selected
			slot.instance.Visible = show
			if show then
				visible += 1
			end
		end
		empty.setVisible(visible == 0)
	end

	tabs = Tabs.create(panel.body, TABS, panelZ, function()
		applyFilter()
	end)

	empty = EmptyState.create(grid, "lock", "Nichts in dieser Gruppe",
		"Kauf zuerst ein paar Upgrades aus den anderen Reitern.",
		panelZ + Theme.Depth.overlay)

	for index, def in ipairs(Config.UPGRADES) do
		-- Annotiert: der Union-Rueckgabetyp weitet beim Destrukturieren sonst.
		local category: string, previewKind: Preview.Kind = categoryOf(def.effect.kind)
		categories[def.id] = category
		local upgradeId = def.id
		slots[def.id] = ItemSlot.create({
			parent = grid, id = def.id, rank = def.rank,
			title = def.label, description = def.desc, price = def.price,
			kind = previewKind, zIndex = panelZ + Theme.Depth.content,
			layoutOrder = index,
			onBuy = function()
				ShopScreen.onRequest(upgradeId)
				Remotes.event("RequestPurchase"):FireServer(upgradeId)
			end,
		})
	end
	applyFilter()

	local function update(state: Types.ClientState)
		local bought = 0
		for _, def in ipairs(Config.UPGRADES) do
			local slot = slots[def.id]
			if slot == nil then
				continue
			end
			if state.purchased[def.id] then
				bought += 1
				slot.setState("owned")
			elseif state.available[def.id] then
				slot.setState(
					if state.cash >= def.price then "buyable" else "tooExpensive")
			else
				-- Konkret sagen, was fehlt: "gesperrt" allein frustriert.
				local missing: { string } = {}
				for _, requirement in ipairs(def.requires) do
					if not state.purchased[requirement] then
						local other = Config.UPGRADES_BY_ID[requirement]
						table.insert(missing, if other ~= nil then other.label else requirement)
					end
				end
				slot.setState("locked", "Zuerst: " .. table.concat(missing, ", "))
			end
		end
		panel.setSubtitle(`{bought} von {#Config.UPGRADES} gekauft`)
	end

	return {
		update = update,
		toggle = panel.toggle,
		close = panel.close,
		isOpen = panel.isOpen,

		-- Rueckmeldung vom Server: Erfolg pulsiert gruen, Fehler ruettelt.
		onPurchaseResult = function(upgradeId: string, success: boolean)
			local slot = slots[upgradeId]
			if slot == nil then
				return
			end
			if success then
				slot.celebrate()
			else
				slot.reject()
			end
		end,

		destroy = function()
			for _, slot in pairs(slots) do
				slot.destroy()
			end
			empty.destroy()
			tabs.destroy()
			panel.destroy()
		end,
	}
end

return ShopScreen
