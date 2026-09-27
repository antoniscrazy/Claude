--!strict
--[[
	SegmentedControl – Auswahl aus zwei bis vier Optionen.

	Der Auswahlbalken ist EIN Element, das zwischen den Segmenten
	wandert, statt pro Segment ein- und auszublenden. Das liest sich als
	Bewegung statt als Flackern und kostet nur einen Tween.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Motion = require(UI.Motion)
local Responsive = require(UI.Responsive)

local SegmentedControl = {}

export type Option = { id: string, label: string }

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
	select: (id: string, notify: boolean?) -> (),
	selected: () -> string,
}

function SegmentedControl.create(parent: Instance, options: { Option },
	zIndex: number, onChange: (id: string) -> ()): Handle
	local scope = Motion.scope()
	local current = options[1].id
	local count = #options

	local track = Instance.new("Frame")
	track.Name = "Segmented"
	track.Size = UDim2.new(1, 0, 0, Responsive.minTouchSize())
	track.BackgroundColor3 = Theme.Color.bg0
	track.BorderSizePixel = 0
	track.ZIndex = zIndex
	track.Parent = parent
	Theme.corner(track, Theme.Radius.control)
	Theme.padding(track, { all = Theme.Space.x4 })

	-- Wandernder Auswahlbalken, liegt UNTER den Beschriftungen.
	local thumb = Instance.new("Frame")
	thumb.Name = "Thumb"
	thumb.Size = UDim2.fromScale(1 / count, 1)
	thumb.BackgroundColor3 = Theme.Color.primary
	thumb.BorderSizePixel = 0
	thumb.ZIndex = zIndex + Theme.Depth.content
	thumb.Parent = track
	Theme.corner(thumb, Theme.Radius.chip)
	Theme.gradient(thumb, Theme.Color.primary, Theme.Elevation.transparency / Theme.Space.x8)

	local labels: { [string]: TextLabel } = {}

	local function paint(animate: boolean)
		local index = 1
		for position, option in ipairs(options) do
			if option.id == current then
				index = position
			end
		end
		local target = UDim2.fromScale((index - 1) / count, 0)
		if animate then
			scope:to(thumb, { Position = target }, Theme.Duration.base, "enter")
		else
			thumb.Position = target
		end
		for id, label in pairs(labels) do
			scope:to(label, {
				TextColor3 = if id == current then Theme.Color.bg0 else Theme.Color.textLow,
			}, Theme.Duration.fast, "enter")
		end
	end

	for index, option in ipairs(options) do
		local button = Instance.new("TextButton")
		button.Name = option.id
		button.Size = UDim2.fromScale(1 / count, 1)
		button.Position = UDim2.fromScale((index - 1) / count, 0)
		button.BackgroundTransparency = Theme.Alpha.hidden
		button.BorderSizePixel = 0
		button.AutoButtonColor = false
		button.Text = ""
		button.ZIndex = zIndex + Theme.Depth.raised
		button.Parent = track

		labels[option.id] = Theme.label({
			parent = button, text = option.label, role = "heading",
			size = Theme.TextSize.sm, color = Theme.Color.textLow,
			layoutSize = UDim2.fromScale(1, 1),
			xAlign = Enum.TextXAlignment.Center,
			zIndex = zIndex + Theme.Depth.overlay, stroke = false,
		})

		scope:track(button.Activated:Connect(function()
			if current == option.id then
				return
			end
			current = option.id
			paint(true)
			onChange(option.id)
		end))
	end
	paint(false)

	return {
		instance = track,
		select = function(id: string, notify: boolean?)
			-- Optional annotiert: unbekannte Id liefert zur Laufzeit nil.
			local existing: TextLabel? = labels[id]
			if existing == nil or current == id then
				return
			end
			current = id
			paint(true)
			if notify ~= false then
				onChange(id)
			end
		end,
		selected = function(): string
			return current
		end,
		destroy = function()
			scope:destroy()
			track:Destroy()
		end,
	}
end

return SegmentedControl
