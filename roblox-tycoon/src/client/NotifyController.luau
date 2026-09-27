--!strict
--[[
	NotifyController – kurze Meldungen ("gekauft", "zu wenig Geld").

	Eine Warteschlange statt sofortigem Ueberschreiben: beim Kaufen mehrerer
	Upgrades hintereinander wuerde sonst nur die letzte Meldung eine
	Millisekunde lang aufblitzen. Maximal drei Meldungen gleichzeitig,
	aeltere ruecken nach oben und blenden aus.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)

local UIKit = require(script.Parent.UIKit)

local C = Config.COLORS
local MAX_VISIBLE = 3
local LIFETIME = 3.2

local NotifyController = {}

local container: Frame? = nil

function NotifyController.build(gui: ScreenGui, root: Frame)
	local holder = UIKit.frame({
		name = "Toasts", parent = root,
		size = UDim2.new(0, 460, 0, 200),
		position = UDim2.new(0.5, 0, 0, 96),
		anchor = Vector2.new(0.5, 0),
		transparency = 1,
		zIndex = 60,
	})
	local layout = UIKit.list(holder, 8, Enum.FillDirection.Vertical)
	layout.VerticalAlignment = Enum.VerticalAlignment.Top

	-- Im Hochformat weiter nach unten, damit die Meldung nicht die
	-- Kontostandskarte verdeckt.
	local function place()
		local viewport = UIKit.viewportOf(gui)
		holder.Position = if viewport.portrait
			then UDim2.new(0.5, 0, 0, 128)
			else UDim2.new(0.5, 0, 0, 96)
		holder.Size = UDim2.new(0, math.min(460, viewport.width - 40), 0, 200)
	end
	place()
	gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(place)

	container = holder
end

function NotifyController.show(text: string, kind: string)
	local holder = container
	if holder == nil then
		return
	end

	local existing = holder:GetChildren()
	local count = 0
	for _, child in ipairs(existing) do
		if child:IsA("Frame") then
			count += 1
		end
	end
	-- Aelteste entfernen, wenn zu viele auf einmal kommen.
	if count >= MAX_VISIBLE then
		for _, child in ipairs(existing) do
			if child:IsA("Frame") then
				child:Destroy()
				break
			end
		end
	end

	local accent = if kind == "success" then C.CASH
		elseif kind == "error" then C.DANGER
		else C.GEM

	local toast = UIKit.frame({
		name = "Toast", parent = holder,
		size = UDim2.new(1, 0, 0, 46),
		color = C.PANEL, transparency = 0.08, zIndex = 61,
	})
	UIKit.corner(toast, 12)
	UIKit.stroke(toast, accent, 2)

	UIKit.label({
		parent = toast, text = text, textColor = C.TEXT,
		size = UDim2.new(1, -20, 1, 0), position = UDim2.fromOffset(10, 0),
		font = Enum.Font.GothamBold, textSize = 17,
		xAlign = Enum.TextXAlignment.Left, wrapped = true, zIndex = 62,
	})

	-- Einblenden ueber die Transparenz. Position wird bewusst NICHT
	-- animiert: das Element liegt in einem UIListLayout, das die Position
	-- ohnehin jeden Frame ueberschreibt.
	toast.BackgroundTransparency = 1
	UIKit.tween(toast, { BackgroundTransparency = 0.08 }, 0.15)

	task.delay(LIFETIME, function()
		if toast.Parent == nil then
			return
		end
		local tween = UIKit.tween(toast, { BackgroundTransparency = 1 }, 0.25)
		tween.Completed:Once(function()
			toast:Destroy()
		end)
	end)
end

return NotifyController
