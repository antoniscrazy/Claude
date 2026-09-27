--!strict
--[[
	ShopController – Upgrade-Liste mit Abhaengigkeitsbaum.

	Sichtbarkeitsregel (identisch zur Serverlogik in PlotService.isAvailable):
	  * gekauft            -> gruen, nicht anklickbar
	  * verfuegbar         -> anklickbar, Preis in Kontrastfarbe
	  * gesperrt           -> ausgegraut, zeigt WELCHE Voraussetzung fehlt

	Wichtig: das hier ist reine Anzeige. Der Klick schickt nur die Id an den
	Server; ob der Kauf zulaessig ist, entscheidet ausschliesslich der
	Server. Ein manipulierter Client kann hier hoechstens sich selbst
	Knoepfe einblenden, die dann abgelehnt werden.

	Die Zeilen werden EINMAL gebaut und danach nur aktualisiert. Sie bei
	jedem Zustands-Push neu zu erzeugen (4x pro Sekunde, 25 Zeilen) waere
	auf dem Handy der teuerste Posten im ganzen Spiel.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Remotes = require(Shared.Remotes)
local Types = require(Shared.Types)

local UIKit = require(script.Parent.UIKit)

local C = Config.COLORS

local ShopController = {}

type Row = {
	def: Types.UpgradeDef,
	frame: Frame,
	title: TextLabel,
	desc: TextLabel,
	price: TextLabel,
	button: TextButton,
	stroke: UIStroke,
}

local rows: { Row } = {}
local panel: Frame? = nil
local summary: TextLabel? = nil
local tooltip: TextLabel? = nil

local function showTooltip(text: string)
	local label = tooltip
	if label == nil then
		return
	end
	label.Text = text
	label.Visible = true
end

local function hideTooltip()
	if tooltip ~= nil then
		tooltip.Visible = false
	end
end

local function buildRow(parent: Instance, def: Types.UpgradeDef, order: number): Row
	local frame = UIKit.frame({
		name = def.id, parent = parent,
		size = UDim2.new(1, -8, 0, 62),
		color = C.PANEL_LIGHT, transparency = 0.15,
	})
	frame.LayoutOrder = order
	UIKit.corner(frame, 10)
	local stroke = UIKit.stroke(frame, C.LOCKED, 1.5)

	-- Rangnummer links: gibt dem Baum eine lesbare Ordnung.
	UIKit.label({
		parent = frame, text = tostring(def.rank), textColor = C.TEXT_DIM,
		size = UDim2.fromOffset(34, 62), position = UDim2.fromOffset(6, 0),
		font = Enum.Font.GothamBlack, textSize = 18,
	})

	local title = UIKit.label({
		parent = frame, text = def.label, textColor = C.TEXT,
		size = UDim2.new(1, -190, 0, 24), position = UDim2.fromOffset(44, 8),
		font = Enum.Font.GothamBold, textSize = 16,
		xAlign = Enum.TextXAlignment.Left,
	})
	local desc = UIKit.label({
		parent = frame, text = def.desc, textColor = C.TEXT_DIM,
		size = UDim2.new(1, -190, 0, 20), position = UDim2.fromOffset(44, 32),
		font = Enum.Font.GothamMedium, textSize = 13,
		xAlign = Enum.TextXAlignment.Left,
	})
	local price = UIKit.label({
		parent = frame, text = Format.abbreviate(def.price) .. " $",
		textColor = C.CASH,
		size = UDim2.fromOffset(110, 24), position = UDim2.new(1, -128, 0, 8),
		font = Enum.Font.GothamBlack, textSize = 16,
		xAlign = Enum.TextXAlignment.Right,
	})

	local button = UIKit.button({
		name = "Buy", parent = frame, text = "KAUFEN",
		size = UDim2.fromOffset(104, 24), position = UDim2.new(1, -122, 0, 32),
		background = C.BUYABLE, textColor = Color3.new(1, 1, 1),
		font = Enum.Font.GothamBold, textSize = 13,
	})
	button.Activated:Connect(function()
		Remotes.event("RequestPurchase"):FireServer(def.id)
	end)

	-- Tooltip: auf Mobilgeraeten gibt es kein Hover, deshalb steht die
	-- gleiche Information zusaetzlich immer in der Beschreibungszeile.
	frame.MouseEnter:Connect(function()
		local requires = if #def.requires == 0
			then "keine Voraussetzung"
			else "braucht: " .. table.concat(def.requires, ", ")
		showTooltip(`{def.label}  -  {def.desc}  ({requires})`)
	end)
	frame.MouseLeave:Connect(hideTooltip)

	return {
		def = def, frame = frame, title = title, desc = desc,
		price = price, button = button, stroke = stroke,
	}
end

function ShopController.build(gui: ScreenGui, root: Frame): Frame
	local created = UIKit.centeredPanel(gui, root, "ShopPanel")
	panel = created

	UIKit.label({
		parent = created, text = "FABRIK-UPGRADES", textColor = C.ACCENT,
		size = UDim2.new(1, -120, 0, 40), position = UDim2.fromOffset(20, 12),
		font = Enum.Font.GothamBlack, textSize = 24,
		xAlign = Enum.TextXAlignment.Left, zIndex = 21,
	})
	summary = UIKit.label({
		parent = created, text = "0 / 25 gekauft", textColor = C.TEXT_DIM,
		size = UDim2.new(1, -120, 0, 18), position = UDim2.fromOffset(20, 48),
		font = Enum.Font.GothamMedium, textSize = 13,
		xAlign = Enum.TextXAlignment.Left, zIndex = 21,
	})

	local close = UIKit.button({
		name = "Close", parent = created, text = "X",
		size = UDim2.fromOffset(36, 36), position = UDim2.new(1, -16, 0, 14),
		anchor = Vector2.new(1, 0),
		background = C.DANGER, textColor = Color3.new(1, 1, 1),
		font = Enum.Font.GothamBlack, textSize = 18, zIndex = 22,
	})
	close.Activated:Connect(function()
		UIKit.setPanelVisible(created, false)
	end)

	local scroll = UIKit.scroll({
		parent = created,
		size = UDim2.new(1, -28, 1, -108),
		position = UDim2.fromOffset(14, 74),
		zIndex = 21,
	})
	UIKit.list(scroll, 6, Enum.FillDirection.Vertical)

	for index, def in ipairs(Config.UPGRADES) do
		table.insert(rows, buildRow(scroll, def, index))
	end

	tooltip = UIKit.label({
		name = "Tooltip", parent = created,
		text = "", textColor = C.TEXT,
		size = UDim2.new(1, -28, 0, 26), position = UDim2.new(0, 14, 1, -32),
		background = C.PANEL_LIGHT, transparency = 0.2,
		font = Enum.Font.GothamMedium, textSize = 13,
		xAlign = Enum.TextXAlignment.Left, zIndex = 23,
	})
	local tip = tooltip :: TextLabel
	tip.Visible = false
	UIKit.corner(tip, 8)
	local tipPad = Instance.new("UIPadding")
	tipPad.PaddingLeft = UDim.new(0, 10)
	tipPad.Parent = tip

	return created
end

function ShopController.toggle()
	local created = panel
	if created ~= nil then
		UIKit.setPanelVisible(created, not created.Visible)
	end
end

function ShopController.update(state: Types.ClientState)
	local bought = 0
	for _, row in ipairs(rows) do
		local id = row.def.id
		if state.purchased[id] then
			bought += 1
			row.stroke.Color = C.BOUGHT
			row.title.TextColor3 = C.BOUGHT
			row.price.Text = "GEKAUFT"
			row.price.TextColor3 = C.BOUGHT
			row.button.Visible = false
			row.frame.BackgroundTransparency = 0.4
			row.desc.Text = row.def.desc
		elseif state.available[id] then
			local affordable = state.cash >= row.def.price
			row.stroke.Color = if affordable then C.BUYABLE else C.LOCKED
			row.title.TextColor3 = C.TEXT
			row.price.Text = Format.abbreviate(row.def.price) .. " $"
			row.price.TextColor3 = if affordable then C.CASH else C.TEXT_DIM
			row.button.Visible = true
			row.button.BackgroundColor3 = if affordable then C.BUYABLE else C.LOCKED
			row.button.Text = if affordable then "KAUFEN" else "ZU TEUER"
			row.frame.BackgroundTransparency = 0.15
			row.desc.Text = row.def.desc
		else
			row.stroke.Color = C.LOCKED
			row.title.TextColor3 = C.TEXT_DIM
			row.price.Text = Format.abbreviate(row.def.price) .. " $"
			row.price.TextColor3 = C.TEXT_DIM
			row.button.Visible = false
			row.frame.BackgroundTransparency = 0.55
			-- Konkret sagen, was fehlt - "gesperrt" allein frustriert.
			local missing: { string } = {}
			for _, requirement in ipairs(row.def.requires) do
				if not state.purchased[requirement] then
					local def = Config.UPGRADES_BY_ID[requirement]
					table.insert(missing, if def ~= nil then def.label else requirement)
				end
			end
			row.desc.Text = "Zuerst: " .. table.concat(missing, ", ")
		end
	end
	if summary ~= nil then
		summary.Text = `{bought} / {#Config.UPGRADES} gekauft`
	end
end

return ShopController
