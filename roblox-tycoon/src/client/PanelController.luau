--!strict
--[[
	PanelController – Aufgaben, Tagesbelohnung, Codes, Gem-Pakete,
	Rebirth-Bestaetigung und Einstellungen.

	Alle Panels teilen sich denselben Rahmen (UIKit.centeredPanel), damit
	Aussehen und Responsivitaet nur an EINER Stelle gepflegt werden.

	Zu den RemoteFunctions: InvokeServer yieldet. Jeder Aufruf laeuft
	deshalb in einem eigenen Thread und in pcall - bleibt der Server haengen
	oder verschwindet das Remote beim Herunterfahren, friert sonst der
	Knopf (und mit ihm der Eindruck, das Spiel haenge).
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Remotes = require(Shared.Remotes)
local Types = require(Shared.Types)

local NotifyController = require(script.Parent.NotifyController)
local SoundController = require(script.Parent.SoundController)
local UIKit = require(script.Parent.UIKit)

local C = Config.COLORS

local PanelController = {}

local panels: { [string]: Frame } = {}

-- Aufgaben-Zeilen zum spaeteren Aktualisieren
type QuestRow = {
	def: Types.QuestDef,
	bar: Frame,
	text: TextLabel,
	button: TextButton,
}
local questRows: { QuestRow } = {}

local dailyText: TextLabel? = nil
local dailyButton: TextButton? = nil
local rebirthInfo: TextLabel? = nil
local rebirthButton: TextButton? = nil

-- ==========================================================================
-- Gemeinsamer Rahmen
-- ==========================================================================

local function makePanel(gui: ScreenGui, root: Frame, key: string, title: string): (Frame, Frame)
	local panel = UIKit.centeredPanel(gui, root, key .. "Panel")

	UIKit.label({
		parent = panel, text = title, textColor = C.ACCENT,
		size = UDim2.new(1, -80, 0, 38), position = UDim2.fromOffset(20, 14),
		font = Enum.Font.GothamBlack, textSize = 23,
		xAlign = Enum.TextXAlignment.Left, zIndex = 21,
	})

	local close = UIKit.button({
		name = "Close", parent = panel, text = "X",
		size = UDim2.fromOffset(36, 36), position = UDim2.new(1, -16, 0, 14),
		anchor = Vector2.new(1, 0),
		background = C.DANGER, textColor = Color3.new(1, 1, 1),
		font = Enum.Font.GothamBlack, textSize = 18, zIndex = 22,
	})
	close.Activated:Connect(function()
		UIKit.setPanelVisible(panel, false)
	end)

	local body = UIKit.frame({
		name = "Body", parent = panel,
		size = UDim2.new(1, -28, 1, -70),
		position = UDim2.fromOffset(14, 58),
		transparency = 1, zIndex = 21,
	})

	panels[key] = panel
	return panel, body
end

-- Ruft eine RemoteFunction sicher auf und zeigt die Antwort als Meldung.
local function invoke(name: string, argument: string?)
	task.spawn(function()
		local ok, success, message = pcall(function(): (boolean, string)
			if argument ~= nil then
				return Remotes.fn(name):InvokeServer(argument)
			end
			return Remotes.fn(name):InvokeServer()
		end)
		if not ok then
			NotifyController.show("Server nicht erreichbar.", "error")
			return
		end
		NotifyController.show(message, if success then "success" else "error")
		SoundController.play(if success then "purchase" else "error")
	end)
end

-- ==========================================================================
-- Aufgaben
-- ==========================================================================

local function buildQuests(gui: ScreenGui, root: Frame)
	local _, body = makePanel(gui, root, "quests", "AUFGABEN")
	local scroll = UIKit.scroll({ parent = body, zIndex = 21 })
	UIKit.list(scroll, 6, Enum.FillDirection.Vertical)

	for index, def in ipairs(Config.QUESTS) do
		local row = UIKit.frame({
			name = def.id, parent = scroll,
			size = UDim2.new(1, -8, 0, 58),
			color = C.PANEL_LIGHT, transparency = 0.15, zIndex = 21,
		})
		row.LayoutOrder = index
		UIKit.corner(row, 10)

		local text = UIKit.label({
			parent = row, text = def.label, textColor = C.TEXT,
			size = UDim2.new(1, -130, 0, 22), position = UDim2.fromOffset(12, 6),
			font = Enum.Font.GothamBold, textSize = 15,
			xAlign = Enum.TextXAlignment.Left, zIndex = 22,
		})

		-- Fortschrittsbalken: Hintergrund + Fuellung.
		local track = UIKit.frame({
			parent = row, size = UDim2.new(1, -130, 0, 12),
			position = UDim2.fromOffset(12, 32),
			color = C.PANEL, transparency = 0.2, zIndex = 22,
		})
		UIKit.corner(track, 6)
		local bar = UIKit.frame({
			name = "Fill", parent = track,
			size = UDim2.fromScale(0, 1), color = C.CASH, zIndex = 23,
		})
		UIKit.corner(bar, 6)

		local button = UIKit.button({
			name = "Claim", parent = row, text = `+{def.rewardGems}`,
			size = UDim2.fromOffset(96, 34), position = UDim2.new(1, -108, 0, 12),
			background = C.GEM, textColor = Color3.new(1, 1, 1),
			font = Enum.Font.GothamBold, textSize = 15, zIndex = 22,
		})
		button.Activated:Connect(function()
			invoke("ClaimQuest", def.id)
		end)

		table.insert(questRows, { def = def, bar = bar, text = text, button = button })
	end
end

-- ==========================================================================
-- Tagesbelohnung
-- ==========================================================================

local function buildDaily(gui: ScreenGui, root: Frame)
	local _, body = makePanel(gui, root, "daily", "TAGESBELOHNUNG")

	dailyText = UIKit.label({
		parent = body, text = "", textColor = C.TEXT,
		size = UDim2.new(1, 0, 0, 120), position = UDim2.fromOffset(0, 10),
		font = Enum.Font.GothamMedium, textSize = 17,
		wrapped = true, zIndex = 22,
	})

	local button = UIKit.button({
		name = "Claim", parent = body, text = "ABHOLEN",
		size = UDim2.new(0, 220, 0, 52), position = UDim2.new(0.5, 0, 0, 150),
		anchor = Vector2.new(0.5, 0),
		background = C.CASH, textColor = Color3.fromRGB(12, 30, 18),
		font = Enum.Font.GothamBlack, textSize = 19, zIndex = 22,
	})
	button.Activated:Connect(function()
		invoke("ClaimDaily", nil)
	end)
	dailyButton = button
end

-- ==========================================================================
-- Codes
-- ==========================================================================

local function buildCodes(gui: ScreenGui, root: Frame)
	local _, body = makePanel(gui, root, "codes", "CODES EINLOESEN")

	local box = Instance.new("TextBox")
	box.Name = "CodeBox"
	box.Size = UDim2.new(1, -40, 0, 50)
	box.Position = UDim2.fromOffset(20, 16)
	box.BackgroundColor3 = C.PANEL_LIGHT
	box.BorderSizePixel = 0
	box.PlaceholderText = "Code hier eintippen"
	box.PlaceholderColor3 = C.TEXT_DIM
	box.Text = ""
	box.TextColor3 = C.TEXT
	box.Font = Enum.Font.GothamBold
	box.TextSize = 19
	box.ClearTextOnFocus = false
	box.ZIndex = 22
	box.Parent = body
	UIKit.corner(box, 10)

	local submit = UIKit.button({
		name = "Submit", parent = body, text = "EINLOESEN",
		size = UDim2.new(0, 200, 0, 46), position = UDim2.new(0.5, 0, 0, 78),
		anchor = Vector2.new(0.5, 0),
		background = C.GEM, textColor = Color3.new(1, 1, 1),
		font = Enum.Font.GothamBlack, textSize = 17, zIndex = 22,
	})
	submit.Activated:Connect(function()
		local text = box.Text
		if #text == 0 then
			NotifyController.show("Bitte einen Code eingeben.", "error")
			return
		end
		box.Text = ""
		invoke("RedeemCode", text)
	end)

	UIKit.label({
		parent = body, text = "Codes findest du auf unserer Gruppenseite.",
		textColor = C.TEXT_DIM,
		size = UDim2.new(1, -40, 0, 40), position = UDim2.fromOffset(20, 134),
		font = Enum.Font.GothamMedium, textSize = 14, wrapped = true, zIndex = 22,
	})
end

-- ==========================================================================
-- Gem-Pakete
-- ==========================================================================

local function buildGems(gui: ScreenGui, root: Frame)
	local _, body = makePanel(gui, root, "gems", "GEM-PAKETE")
	local scroll = UIKit.scroll({ parent = body, zIndex = 21 })
	UIKit.list(scroll, 8, Enum.FillDirection.Vertical)

	for index, product in ipairs(Config.GEM_PRODUCTS) do
		local row = UIKit.frame({
			parent = scroll, size = UDim2.new(1, -8, 0, 56),
			color = C.PANEL_LIGHT, transparency = 0.15, zIndex = 21,
		})
		row.LayoutOrder = index
		UIKit.corner(row, 10)

		UIKit.label({
			parent = row, text = product.label, textColor = C.GEM,
			size = UDim2.new(1, -150, 1, 0), position = UDim2.fromOffset(14, 0),
			font = Enum.Font.GothamBold, textSize = 17,
			xAlign = Enum.TextXAlignment.Left, zIndex = 22,
		})
		local buy = UIKit.button({
			parent = row, text = if product.productId == 0 then "BALD" else "KAUFEN",
			size = UDim2.fromOffset(120, 36), position = UDim2.new(1, -134, 0.5, 0),
			anchor = Vector2.new(0, 0.5),
			background = if product.productId == 0 then C.LOCKED else C.GEM,
			textColor = Color3.new(1, 1, 1),
			font = Enum.Font.GothamBold, textSize = 15, zIndex = 22,
		})
		buy.Activated:Connect(function()
			Remotes.event("PromptGemProduct"):FireServer(product.id)
		end)
	end
end

-- ==========================================================================
-- Rebirth-Bestaetigung
-- ==========================================================================

local function buildRebirth(gui: ScreenGui, root: Frame)
	local _, body = makePanel(gui, root, "rebirth", "REBIRTH")

	rebirthInfo = UIKit.label({
		parent = body, text = "", textColor = C.TEXT,
		size = UDim2.new(1, -20, 0, 150), position = UDim2.fromOffset(10, 6),
		font = Enum.Font.GothamMedium, textSize = 16,
		wrapped = true, yAlign = Enum.TextYAlignment.Top, zIndex = 22,
	})

	local confirm = UIKit.button({
		name = "Confirm", parent = body, text = "JETZT REBIRTHEN",
		size = UDim2.new(0, 250, 0, 52), position = UDim2.new(0.5, 0, 1, -66),
		anchor = Vector2.new(0.5, 0),
		background = C.DANGER, textColor = Color3.new(1, 1, 1),
		font = Enum.Font.GothamBlack, textSize = 18, zIndex = 22,
	})
	confirm.Activated:Connect(function()
		Remotes.event("RequestRebirth"):FireServer()
	end)
	rebirthButton = confirm
end

-- ==========================================================================
-- Einstellungen
-- ==========================================================================

local function buildSettings(gui: ScreenGui, root: Frame)
	local _, body = makePanel(gui, root, "settings", "OPTIONEN")

	local sfxOn = true
	local toggle = UIKit.button({
		name = "Sfx", parent = body, text = "Soundeffekte: AN",
		size = UDim2.new(1, -40, 0, 48), position = UDim2.fromOffset(20, 12),
		background = C.PANEL_LIGHT, textColor = C.TEXT,
		font = Enum.Font.GothamBold, textSize = 16, zIndex = 22,
	})
	toggle.Activated:Connect(function()
		sfxOn = not sfxOn
		SoundController.setEnabled(sfxOn)
		toggle.Text = if sfxOn then "Soundeffekte: AN" else "Soundeffekte: AUS"
	end)

	UIKit.label({
		parent = body,
		text = "Bergbau-Imperium\nAlle Preise und Multiplikatoren stehen in "
			.. "Config.luau und sind mit tools/balance_sim.py nachgerechnet.",
		textColor = C.TEXT_DIM,
		size = UDim2.new(1, -40, 0, 90), position = UDim2.fromOffset(20, 78),
		font = Enum.Font.GothamMedium, textSize = 14,
		wrapped = true, yAlign = Enum.TextYAlignment.Top, zIndex = 22,
	})
end

-- ==========================================================================
-- Oeffentlich
-- ==========================================================================

function PanelController.build(gui: ScreenGui, root: Frame)
	buildQuests(gui, root)
	buildDaily(gui, root)
	buildCodes(gui, root)
	buildGems(gui, root)
	buildRebirth(gui, root)
	buildSettings(gui, root)
end

function PanelController.toggle(key: string)
	-- Optional annotiert: ein unbekannter Key liefert zur Laufzeit nil.
	local panel: Frame? = panels[key]
	if panel == nil then
		return
	end
	-- Immer nur ein Panel offen: zwei uebereinander sind auf dem Handy
	-- nicht mehr bedienbar.
	for otherKey, other in pairs(panels) do
		if otherKey ~= key and other.Visible then
			UIKit.setPanelVisible(other, false)
		end
	end
	UIKit.setPanelVisible(panel, not panel.Visible)
end

function PanelController.closeAll()
	for _, panel in pairs(panels) do
		if panel.Visible then
			UIKit.setPanelVisible(panel, false)
		end
	end
end

function PanelController.update(state: Types.ClientState)
	-- Aufgaben
	for _, row in ipairs(questRows) do
		local progress = state.quests[row.def.metric] or 0
		local claimed = state.claimedQuests[row.def.id] == true
		local ratio = math.clamp(progress / row.def.target, 0, 1)
		row.bar.Size = UDim2.fromScale(ratio, 1)
		row.bar.BackgroundColor3 = if claimed then C.TEXT_DIM else C.CASH
		row.text.Text = string.format("%s   %s / %s",
			row.def.label, Format.abbreviate(progress), Format.abbreviate(row.def.target))
		if claimed then
			row.button.Text = "ERLEDIGT"
			row.button.BackgroundColor3 = C.TEXT_DIM
		elseif ratio >= 1 then
			row.button.Text = `+{row.def.rewardGems}`
			row.button.BackgroundColor3 = C.GEM
		else
			row.button.Text = `+{row.def.rewardGems}`
			row.button.BackgroundColor3 = C.LOCKED
		end
	end

	-- Tagesbelohnung
	if dailyText ~= nil then
		local nextCash = Config.DAILY.BASE_CASH
			+ Config.DAILY.CASH_PER_STREAK * math.min(state.dailyStreak, Config.DAILY.MAX_STREAK - 1)
		dailyText.Text = string.format(
			"Aktuelle Serie: Tag %d von %d\n\nNaechste Belohnung: %s $\n\n"
				.. "Hol die Belohnung jeden Tag ab - je laenger die Serie, "
				.. "desto mehr gibt es. Am Tag %d kommen %d Gems dazu.",
			state.dailyStreak, Config.DAILY.MAX_STREAK,
			Format.abbreviate(nextCash),
			Config.DAILY.MAX_STREAK, Config.DAILY.GEMS_AT_MAX)
	end
	if dailyButton ~= nil then
		dailyButton.Text = if state.dailyReady then "ABHOLEN" else "NOCH NICHT BEREIT"
		dailyButton.BackgroundColor3 = if state.dailyReady then C.CASH else C.LOCKED
	end

	-- Rebirth
	if rebirthInfo ~= nil then
		rebirthInfo.Text = string.format(
			"Kosten: %s $\nDu hast: %s $\n\nEinkommen jetzt: x%.2f\nNach dem Rebirth: x%.2f\n"
				.. "Dazu gibt es %d Gems.\n\nACHTUNG: Guthaben und alle %d Upgrades "
				.. "werden zurueckgesetzt. Gems, Aufgaben und Rebirths bleiben.",
			Format.abbreviate(state.rebirthCost), Format.abbreviate(state.cash),
			state.rebirthMultiplier, state.nextRebirthMultiplier,
			Config.REBIRTH.GEMS_PER, #Config.UPGRADES)
	end
	if rebirthButton ~= nil then
		local affordable = state.cash >= state.rebirthCost
		rebirthButton.BackgroundColor3 = if affordable then C.DANGER else C.LOCKED
		rebirthButton.Text = if affordable then "JETZT REBIRTHEN" else "NOCH ZU WENIG GELD"
	end
end

return PanelController
