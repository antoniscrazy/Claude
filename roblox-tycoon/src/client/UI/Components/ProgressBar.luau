--!strict
--[[
	ProgressBar – Fortschritt mit animierter Fuellung und Glanzstreifen.

	Der Glanzstreifen laeuft nur, solange die Leiste weder leer noch voll
	ist: bei 0 % gibt es nichts zu bewerben, bei 100 % lenkt er vom
	Abholen-Knopf ab. Bei reduzierter Bewegung entfaellt er ganz
	(Theme.loopInfo liefert dann nil).
]]

local TweenService = game:GetService("TweenService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Motion = require(UI.Motion)

local ProgressBar = {}

export type Props = {
	parent: Instance?,
	zIndex: number,
	color: Color3?,
	size: UDim2?,
	layoutOrder: number?,
}

export type Handle = {
	instance: GuiObject,
	destroy: (() -> ()),
	set: (ratio: number, color: Color3?) -> (),
}

function ProgressBar.create(props: Props): Handle
	local scope = Motion.scope()

	local track = Instance.new("Frame")
	track.Name = "ProgressTrack"
	track.Size = props.size or UDim2.new(1, 0, 0, Theme.Size.barHeight)
	track.BackgroundColor3 = Theme.Color.bg0
	track.BorderSizePixel = 0
	track.ClipsDescendants = true
	track.ZIndex = props.zIndex
	track.LayoutOrder = props.layoutOrder or 0
	track.Parent = props.parent
	Theme.corner(track, Theme.Radius.pill)

	local fill = Instance.new("Frame")
	fill.Name = "Fill"
	fill.Size = UDim2.fromScale(0, 1)
	fill.BackgroundColor3 = props.color or Theme.Color.success
	fill.BorderSizePixel = 0
	fill.ZIndex = props.zIndex + Theme.Depth.content
	fill.Parent = track
	Theme.corner(fill, Theme.Radius.pill)
	Theme.gradient(fill, props.color or Theme.Color.success,
		Theme.Elevation.transparency / Theme.Space.x4)

	-- Glanzstreifen: schmale helle Flaeche, die ueber die Fuellung wandert.
	local shine = Instance.new("Frame")
	shine.Name = "Shine"
	shine.Size = UDim2.new(0, Theme.Space.x24, 1, 0)
	shine.Position = UDim2.fromScale(-1, 0)
	shine.BackgroundColor3 = Theme.Color.textHigh
	shine.BackgroundTransparency = Theme.Alpha.ghost
	shine.BorderSizePixel = 0
	shine.Rotation = 12
	shine.ZIndex = props.zIndex + Theme.Depth.raised
	shine.Parent = fill
	local shineTween: Tween? = nil

	local function setShine(running: boolean)
		local current = shineTween
		if not running then
			if current ~= nil then
				current:Cancel()
				current:Destroy()
				shineTween = nil
				shine.Position = UDim2.fromScale(-1, 0)
			end
			return
		end
		if current ~= nil then
			return
		end
		local info = Theme.loopInfo(Theme.Duration.shine)
		if info == nil then
			return   -- reduzierte Bewegung: kein Glanzstreifen
		end
		local tween = TweenService:Create(shine, info, { Position = UDim2.fromScale(1, 0) })
		shineTween = tween
		tween:Play()
	end

	return {
		instance = track,
		set = function(ratio: number, color: Color3?)
			local clamped = math.clamp(ratio, 0, 1)
			scope:to(fill, { Size = UDim2.fromScale(clamped, 1) }, Theme.Duration.slow, "enter")
			if color ~= nil then
				scope:to(fill, { BackgroundColor3 = color }, Theme.Duration.base, "enter")
			end
			setShine(clamped > 0 and clamped < 1)
		end,
		destroy = function()
			setShine(false)
			scope:destroy()
			track:Destroy()
		end,
	}
end

return ProgressBar
