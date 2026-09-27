--!strict
--[[
	HudController – dauerhaft sichtbare Anzeige: Guthaben, Gems, Rebirth,
	Einkommen pro Sekunde, plus die Knopfleiste zu den Panels.

	Layout-Entscheidung: die Knopfleiste steht im Querformat als Spalte
	links unter der Guthabenkarte und im Hochformat als Zeile am unteren
	Bildschirmrand. Grund: auf dem Handy ist der untere Rand mit dem Daumen
	erreichbar, die linke obere Ecke nicht. Umgeschaltet wird ueber die
	FillDirection eines UIListLayout, nicht ueber zwei getrennte UIs -
	sonst muesste jede Aenderung doppelt gepflegt werden.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Types = require(Shared.Types)

local UIKit = require(script.Parent.UIKit)

local C = Config.COLORS

local HudController = {}

-- Wird von Bootstrap gesetzt; Argument ist der Panelname.
HudController.onButton = function(_name: string) end

local cashValue: TextLabel? = nil
local gemsValue: TextLabel? = nil
local incomeLabel: TextLabel? = nil
local rebirthLabel: TextLabel? = nil
local dailyDot: Frame? = nil

type ButtonSpec = { key: string, label: string, color: Color3 }

local BUTTONS: { ButtonSpec } = {
	{ key = "shop",     label = "Shop",     color = C.BUYABLE },
	{ key = "quests",   label = "Aufgaben", color = C.ACCENT },
	{ key = "daily",    label = "Taeglich", color = C.CASH },
	{ key = "codes",    label = "Codes",    color = C.GEM },
	{ key = "gems",     label = "Gems",     color = C.GEM },
	{ key = "rebirth",  label = "Rebirth",  color = C.DANGER },
	{ key = "settings", label = "Optionen", color = C.TEXT_DIM },
}

--[[
	Eine Wertkarte (Ueberschrift + grosse Zahl).
	AutomaticSize bleibt bewusst aus: eine mitwachsende Karte wuerde bei
	jedem Geldbetrag die Breite aendern und dadurch flackern.
]]
local function valueCard(parent: Instance, name: string, caption: string,
	accent: Color3, order: number): TextLabel
	local card = UIKit.frame({
		name = name, parent = parent,
		size = UDim2.new(0, 236, 0, 76),
		color = C.PANEL, transparency = 0.1,
	})
	card.LayoutOrder = order
	UIKit.corner(card, 14)
	UIKit.stroke(card, accent, 2)

	UIKit.label({
		parent = card, text = caption, textColor = C.TEXT_DIM,
		size = UDim2.new(1, -24, 0, 18), position = UDim2.fromOffset(14, 8),
		font = Enum.Font.GothamMedium, textSize = 13,
		xAlign = Enum.TextXAlignment.Left,
	})
	return UIKit.label({
		name = "Value", parent = card, text = "0", textColor = accent,
		size = UDim2.new(1, -24, 0, 38), position = UDim2.fromOffset(14, 28),
		font = Enum.Font.GothamBlack, textSize = 30,
		xAlign = Enum.TextXAlignment.Left,
	})
end

function HudController.build(gui: ScreenGui, root: Frame)
	-- ---- Wertkarten links oben ------------------------------------------
	local stack = UIKit.frame({
		name = "Stats", parent = root,
		size = UDim2.new(0, 236, 0, 260),
		position = UDim2.fromOffset(16, 16),
		transparency = 1,
	})
	local stackLayout = UIKit.list(stack, 8, Enum.FillDirection.Vertical,
		Enum.HorizontalAlignment.Left)
	stackLayout.VerticalAlignment = Enum.VerticalAlignment.Top

	cashValue = valueCard(stack, "CashCard", "GUTHABEN", C.CASH, 1)
	gemsValue = valueCard(stack, "GemsCard", "GEMS", C.GEM, 2)

	-- Einkommen und Rebirth-Multiplikator in einer schmalen Zeile.
	local infoRow = UIKit.frame({
		name = "InfoRow", parent = stack,
		size = UDim2.new(0, 236, 0, 34),
		color = C.PANEL, transparency = 0.18,
	})
	infoRow.LayoutOrder = 3
	UIKit.corner(infoRow, 10)
	incomeLabel = UIKit.label({
		parent = infoRow, text = "0 $/s", textColor = C.TEXT,
		size = UDim2.new(0.55, -10, 1, 0), position = UDim2.fromOffset(12, 0),
		font = Enum.Font.GothamBold, textSize = 15,
		xAlign = Enum.TextXAlignment.Left,
	})
	rebirthLabel = UIKit.label({
		parent = infoRow, text = "x1.00", textColor = C.ACCENT,
		size = UDim2.new(0.45, -12, 1, 0), position = UDim2.new(0.55, 0, 0, 0),
		font = Enum.Font.GothamBold, textSize = 15,
		xAlign = Enum.TextXAlignment.Right,
	})

	-- ---- Knopfleiste ------------------------------------------------------
	local bar = UIKit.frame({ name = "Bar", parent = root, transparency = 1 })
	local barLayout = UIKit.list(bar, 8, Enum.FillDirection.Vertical,
		Enum.HorizontalAlignment.Left)
	-- Im Hochformat werden aus 7 Knoepfen zwei Rasterreihen: eine einzige
	-- Reihe braeuchte 643 px auf einem 375 px breiten Bildschirm.
	barLayout.Wraps = true

	for index, spec in ipairs(BUTTONS) do
		local button, stroke = UIKit.button({
			name = spec.key, parent = bar, text = spec.label,
			size = UDim2.new(0, 124, 0, 40),
			background = C.PANEL, textColor = spec.color,
			font = Enum.Font.GothamBold, textSize = 15,
		})
		button.LayoutOrder = index
		stroke.Color = spec.color
		stroke.Transparency = 0.45
		button.Activated:Connect(function()
			HudController.onButton(spec.key)
		end)

		-- Roter Punkt am "Taeglich"-Knopf, wenn etwas abholbar ist.
		if spec.key == "daily" then
			local dot = UIKit.frame({
				name = "Dot", parent = button,
				size = UDim2.fromOffset(12, 12),
				position = UDim2.new(1, -8, 0, 4),
				anchor = Vector2.new(1, 0),
				color = C.DANGER, zIndex = 5, visible = false,
			})
			UIKit.corner(dot, 6)
			dailyDot = dot
		end
	end

	-- ---- Orientierungsabhaengige Platzierung --------------------------------
	local function place()
		local viewport = UIKit.viewportOf(gui)
		-- Nicht nur nach Orientierung entscheiden: ein Handy im QUERformat
		-- (z. B. 667x375) ist zwar breit, aber zu niedrig fuer die
		-- siebenstufige Spalte - die liefe unten aus dem Bild. Massgeblich
		-- ist die kurze Bildschirmkante, nicht die Ausrichtung.
		if viewport.portrait or viewport.compact then
			-- Handy: Leiste unten, mit dem Daumen erreichbar, zwei Reihen.
			bar.Size = UDim2.new(0, 330, 0, 82)
			bar.Position = UDim2.new(0.5, 0, 1, -14)
			bar.AnchorPoint = Vector2.new(0.5, 1)
			barLayout.FillDirection = Enum.FillDirection.Horizontal
			barLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
			barLayout.Padding = UDim.new(0, 6)
			for _, child in ipairs(bar:GetChildren()) do
				if child:IsA("TextButton") then
					child.Size = UDim2.new(0, 78, 0, 38)
					child.TextSize = 13
				end
			end
		else
			bar.Size = UDim2.new(0, 124, 0, 380)
			bar.Position = UDim2.fromOffset(16, 300)
			bar.AnchorPoint = Vector2.zero
			barLayout.FillDirection = Enum.FillDirection.Vertical
			barLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left
			barLayout.Padding = UDim.new(0, 8)
			for _, child in ipairs(bar:GetChildren()) do
				if child:IsA("TextButton") then
					child.Size = UDim2.new(0, 124, 0, 40)
					child.TextSize = 15
				end
			end
		end
	end
	place()
	gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(place)

	-- Je eigene Skalierung: beide Gruppen haben unterschiedliche Anker
	-- (oben links bzw. unten mittig) und muessen dort auch bleiben.
	UIKit.attachScale(gui, stack)
	UIKit.attachScale(gui, bar)
end

function HudController.update(state: Types.ClientState)
	if cashValue ~= nil then
		cashValue.Text = Format.abbreviate(state.cash) .. " $"
	end
	if gemsValue ~= nil then
		gemsValue.Text = Format.abbreviate(state.gems)
	end
	if incomeLabel ~= nil then
		incomeLabel.Text = Format.abbreviate(state.incomePerSecond) .. " $/s"
	end
	if rebirthLabel ~= nil then
		rebirthLabel.Text = string.format("R%d  x%.2f", state.rebirths, state.rebirthMultiplier)
	end
	if dailyDot ~= nil then
		dailyDot.Visible = state.dailyReady
	end
end

return HudController
