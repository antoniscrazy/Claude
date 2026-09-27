--!strict
--[[
	QuestsScreen – Aufgabenliste mit Fortschrittsbalken.

	Jede Zeile ist eine Card mit Titel, Balken, Zahlen und Abhol-Knopf.
	Der Knopf hat drei Zustaende, die sich nicht nur farblich, sondern
	auch im Text unterscheiden: gesperrt / abholbar / erledigt.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Remotes = require(Shared.Remotes)
local Theme = require(Shared.Theme)
local Types = require(Shared.Types)

local Client = script.Parent.Parent
local Layers = require(Client.UI.Layers)
local Button = require(Client.UI.Components.Button)
local Panel = require(Client.UI.Components.Panel)
local ProgressBar = require(Client.UI.Components.ProgressBar)

local QuestsScreen = {}

export type Handle = {
	destroy: (() -> ()),
	update: (state: Types.ClientState) -> (),
	toggle: () -> (),
	close: () -> (),
	isOpen: () -> boolean,
}

type Row = {
	def: Types.QuestDef,
	bar: ProgressBar.Handle,
	amount: TextLabel,
	button: Button.Handle,
}

function QuestsScreen.create(gui: ScreenGui, root: GuiObject): Handle
	local panelZ = Layers.at("panel", Theme.Depth.content)

	local panel = Panel.create({
		parent = root, gui = gui, name = "Quests",
		title = "AUFGABEN", subtitle = "Belohnungen in Gems",
		accent = Theme.Color.success, scrolling = true,
	})
	Theme.list({ parent = panel.body, gap = Theme.Space.x8 })

	local rows: { Row } = {}

	for index, def in ipairs(Config.QUESTS) do
		local card = Theme.Card({
			name = def.id, parent = panel.body,
			size = UDim2.new(1, -Theme.Space.x8, 0, Theme.Size.rowHeight + Theme.Space.x16),
			fill = Theme.Color.bg2, radius = Theme.Radius.card,
			zIndex = panelZ + Theme.Depth.content, shadow = false,
		})
		card.LayoutOrder = index
		Theme.padding(card, { all = Theme.Space.x12 })

		Theme.label({
			parent = card, text = def.label, role = "heading",
			size = Theme.TextSize.sm, color = Theme.Color.textHigh,
			layoutSize = UDim2.new(1, -Theme.Size.pillWidth / 2, 0, Theme.Space.x24),
			zIndex = panelZ + Theme.Depth.raised,
		})

		local amount = Theme.label({
			parent = card, text = "0 / 0", role = "numeric",
			size = Theme.TextSize.xs, color = Theme.Color.textLow,
			layoutSize = UDim2.new(1, -Theme.Size.pillWidth / 2, 0, Theme.Space.x16),
			position = UDim2.fromOffset(0, Theme.Space.x24),
			xAlign = Enum.TextXAlignment.Right,
			zIndex = panelZ + Theme.Depth.raised, stroke = false,
		})

		local bar = ProgressBar.create({
			parent = card, zIndex = panelZ + Theme.Depth.raised,
			color = Theme.Color.success,
			size = UDim2.new(1, -Theme.Size.pillWidth / 2, 0, Theme.Size.barHeight),
		})
		bar.instance.Position = UDim2.fromOffset(0, Theme.Space.x48)

		local questId = def.id
		local button: Button.Handle
		button = Button.create({
			parent = card, text = "+" .. tostring(def.rewardGems),
			variant = "secondary", icon = "gem",
			size = UDim2.fromOffset(Theme.Size.pillWidth / 2 - Theme.Space.x8,
				Theme.Size.controlHeight),
			position = UDim2.new(1, 0, 0.5, 0),
			anchor = Vector2.new(1, 0.5),
			zIndex = panelZ + Theme.Depth.raised,
			textSize = Theme.TextSize.sm,
			onActivated = function()
				button.setState("loading")
				task.spawn(function()
					-- Alle drei Rueckgaben aufnehmen: pcall liefert
					-- (erfolg, ok, meldung); nur zwei zu binden bringt die
					-- Typzuordnung durcheinander.
					local called, success, _message = pcall(function(): (boolean, string)
						return Remotes.fn("ClaimQuest"):InvokeServer(questId)
					end)
					button.setState("idle")
					if called and not success then
						button.shake()
					end
				end)
			end,
		})

		table.insert(rows, { def = def, bar = bar, amount = amount, button = button })
	end

	-- Kleiner Hinweis am Ende der Liste.
	Theme.label({
		parent = panel.body, role = "body",
		text = "Aufgaben bleiben ueber Rebirths hinweg bestehen.",
		size = Theme.TextSize.xs, color = Theme.Color.textLow,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x32),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = panelZ, layoutOrder = #Config.QUESTS + 1, stroke = false,
	})

	local function update(state: Types.ClientState)
		local ready = 0
		for _, row in ipairs(rows) do
			local progress = state.quests[row.def.metric] or 0
			local claimed = state.claimedQuests[row.def.id] == true
			local ratio = progress / row.def.target
			row.bar.set(ratio, if claimed then Theme.Color.textLow else Theme.Color.success)
			row.amount.Text = string.format("%s / %s",
				Format.abbreviate(progress), Format.abbreviate(row.def.target))

			if claimed then
				row.button.setVariant("secondary")
				row.button.setState("disabled")
				row.button.setText("ERLEDIGT")
			elseif ratio >= 1 then
				ready += 1
				row.button.setVariant("success")
				row.button.setState("idle")
				row.button.setText("+" .. tostring(row.def.rewardGems))
			else
				row.button.setVariant("secondary")
				row.button.setState("disabled")
				row.button.setText("+" .. tostring(row.def.rewardGems))
			end
		end
		panel.setSubtitle(
			if ready > 0 then `{ready} abholbar` else "Belohnungen in Gems")
	end

	return {
		update = update,
		toggle = panel.toggle,
		close = panel.close,
		isOpen = panel.isOpen,
		destroy = function()
			for _, row in ipairs(rows) do
				row.bar.destroy()
				row.button.destroy()
			end
			panel.destroy()
		end,
	}
end

return QuestsScreen
