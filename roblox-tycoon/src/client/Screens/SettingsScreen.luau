--!strict
--[[
	SettingsScreen – Optionen in Gruppen mit Trennlinien.

	Keine nackte Liste: jede Gruppe hat eine Ueberschrift in textLow, die
	Eintraege stehen darunter, dazwischen eine 1-px-Trennlinie in bg3 mit
	40 % Transparenz.

	"Reduzierte Bewegung" setzt Theme.reduceMotion. Weil jede Dauer im
	Spiel durch Theme.duration() laeuft, wirkt der Schalter sofort auf
	alles - ohne einen zweiten Codepfad und ohne Layoutaenderung.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)
local Types = require(Shared.Types)

local Client = script.Parent.Parent
local Layers = require(Client.UI.Layers)
local Panel = require(Client.UI.Components.Panel)
local SegmentedControl = require(Client.UI.Components.SegmentedControl)
local SoundController = require(Client.SoundController)

local SettingsScreen = {}

export type Handle = {
	destroy: (() -> ()),
	update: (state: Types.ClientState) -> (),
	toggle: () -> (),
	close: () -> (),
	isOpen: () -> boolean,
}

local ON_OFF: { SegmentedControl.Option } = {
	{ id = "on", label = "An" },
	{ id = "off", label = "Aus" },
}

function SettingsScreen.create(gui: ScreenGui, root: GuiObject): Handle
	local panelZ = Layers.at("panel", Theme.Depth.content)

	local panel = Panel.create({
		parent = root, gui = gui, name = "Settings",
		title = "OPTIONEN", subtitle = "Ton und Darstellung",
		accent = Theme.Color.textMid, scrolling = true,
	})
	Theme.list({ parent = panel.body, gap = Theme.Space.x8 })

	local order = 0
	local controls: { SegmentedControl.Handle } = {}

	local function groupTitle(text: string)
		order += 1
		local label = Theme.label({
			parent = panel.body, text = text, role = "heading",
			size = Theme.TextSize.xs, color = Theme.Color.textLow,
			layoutSize = UDim2.new(1, 0, 0, Theme.Space.x24),
			zIndex = panelZ, stroke = false,
		})
		label.LayoutOrder = order
	end

	local function row(label: string, hint: string,
		initial: string, onChange: (id: string) -> ())
		order += 1
		local card = Theme.Card({
			name = label, parent = panel.body,
			size = UDim2.new(1, -Theme.Space.x8, 0, Theme.Size.rowHeight + Theme.Space.x16),
			fill = Theme.Color.bg2, radius = Theme.Radius.card,
			zIndex = panelZ + Theme.Depth.content, shadow = false,
		})
		card.LayoutOrder = order
		Theme.padding(card, { all = Theme.Space.x12 })

		Theme.label({
			parent = card, text = label, role = "heading",
			size = Theme.TextSize.sm, color = Theme.Color.textHigh,
			layoutSize = UDim2.new(1, -Theme.Size.pillWidth, 0, Theme.Space.x24),
			zIndex = panelZ + Theme.Depth.raised,
		})
		Theme.label({
			parent = card, text = hint, role = "body",
			size = Theme.TextSize.xs, color = Theme.Color.textLow,
			layoutSize = UDim2.new(1, -Theme.Size.pillWidth, 0, Theme.Space.x24),
			position = UDim2.fromOffset(0, Theme.Space.x24),
			wrapped = true, yAlign = Enum.TextYAlignment.Top,
			zIndex = panelZ + Theme.Depth.raised, stroke = false,
		})

		local holder = Instance.new("Frame")
		holder.Size = UDim2.fromOffset(Theme.Size.pillWidth * 0.8, Theme.Size.controlHeight)
		holder.Position = UDim2.new(1, 0, 0.5, 0)
		holder.AnchorPoint = Vector2.new(1, 0.5)
		holder.BackgroundTransparency = Theme.Alpha.hidden
		holder.ZIndex = panelZ + Theme.Depth.raised
		holder.Parent = card

		local control = SegmentedControl.create(holder, ON_OFF,
			panelZ + Theme.Depth.raised, onChange)
		control.select(initial, false)
		table.insert(controls, control)
	end

	local function divider()
		order += 1
		Theme.divider(panel.body, order)
	end

	groupTitle("TON")
	row("Soundeffekte", "Klick, Kauf und Sammeln", "on", function(id: string)
		SoundController.setEnabled(id == "on")
	end)
	row("Hintergrundmusik", "Ambiente der Mine", "on", function(id: string)
		SoundController.setAmbienceEnabled(id == "on")
	end)

	divider()

	groupTitle("DARSTELLUNG")
	row("Reduzierte Bewegung", "Blendet alle Animationen aus. Das Layout "
		.. "bleibt gleich, nur die Uebergaenge entfallen.", "off",
		function(id: string)
			Theme.reduceMotion = id == "on"
		end)

	divider()

	groupTitle("UEBER")
	order += 1
	local about = Theme.label({
		parent = panel.body, role = "body",
		text = "Bergbau-Imperium. Farben, Abstaende, Schriftgroessen und "
			.. "Bewegungsdauern stammen vollstaendig aus Theme.luau; die "
			.. "Preiskurve aus tools/balance_sim.py.",
		size = Theme.TextSize.xs, color = Theme.Color.textLow,
		layoutSize = UDim2.new(1, 0, 0, Theme.Size.rowHeight),
		wrapped = true, yAlign = Enum.TextYAlignment.Top,
		zIndex = panelZ, stroke = false,
	})
	about.LayoutOrder = order

	return {
		update = function(_state: Types.ClientState) end,
		toggle = panel.toggle,
		close = panel.close,
		isOpen = panel.isOpen,
		destroy = function()
			for _, control in ipairs(controls) do
				control.destroy()
			end
			panel.destroy()
		end,
	}
end

return SettingsScreen
