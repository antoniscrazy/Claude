--!strict
--[[
	CodesScreen – Codes einloesen und Tagesbelohnung abholen.

	Zum Eingabefeld: der Fokus-Ring ist ein UIStroke, der beim Fokussieren
	auf primary wechselt und beim Verlassen zurueck auf bg3. Rueckmeldung
	steht INLINE unter dem Feld (gruen oder rot), nicht als Popup - ein
	Popup verdeckt genau das Feld, in dem man gerade tippt.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Remotes = require(Shared.Remotes)
local Theme = require(Shared.Theme)
local Types = require(Shared.Types)

local Client = script.Parent.Parent
local Layers = require(Client.UI.Layers)
local Motion = require(Client.UI.Motion)
local Button = require(Client.UI.Components.Button)
local Panel = require(Client.UI.Components.Panel)

local CodesScreen = {}

export type Handle = {
	destroy: (() -> ()),
	update: (state: Types.ClientState) -> (),
	toggle: () -> (),
	close: () -> (),
	isOpen: () -> boolean,
}

function CodesScreen.create(gui: ScreenGui, root: GuiObject): Handle
	local scope = Motion.scope()
	local panelZ = Layers.at("panel", Theme.Depth.content)

	local panel = Panel.create({
		parent = root, gui = gui, name = "Codes",
		title = "CODES", subtitle = "Belohnungen einloesen",
		accent = Theme.Color.premium,
	})
	local body = panel.body
	Theme.list({ parent = body, gap = Theme.Space.x12 })

	-- ---- Eingabefeld ----------------------------------------------------
	local field = Theme.Card({
		name = "Field", parent = body,
		size = UDim2.new(1, 0, 0, Theme.Size.controlHeight + Theme.Space.x8),
		fill = Theme.Color.bg0, radius = Theme.Radius.control,
		zIndex = panelZ + Theme.Depth.content, shadow = false, gradient = false,
	})
	field.LayoutOrder = 1
	local focusRing = field:FindFirstChildOfClass("UIStroke")
	Theme.padding(field, { left = Theme.Space.x16, right = Theme.Space.x16 })

	local box = Instance.new("TextBox")
	box.Name = "Input"
	box.Size = UDim2.fromScale(1, 1)
	box.BackgroundTransparency = Theme.Alpha.hidden
	box.BorderSizePixel = 0
	box.PlaceholderText = "Code eintippen"
	box.PlaceholderColor3 = Theme.Color.textLow
	box.Text = ""
	box.TextColor3 = Theme.Color.textHigh
	box.Font = Theme.Font.heading
	box.TextSize = Theme.TextSize.lg
	box.TextXAlignment = Enum.TextXAlignment.Left
	box.ClearTextOnFocus = false
	box.ZIndex = panelZ + Theme.Depth.raised
	box.Parent = field

	-- ---- Inline-Rueckmeldung -------------------------------------------------
	local feedback = Theme.label({
		name = "Feedback", parent = body, text = "", role = "body",
		size = Theme.TextSize.sm, color = Theme.Color.textLow,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x24),
		wrapped = true, zIndex = panelZ + Theme.Depth.content, stroke = false,
	})
	feedback.LayoutOrder = 2

	local function say(text: string, ok: boolean?)
		feedback.Text = text
		feedback.TextColor3 = if ok == nil then Theme.Color.textLow
			elseif ok then Theme.Color.success
			else Theme.Color.danger
		feedback.TextTransparency = Theme.Alpha.hidden
		scope:to(feedback, { TextTransparency = Theme.Alpha.opaque },
			Theme.Duration.fast, "enter")
	end

	if focusRing ~= nil then
		local ring = focusRing
		scope:track(box.Focused:Connect(function()
			scope:to(ring, { Color = Theme.Color.primary, Thickness = Theme.Stroke.thin },
				Theme.Duration.fast, "enter")
		end))
		scope:track(box.FocusLost:Connect(function()
			scope:to(ring, { Color = Theme.Color.bg3, Thickness = Theme.Stroke.hair },
				Theme.Duration.fast, "exit")
		end))
	end

	local submit: Button.Handle
	local function redeem()
		local text = box.Text
		if #text == 0 then
			say("Bitte zuerst einen Code eintippen.", false)
			submit.shake()
			return
		end
		box.Text = ""
		submit.setState("loading")
		task.spawn(function()
			local ok, success, message = pcall(function(): (boolean, string)
				return Remotes.fn("RedeemCode"):InvokeServer(text)
			end)
			submit.setState("idle")
			if not ok then
				say("Server nicht erreichbar.", false)
				return
			end
			say(message, success)
			if not success then
				submit.shake()
			end
		end)
	end

	submit = Button.create({
		parent = body, text = "EINLOESEN", variant = "premium", icon = "code",
		size = UDim2.new(1, 0, 0, Theme.Size.controlHeight),
		zIndex = panelZ + Theme.Depth.content, layoutOrder = 3,
		onActivated = redeem,
	})
	scope:track(box.FocusLost:Connect(function(enterPressed: boolean)
		if enterPressed then
			redeem()
		end
	end))

	Theme.divider(body, 4)

	-- ---- Tagesbelohnung -------------------------------------------------------
	local dailyTitle = Theme.label({
		parent = body, text = "TAGESBELOHNUNG", role = "heading",
		size = Theme.TextSize.md, color = Theme.Color.textHigh,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x24),
		zIndex = panelZ + Theme.Depth.content, layoutOrder = 5,
	})
	dailyTitle.LayoutOrder = 5

	local dailyText = Theme.label({
		parent = body, text = "", role = "body",
		size = Theme.TextSize.sm, color = Theme.Color.textMid,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x48),
		wrapped = true, yAlign = Enum.TextYAlignment.Top,
		zIndex = panelZ + Theme.Depth.content, layoutOrder = 6, stroke = false,
	})

	local claim: Button.Handle
	claim = Button.create({
		parent = body, text = "ABHOLEN", variant = "success", icon = "cash",
		size = UDim2.new(1, 0, 0, Theme.Size.controlHeight),
		zIndex = panelZ + Theme.Depth.content, layoutOrder = 7,
		onActivated = function()
			claim.setState("loading")
			task.spawn(function()
				local ok, success, message = pcall(function(): (boolean, string)
					return Remotes.fn("ClaimDaily"):InvokeServer()
				end)
				claim.setState("idle")
				if not ok then
					say("Server nicht erreichbar.", false)
					return
				end
				say(message, success)
				if not success then
					claim.shake()
				end
			end)
		end,
	})

	local function update(state: Types.ClientState)
		local streak = math.min(state.dailyStreak, Config.DAILY.MAX_STREAK - 1)
		local next_ = Config.DAILY.BASE_CASH + Config.DAILY.CASH_PER_STREAK * streak
		dailyText.Text = string.format(
			"Serie: Tag %d von %d. Naechste Belohnung %s $. "
				.. "Am Tag %d kommen %d Gems dazu.",
			state.dailyStreak, Config.DAILY.MAX_STREAK,
			Format.abbreviate(next_), Config.DAILY.MAX_STREAK, Config.DAILY.GEMS_AT_MAX)
		if state.dailyReady then
			claim.setState("idle")
			claim.setText("ABHOLEN")
		else
			claim.setState("disabled")
			claim.setText("HEUTE SCHON ABGEHOLT")
		end
	end

	return {
		update = update,
		toggle = panel.toggle,
		close = panel.close,
		isOpen = panel.isOpen,
		destroy = function()
			submit.destroy()
			claim.destroy()
			scope:destroy()
			panel.destroy()
		end,
	}
end

return CodesScreen
