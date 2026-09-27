--!strict
--[[
	RebirthScreen – der dramatischste Bildschirm im Spiel.

	Gestaltung mit Absicht:
	  * dunklerer Grund als alle anderen Panels (bg0 statt bg1)
	  * die Rebirth-Zahl gross in Display-Groesse
	  * Vorher/Nachher der Multiplikatoren nebeneinander mit Pfeil dazwischen
	  * Warnblock in danger-Farbe mit Rand, nicht nur roter Text
	  * ZWEISTUFIGE Bestaetigung: der erste Druck aendert den Knopf in
	    "WIRKLICH? ERNEUT DRUECKEN" und startet einen Countdown; erst der
	    zweite Druck sendet. Nach 4 Sekunden ohne zweiten Druck faellt der
	    Knopf zurueck. Ein Reset des gesamten Fortschritts darf nicht mit
	    einem versehentlichen Klick passieren.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Remotes = require(Shared.Remotes)
local Theme = require(Shared.Theme)
local Types = require(Shared.Types)

local Client = script.Parent.Parent
local Icon = require(Client.UI.Icon)
local Layers = require(Client.UI.Layers)
local Motion = require(Client.UI.Motion)
local Button = require(Client.UI.Components.Button)
local Panel = require(Client.UI.Components.Panel)
local ProgressBar = require(Client.UI.Components.ProgressBar)

local RebirthScreen = {}

export type Handle = {
	destroy: (() -> ()),
	update: (state: Types.ClientState) -> (),
	toggle: () -> (),
	close: () -> (),
	isOpen: () -> boolean,
}

local CONFIRM_WINDOW = 4

function RebirthScreen.create(gui: ScreenGui, root: GuiObject): Handle
	local scope = Motion.scope()
	local panelZ = Layers.at("panel", Theme.Depth.content)
	local armed = false
	local armToken = 0

	local panel = Panel.create({
		parent = root, gui = gui, name = "Rebirth",
		title = "REBIRTH", subtitle = "Alles zurueck - dafuer dauerhaft mehr",
		accent = Theme.Color.danger,
	})
	-- Dunkler als die uebrigen Panels: markiert den Ernst der Sache.
	panel.instance.BackgroundColor3 = Theme.Color.bg0

	local body = panel.body
	Theme.list({ parent = body, gap = Theme.Space.x12 })

	-- ---- Grosse Zahl -----------------------------------------------------
	local headline = Instance.new("Frame")
	headline.Name = "Headline"
	headline.Size = UDim2.new(1, 0, 0, Theme.Space.x48 + Theme.Space.x16)
	headline.BackgroundTransparency = Theme.Alpha.hidden
	headline.LayoutOrder = 1
	headline.ZIndex = panelZ
	headline.Parent = body
	Theme.list({
		parent = headline, gap = Theme.Space.x12,
		direction = Enum.FillDirection.Horizontal,
		hAlign = Enum.HorizontalAlignment.Center,
		vAlign = Enum.VerticalAlignment.Center,
	})
	local rebirthGlyph = Icon.create({
		name = "rebirth", parent = headline, size = Theme.Size.pillIcon,
		color = Theme.Color.danger, zIndex = panelZ + Theme.Depth.content,
		layoutOrder = 1,
	})
	rebirthGlyph.LayoutOrder = 1
	local bigNumber = Theme.label({
		name = "Number", parent = headline, text = "0", role = "display",
		size = Theme.TextSize.display, color = Theme.Color.textHigh,
		layoutSize = UDim2.fromOffset(Theme.Size.pillWidth, Theme.Space.x48 + Theme.Space.x16),
		xAlign = Enum.TextXAlignment.Left,
		zIndex = panelZ + Theme.Depth.content, layoutOrder = 2,
	})

	-- ---- Vorher / Nachher --------------------------------------------------
	local compare = Instance.new("Frame")
	compare.Name = "Compare"
	compare.Size = UDim2.new(1, 0, 0, Theme.Size.rowHeight)
	compare.BackgroundTransparency = Theme.Alpha.hidden
	compare.LayoutOrder = 2
	compare.ZIndex = panelZ
	compare.Parent = body
	Theme.list({
		parent = compare, gap = Theme.Space.x16,
		direction = Enum.FillDirection.Horizontal,
		hAlign = Enum.HorizontalAlignment.Center,
		vAlign = Enum.VerticalAlignment.Center,
	})

	local function multCard(caption: string, order: number, color: Color3): TextLabel
		local card = Theme.Card({
			name = caption, parent = compare,
			size = UDim2.fromOffset(Theme.Size.pillWidth * 0.8, Theme.Size.rowHeight),
			fill = Theme.Color.bg2, radius = Theme.Radius.card,
			zIndex = panelZ + Theme.Depth.content, shadow = false,
		})
		card.LayoutOrder = order
		Theme.label({
			parent = card, text = caption, role = "body",
			size = Theme.TextSize.xs, color = Theme.Color.textLow,
			layoutSize = UDim2.new(1, 0, 0, Theme.Space.x16),
			position = UDim2.fromOffset(0, Theme.Space.x8),
			xAlign = Enum.TextXAlignment.Center,
			zIndex = panelZ + Theme.Depth.raised, stroke = false,
		})
		return Theme.label({
			parent = card, text = "x1.00", role = "numeric",
			size = Theme.TextSize.lg, color = color,
			layoutSize = UDim2.new(1, 0, 0, Theme.Space.x24),
			position = UDim2.fromOffset(0, Theme.Space.x24),
			xAlign = Enum.TextXAlignment.Center,
			zIndex = panelZ + Theme.Depth.raised,
		})
	end

	local beforeValue = multCard("JETZT", 1, Theme.Color.textMid)
	local arrow = Theme.label({
		parent = compare, text = "->", role = "display",
		size = Theme.TextSize.lg, color = Theme.Color.danger,
		layoutSize = UDim2.fromOffset(Theme.Space.x32, Theme.Size.rowHeight),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = panelZ + Theme.Depth.content, layoutOrder = 2,
	})
	arrow.LayoutOrder = 2
	local afterValue = multCard("DANACH", 3, Theme.Color.success)

	-- ---- Fortschritt zur naechsten Schwelle ---------------------------------
	local progressRow = Instance.new("Frame")
	progressRow.Size = UDim2.new(1, 0, 0, Theme.Space.x32)
	progressRow.BackgroundTransparency = Theme.Alpha.hidden
	progressRow.LayoutOrder = 3
	progressRow.ZIndex = panelZ
	progressRow.Parent = body
	local progressLabel = Theme.label({
		parent = progressRow, text = "", role = "body",
		size = Theme.TextSize.xs, color = Theme.Color.textMid,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x16),
		zIndex = panelZ + Theme.Depth.content, stroke = false,
	})
	local progress = ProgressBar.create({
		parent = progressRow, zIndex = panelZ + Theme.Depth.content,
		color = Theme.Color.danger,
		size = UDim2.new(1, 0, 0, Theme.Size.barHeight),
	})
	progress.instance.Position = UDim2.fromOffset(0, Theme.Space.x16 + Theme.Space.x4)

	-- ---- Warnung -----------------------------------------------------------
	local warning = Theme.Card({
		name = "Warning", parent = body,
		size = UDim2.new(1, 0, 0, Theme.Size.rowHeight + Theme.Space.x16),
		fill = Theme.Color.dangerDeep, radius = Theme.Radius.card,
		strokeColor = Theme.Color.danger,
		zIndex = panelZ + Theme.Depth.content, shadow = false, gradient = false,
	})
	warning.LayoutOrder = 4
	Theme.padding(warning, { all = Theme.Space.x12 })
	Theme.label({
		parent = warning, role = "body",
		text = "Guthaben und alle " .. tostring(#Config.UPGRADES)
			.. " Upgrades werden geloescht. Gems, Aufgaben und Rebirth-Zahl bleiben.",
		size = Theme.TextSize.sm, color = Theme.Color.textHigh,
		layoutSize = UDim2.fromScale(1, 1), wrapped = true,
		yAlign = Enum.TextYAlignment.Top,
		zIndex = panelZ + Theme.Depth.raised,
	})

	-- ---- Zweistufige Bestaetigung -----------------------------------------------
	local confirm: Button.Handle
	local function disarm()
		if not armed then
			return
		end
		armed = false
		confirm.setVariant("danger")
		confirm.setText("REBIRTH STARTEN")
	end

	confirm = Button.create({
		parent = body, text = "REBIRTH STARTEN", variant = "danger",
		icon = "rebirth",
		size = UDim2.new(1, 0, 0, Theme.Size.controlHeight + Theme.Space.x8),
		zIndex = panelZ + Theme.Depth.content,
		layoutOrder = 5,
		onActivated = function()
			if not armed then
				armed = true
				armToken += 1
				local token = armToken
				confirm.setText("WIRKLICH? NOCHMAL DRUECKEN")
				confirm.setVariant("premium")
				-- Fenster laeuft ab: danach ist der Knopf wieder harmlos.
				task.delay(CONFIRM_WINDOW, function()
					if armToken == token then
						disarm()
					end
				end)
				return
			end
			armToken += 1
			disarm()
			Remotes.event("RequestRebirth"):FireServer()
		end,
	})

	local function update(state: Types.ClientState)
		bigNumber.Text = tostring(state.rebirths)
		beforeValue.Text = string.format("x%.2f", state.rebirthMultiplier)
		afterValue.Text = string.format("x%.2f", state.nextRebirthMultiplier)

		local ratio = if state.rebirthCost > 0 then state.cash / state.rebirthCost else 0
		progress.set(math.clamp(ratio, 0, 1))
		progressLabel.Text = string.format("%s / %s $",
			Format.abbreviate(state.cash), Format.abbreviate(state.rebirthCost))

		local affordable = state.cash >= state.rebirthCost
		if not affordable then
			disarm()
			confirm.setState("disabled")
			confirm.setText("NOCH ZU WENIG GELD")
		elseif not armed then
			confirm.setState("idle")
			confirm.setText("REBIRTH STARTEN")
		end
	end

	return {
		update = update,
		toggle = function()
			disarm()
			panel.toggle()
		end,
		close = function()
			disarm()
			panel.close()
		end,
		isOpen = panel.isOpen,
		destroy = function()
			confirm.destroy()
			progress.destroy()
			scope:destroy()
			panel.destroy()
		end,
	}
end

return RebirthScreen
