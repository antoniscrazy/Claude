--!strict
--[[
	Hud – die dauerhaft sichtbare Ebene.

	Aufteilung (siehe Wireframe in docs/UI.md):
	  oben links   Waehrungs-Pills, senkrecht gestapelt
	  rechts       senkrechte Leiste aus IconButtons
	  unten mitte  kontextueller Hinweisbalken

	Sicherheitsabstaende: die Pills beginnen unterhalb der Roblox-Topbar
	(GuiService liefert die echte Hoehe), die Leiste haelt den Randabstand
	ein, und der Hinweisbalken liegt ueber dem Bereich, in dem auf dem
	Handy Sprungknopf und Bewegungsstick sitzen. Nichts Klickbares liegt
	unter Topbar oder Mobilsteuerung - das ist der Zweck von
	Theme.Safe und Responsive.read().
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Theme = require(Shared.Theme)
local Types = require(Shared.Types)

local Client = script.Parent.Parent
local Icon = require(Client.UI.Icon)
local Layers = require(Client.UI.Layers)
local Motion = require(Client.UI.Motion)
local Responsive = require(Client.UI.Responsive)
local CurrencyPill = require(Client.UI.Components.CurrencyPill)
local IconButton = require(Client.UI.Components.IconButton)

local Hud = {}

export type ButtonKey = "shop" | "upgrade" | "rebirth" | "quest" | "code" | "settings"

type NavSpec = { key: ButtonKey, icon: Icon.Name, tooltip: string, accent: Color3 }

-- Die Literale werden explizit auf die Union-Typen gecastet: in einem
-- Tabellenliteral weitet Luau sie sonst zu `string`, und der Aufruf von
-- Hud.onButton(key) passt dann nicht mehr auf ButtonKey.
local NAV: { NavSpec } = {
	{ key = "shop" :: ButtonKey, icon = "shop" :: Icon.Name,
	  tooltip = "Fabrik-Upgrades", accent = Theme.Color.primary },
	{ key = "upgrade" :: ButtonKey, icon = "upgrade" :: Icon.Name,
	  tooltip = "Gem-Pakete", accent = Theme.Color.gem },
	{ key = "rebirth" :: ButtonKey, icon = "rebirth" :: Icon.Name,
	  tooltip = "Rebirth", accent = Theme.Color.danger },
	{ key = "quest" :: ButtonKey, icon = "quest" :: Icon.Name,
	  tooltip = "Aufgaben", accent = Theme.Color.success },
	{ key = "code" :: ButtonKey, icon = "code" :: Icon.Name,
	  tooltip = "Codes und Tagesbelohnung", accent = Theme.Color.premium },
	{ key = "settings" :: ButtonKey, icon = "settings" :: Icon.Name,
	  tooltip = "Optionen", accent = Theme.Color.textMid },
}

export type Handle = {
	destroy: (() -> ()),
	update: (state: Types.ClientState) -> (),
	setActive: (key: ButtonKey, active: boolean) -> (),
	flashCash: () -> (),
	layout: (viewport: Responsive.Viewport) -> (),
}

Hud.onButton = function(_key: ButtonKey) end

function Hud.create(gui: ScreenGui, root: GuiObject): Handle
	local scope = Motion.scope()
	local hudZ = Layers.at("hud", Theme.Depth.base)

	-- ---- Waehrungen oben links ------------------------------------------
	local stack = Instance.new("Frame")
	stack.Name = "Currencies"
	stack.Size = UDim2.fromOffset(Theme.Size.pillWidth, Theme.Size.pillHeight * 3)
	stack.AnchorPoint = Vector2.new(0, 0)
	stack.BackgroundTransparency = Theme.Alpha.hidden
	stack.ZIndex = hudZ
	stack.Parent = root
	Theme.list({ parent = stack, gap = Theme.Space.x8 })

	local cashPill = CurrencyPill.create({
		parent = stack, icon = "cash", caption = "GUTHABEN",
		accent = Theme.Color.success, zIndex = hudZ + Theme.Depth.content, layoutOrder = 1,
	})
	local gemPill = CurrencyPill.create({
		parent = stack, icon = "gem", caption = "GEMS",
		accent = Theme.Color.gem, zIndex = hudZ + Theme.Depth.content, layoutOrder = 2,
	})
	local rebirthPill = CurrencyPill.create({
		parent = stack, icon = "rebirth", caption = "REBIRTH",
		accent = Theme.Color.danger, zIndex = hudZ + Theme.Depth.content, layoutOrder = 3,
	})

	-- Einkommen als schmale Zeile unter den Pills
	local incomeChip = Theme.Card({
		name = "Income", parent = stack,
		size = UDim2.fromOffset(Theme.Size.pillWidth, Theme.Space.x32),
		fill = Theme.Color.bg1, radius = Theme.Radius.pill,
		zIndex = hudZ + Theme.Depth.content, shadow = false,
	})
	incomeChip.LayoutOrder = 4
	local incomeLabel = Theme.label({
		parent = incomeChip, text = "0 $/s", role = "numeric",
		size = Theme.TextSize.sm, color = Theme.Color.textMid,
		layoutSize = UDim2.new(1, -Theme.Space.x24, 1, 0),
		position = UDim2.fromOffset(Theme.Space.x12, 0),
		zIndex = hudZ + Theme.Depth.raised, stroke = false,
	})

	-- ---- Navigationsleiste rechts -----------------------------------------
	local nav = Instance.new("Frame")
	nav.Name = "Nav"
	nav.AnchorPoint = Vector2.new(1, 0.5)
	nav.BackgroundTransparency = Theme.Alpha.hidden
	nav.ZIndex = hudZ
	nav.Parent = root
	Theme.list({
		parent = nav, gap = Theme.Space.x8,
		hAlign = Enum.HorizontalAlignment.Right,
	})

	-- Intern mit String-Schluesseln: ein Index mit Stringliteral weitet
	-- sonst zu string und passt nicht auf den Union-Schluesseltyp.
	local buttons: { [string]: IconButton.Handle } = {}
	for index, spec in ipairs(NAV) do
		-- Annotiert, damit der Union-Typ beim Zuweisen nicht zu string weitet.
		local key: ButtonKey = spec.key
		buttons[key] = IconButton.create({
			parent = nav, icon = spec.icon, tooltip = spec.tooltip,
			accent = spec.accent, zIndex = hudZ + Theme.Depth.content,
			layoutOrder = index,
			onActivated = function()
				Hud.onButton(key)
			end,
		})
	end

	-- ---- Hinweisbalken unten -----------------------------------------------
	local hint = Theme.Card({
		name = "Hint", parent = root,
		size = UDim2.fromOffset(Theme.Size.hintWidth, Theme.Size.hintHeight),
		anchor = Vector2.new(0.5, 1),
		fill = Theme.Color.bg2, radius = Theme.Radius.pill,
		strokeColor = Theme.Color.primary,
		zIndex = hudZ + Theme.Depth.content,
		visible = false,
	})
	Theme.padding(hint, { left = Theme.Space.x16, right = Theme.Space.x16 })
	local hintIcon = Icon.create({
		name = "upgrade", parent = hint, size = Theme.Size.iconSm,
		color = Theme.Color.primary, zIndex = hudZ + Theme.Depth.raised,
		anchor = Vector2.new(0, 0.5), position = UDim2.fromScale(0, 0.5),
	})
	local hintLabel = Theme.label({
		parent = hint, text = "", role = "heading",
		size = Theme.TextSize.sm, color = Theme.Color.textHigh,
		layoutSize = UDim2.new(1, -Theme.Space.x32, 1, 0),
		position = UDim2.fromOffset(Theme.Space.x32, 0),
		zIndex = hudZ + Theme.Depth.raised,
	})
	local hintVisible = false
	local hintScale = Instance.new("UIScale")
	hintScale.Parent = hint

	local function setHint(text: string?)
		local wanted = text ~= nil
		if wanted and text ~= nil then
			hintLabel.Text = text
		end
		if wanted == hintVisible then
			return
		end
		hintVisible = wanted
		if wanted then
			hint.Visible = true
			hint.BackgroundTransparency = Theme.Alpha.hidden
			hintScale.Scale = Theme.Scale.panelEnter
			scope:to(hint, { BackgroundTransparency = Theme.Alpha.opaque },
				Theme.Duration.slow, "enter")
			scope:to(hintScale, { Scale = Theme.Scale.rest }, Theme.Duration.slow, "pop")
		else
			-- Ausblenden, nicht einfach verstecken.
			local fade = scope:to(hint, { BackgroundTransparency = Theme.Alpha.hidden },
				Theme.Duration.slow, "exit")
			fade.Completed:Once(function()
				if not hintVisible then
					hint.Visible = false
				end
			end)
		end
	end

	-- ---- Platzierung mit Sicherheitsabstaenden --------------------------------
	local function layout(viewport: Responsive.Viewport)
		-- Die Positionen sind in UNSKALIERTEN Pixeln angegeben; die globale
		-- UIScale sitzt auf `root` und verkleinert sie mit. Deshalb wird
		-- der Sicherheitsabstand durch die Skalierung geteilt, sonst
		-- schrumpft er auf kleinen Geraeten mit.
		local factor = viewport.scale
		local edge = Theme.Safe.edge / factor
		local top = viewport.topInset / factor
		local bottom = viewport.bottomInset / factor

		stack.Position = UDim2.fromOffset(edge, top + Theme.Space.x8)
		nav.Position = UDim2.new(1, -edge, 0.5, 0)
		nav.Size = UDim2.fromOffset(
			Responsive.minTouchSize(),
			(#NAV) * (Responsive.minTouchSize() + Theme.Space.x8))
		hint.Position = UDim2.new(0.5, 0, 1, -(bottom + Theme.Space.x8))

		-- Im Hochformat sind die Pills schmaler, sonst nehmen sie die
		-- halbe Bildschirmbreite ein.
		local narrow = viewport.portrait or viewport.compact
		local pillWidth = if narrow
			then Theme.Size.pillWidth - Theme.Space.x48
			else Theme.Size.pillWidth
		stack.Size = UDim2.fromOffset(pillWidth, Theme.Size.pillHeight * 3)
		for _, pill in ipairs({ cashPill, gemPill, rebirthPill }) do
			pill.instance.Size = UDim2.fromOffset(pillWidth, Theme.Size.pillHeight)
		end
		incomeChip.Size = UDim2.fromOffset(pillWidth, Theme.Space.x32)
		hint.Size = UDim2.fromOffset(
			math.min(Theme.Size.hintWidth, viewport.width / factor - edge * 2),
			Theme.Size.hintHeight)
	end

	-- ---- Aktualisierung ---------------------------------------------------------
	local function update(state: Types.ClientState)
		cashPill.setValue(state.cash)
		gemPill.setValue(state.gems)
		rebirthPill.setValue(state.rebirths)
		incomeLabel.Text = Format.abbreviate(state.incomePerSecond) .. " $/s"

		-- Badges: abholbare Inhalte melden sich selbst.
		local claimable = 0
		for _, quest in ipairs(Config.QUESTS) do
			local progress = state.quests[quest.metric] or 0
			if progress >= quest.target and not state.claimedQuests[quest.id] then
				claimable += 1
			end
		end
		local questButton = buttons["quest"]
		local codeButton = buttons["code"]
		local rebirthButton = buttons["rebirth"]
		if questButton == nil or codeButton == nil or rebirthButton == nil then
			return
		end
		questButton.setBadge(claimable > 0, claimable)
		codeButton.setBadge(state.dailyReady, nil)
		rebirthButton.setBadge(state.cash >= state.rebirthCost, nil)

		-- Kontexthinweis: zeigt genau den naechsten sinnvollen Schritt.
		local bought = 0
		for _ in pairs(state.purchased) do
			bought += 1
		end
		if bought == 0 then
			setHint("Lauf auf ein blaues Feld und kauf deinen ersten Bohrer")
		elseif state.cash >= state.rebirthCost then
			setHint("Du kannst rebirthen - dauerhaft mehr Einkommen")
		else
			setHint(nil)
		end
	end

	return {
		update = update,
		layout = layout,
		setActive = function(key: ButtonKey, active: boolean)
			local handle: IconButton.Handle? = buttons[key]
			if handle ~= nil then
				handle.setActive(active)
			end
		end,
		flashCash = cashPill.flashError,
		destroy = function()
			for _, handle in pairs(buttons) do
				handle.destroy()
			end
			cashPill.destroy()
			gemPill.destroy()
			rebirthPill.destroy()
			scope:destroy()
			stack:Destroy()
			nav:Destroy()
			hint:Destroy()
			hintIcon:Destroy()
		end,
	}
end

return Hud
