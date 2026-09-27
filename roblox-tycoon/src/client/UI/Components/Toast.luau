--!strict
--[[
	Toast – kurze Rueckmeldung oben rechts.

	Faehrt von rechts ein, nicht ein: die Bewegung kommt aus der Richtung,
	in der das Element liegt, das ist die ruhigste Variante. Maximal drei
	gleichzeitig; der aelteste weicht, statt dass sich der Stapel bis zum
	Bildschirmrand schiebt.

	Position ueber ein UIListLayout, nicht ueber gerechnete Pixel: beim
	Entfernen eines Toasts ruecken die uebrigen dadurch von selbst nach.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Icon = require(UI.Icon)
local Layers = require(UI.Layers)
local Motion = require(UI.Motion)

local Toast = {}

local MAX_VISIBLE = 3
local LIFETIME = 3.2

local holder: Frame? = nil
local scope = Motion.scope()

export type Kind = "success" | "error" | "info"

function Toast.build(root: GuiObject, topInset: number)
	if holder ~= nil then
		return
	end
	local frame = Instance.new("Frame")
	frame.Name = "Toasts"
	frame.Size = UDim2.new(0, Theme.Size.toastWidth, 1, -topInset)
	frame.Position = UDim2.new(1, -Theme.Safe.edge, 0, topInset)
	frame.AnchorPoint = Vector2.new(1, 0)
	frame.BackgroundTransparency = Theme.Alpha.hidden
	frame.ZIndex = Layers.at("toast", Theme.Depth.base)
	frame.Parent = root
	Theme.list({
		parent = frame, gap = Theme.Space.x8,
		hAlign = Enum.HorizontalAlignment.Right,
	})
	holder = frame
end

function Toast.setInset(topInset: number)
	if holder ~= nil then
		holder.Position = UDim2.new(1, -Theme.Safe.edge, 0, topInset)
		holder.Size = UDim2.new(0, Theme.Size.toastWidth, 1, -topInset)
	end
end

-- Die Icon-Namen werden explizit typisiert: als nackte Rueckgabeliterale
-- weitet Luau sie zu `string` und der Union-Typ passt dann nicht mehr.
local ICON_SUCCESS: Icon.Name = "check"
local ICON_ERROR: Icon.Name = "close"
local ICON_INFO: Icon.Name = "quest"

local function accentFor(kind: Kind): (Color3, Icon.Name)
	if kind == "success" then
		return Theme.Color.success, ICON_SUCCESS
	elseif kind == "error" then
		return Theme.Color.danger, ICON_ERROR
	end
	return Theme.Color.primary, ICON_INFO
end

function Toast.show(text: string, kind: Kind)
	local frame = holder
	if frame == nil then
		return
	end

	local live = {}
	for _, child in ipairs(frame:GetChildren()) do
		if child:IsA("Frame") then
			table.insert(live, child)
		end
	end
	if #live >= MAX_VISIBLE then
		live[1]:Destroy()
	end

	local accent: Color3, iconName: Icon.Name = accentFor(kind)
	local zIndex = Layers.at("toast", Theme.Depth.content)

	local card = Theme.Card({
		name = "Toast", parent = frame,
		size = UDim2.new(1, 0, 0, Theme.Size.rowHeight),
		fill = Theme.Color.bg2,
		radius = Theme.Radius.card,
		strokeColor = accent,
		zIndex = zIndex,
	})
	card.LayoutOrder = math.floor(os.clock() * Theme.Size.touchMin)

	-- Farbstreifen links: traegt die Bedeutung auch ohne Icon.
	local stripe = Instance.new("Frame")
	stripe.Name = "Stripe"
	stripe.Size = UDim2.new(0, Theme.Space.x4, 1, -Theme.Space.x16)
	stripe.Position = UDim2.new(0, Theme.Space.x8, 0.5, 0)
	stripe.AnchorPoint = Vector2.new(0, 0.5)
	stripe.BackgroundColor3 = accent
	stripe.BorderSizePixel = 0
	stripe.ZIndex = zIndex + Theme.Depth.content
	stripe.Parent = card
	Theme.corner(stripe, Theme.Radius.pill)

	Icon.create({
		name = iconName, parent = card, size = Theme.Size.iconSm,
		color = accent, zIndex = zIndex + Theme.Depth.content,
		anchor = Vector2.new(0, 0.5),
		position = UDim2.new(0, Theme.Space.x24, 0.5, 0),
	})

	Theme.label({
		parent = card, text = text, role = "heading",
		size = Theme.TextSize.sm, color = Theme.Color.textHigh,
		layoutSize = UDim2.new(1, -(Theme.Space.x48 + Theme.Space.x16), 1, 0),
		position = UDim2.fromOffset(Theme.Space.x48, 0),
		wrapped = true, zIndex = zIndex + Theme.Depth.content,
	})

	-- Einfahren von rechts ueber eine UIScale-freie Positionsverschiebung
	-- innerhalb des Layouts waere nicht moeglich; stattdessen wandert der
	-- Inhalt ueber ein eigenes Offset-Frame.
	local slide = Instance.new("UIScale")
	slide.Scale = Theme.Scale.panelEnter
	slide.Parent = card
	card.BackgroundTransparency = Theme.Alpha.hidden
	scope:to(slide, { Scale = Theme.Scale.rest }, Theme.Duration.base, "pop")
	scope:to(card, { BackgroundTransparency = Theme.Alpha.opaque },
		Theme.Duration.base, "enter")

	task.delay(LIFETIME, function()
		if card.Parent == nil then
			return
		end
		local fade = scope:to(card, { BackgroundTransparency = Theme.Alpha.hidden },
			Theme.Duration.slow, "exit")
		scope:to(slide, { Scale = Theme.Scale.panelEnter }, Theme.Duration.slow, "exit")
		fade.Completed:Once(function()
			card:Destroy()
		end)
	end)
end

function Toast.destroy()
	scope:destroy()
	if holder ~= nil then
		holder:Destroy()
		holder = nil
	end
end

return Toast
