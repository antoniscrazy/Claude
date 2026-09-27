--!strict
--[[
	Tabs – senkrechte Reiterspalte im Shop.

	Der aktive Reiter wird nicht nur eingefaerbt, sondern bekommt zusaetzlich
	einen Markierungsbalken links. Farbe allein ist als einziges
	Unterscheidungsmerkmal fuer Farbsehschwaechen zu wenig.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Motion = require(UI.Motion)
local Responsive = require(UI.Responsive)

local Tabs = {}

export type Item = { id: string, label: string }

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
	select: (id: string) -> (),
	selected: () -> string,
}

function Tabs.create(parent: Instance, items: { Item }, zIndex: number,
	onChange: (id: string) -> ()): Handle
	local scope = Motion.scope()
	local current = items[1].id

	local column = Instance.new("Frame")
	column.Name = "Tabs"
	column.Size = UDim2.new(0, Theme.Size.tabWidth, 1, 0)
	column.BackgroundTransparency = Theme.Alpha.hidden
	column.ZIndex = zIndex
	column.Parent = parent
	Theme.list({ parent = column, gap = Theme.Space.x4 })

	type Entry = { button: TextButton, marker: Frame, label: TextLabel }
	local entries: { [string]: Entry } = {}

	local function paint()
		for id, entry in pairs(entries) do
			local active = id == current
			scope:to(entry.button, {
				BackgroundColor3 = if active then Theme.Color.bg3 else Theme.Color.bg1,
				BackgroundTransparency = if active then Theme.Alpha.opaque else Theme.Alpha.glass,
			}, Theme.Duration.fast, "enter")
			scope:to(entry.label, {
				TextColor3 = if active then Theme.Color.textHigh else Theme.Color.textLow,
			}, Theme.Duration.fast, "enter")
			scope:to(entry.marker, {
				Size = UDim2.new(0, Theme.Space.x4, if active then 0.6 else 0, 0),
				BackgroundTransparency = if active then Theme.Alpha.opaque else Theme.Alpha.hidden,
			}, Theme.Duration.base, "enter")
		end
	end

	for index, item in ipairs(items) do
		local button = Instance.new("TextButton")
		button.Name = item.id
		button.Size = UDim2.new(1, 0, 0, Responsive.minTouchSize())
		button.BackgroundColor3 = Theme.Color.bg1
		button.BorderSizePixel = 0
		button.AutoButtonColor = false
		button.Text = ""
		button.LayoutOrder = index
		button.ZIndex = zIndex + Theme.Depth.content
		button.Parent = column
		Theme.corner(button, Theme.Radius.control)

		local marker = Instance.new("Frame")
		marker.Name = "Marker"
		marker.Size = UDim2.new(0, Theme.Space.x4, 0, 0)
		marker.Position = UDim2.new(0, Theme.Space.x8, 0.5, 0)
		marker.AnchorPoint = Vector2.new(0, 0.5)
		marker.BackgroundColor3 = Theme.Color.primary
		marker.BorderSizePixel = 0
		marker.ZIndex = zIndex + Theme.Depth.raised
		marker.Parent = button
		Theme.corner(marker, Theme.Radius.pill)

		local label = Theme.label({
			parent = button, text = item.label, role = "heading",
			size = Theme.TextSize.sm, color = Theme.Color.textLow,
			layoutSize = UDim2.new(1, -Theme.Space.x24, 1, 0),
			position = UDim2.fromOffset(Theme.Space.x24, 0),
			zIndex = zIndex + Theme.Depth.raised, stroke = false,
		})

		entries[item.id] = { button = button, marker = marker, label = label }
		scope:track(button.Activated:Connect(function()
			if current == item.id then
				return
			end
			current = item.id
			paint()
			onChange(item.id)
		end))
	end
	paint()

	return {
		instance = column,
		select = function(id: string)
			if entries[id] == nil or current == id then
				return
			end
			current = id
			paint()
			onChange(id)
		end,
		selected = function(): string
			return current
		end,
		destroy = function()
			scope:destroy()
			column:Destroy()
		end,
	}
end

return Tabs
