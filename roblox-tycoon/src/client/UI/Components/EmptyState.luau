--!strict
--[[
	EmptyState – was da steht, wenn eine Liste leer ist.

	Eine leere ScrollingFrame ohne Erklaerung wirkt wie ein Ladefehler.
	Deshalb: gedaempftes Symbol, eine Ueberschrift, ein Satz Erklaerung.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Icon = require(UI.Icon)

local EmptyState = {}

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
	setVisible: (visible: boolean) -> (),
}

function EmptyState.create(parent: Instance, icon: Icon.Name, title: string,
	body: string, zIndex: number): Handle
	local holder = Instance.new("Frame")
	holder.Name = "EmptyState"
	holder.Size = UDim2.fromScale(1, 1)
	holder.BackgroundTransparency = Theme.Alpha.hidden
	holder.ZIndex = zIndex
	holder.Visible = false
	holder.Parent = parent

	local column = Instance.new("Frame")
	column.Size = UDim2.new(1, -Theme.Space.x48, 0, 0)
	column.Position = UDim2.fromScale(0.5, 0.5)
	column.AnchorPoint = Vector2.new(0.5, 0.5)
	column.AutomaticSize = Enum.AutomaticSize.Y
	column.BackgroundTransparency = Theme.Alpha.hidden
	column.ZIndex = zIndex
	column.Parent = holder
	Theme.list({
		parent = column, gap = Theme.Space.x12,
		hAlign = Enum.HorizontalAlignment.Center,
	})

	local glyph = Icon.create({
		name = icon, parent = column, size = Theme.Size.pillIcon,
		color = Theme.Color.textLow, zIndex = zIndex + Theme.Depth.content,
		layoutOrder = 1,
	})
	glyph.LayoutOrder = 1

	Theme.label({
		parent = column, text = title, role = "heading",
		size = Theme.TextSize.lg, color = Theme.Color.textMid,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x24),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = zIndex + Theme.Depth.content, layoutOrder = 2, stroke = false,
	})
	Theme.label({
		parent = column, text = body, role = "body",
		size = Theme.TextSize.sm, color = Theme.Color.textLow,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x48),
		xAlign = Enum.TextXAlignment.Center, wrapped = true,
		zIndex = zIndex + Theme.Depth.content, layoutOrder = 3, stroke = false,
	})

	return {
		instance = holder,
		setVisible = function(visible: boolean)
			holder.Visible = visible
		end,
		destroy = function()
			holder:Destroy()
		end,
	}
end

return EmptyState
