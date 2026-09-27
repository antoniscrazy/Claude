--!strict
--[[
	Bootstrap (Client) – baut die Oberflaeche und verteilt Servernachrichten.

	Aufbau der ScreenGui:
	  TycoonUI (ScreenGui, IgnoreGuiInset = false, ResetOnSpawn = false,
	            ZIndexBehavior = Sibling)
	   +- Root (Vollbild, traegt die globale UIScale)
	       +- HUD       Band 100
	       +- Panels    Band 200
	       +- Modal     Band 300 (Backdrop)
	       +- Toasts    Band 400
	       +- Tooltip   Band 500

	IgnoreGuiInset ist bewusst FALSE: dadurch beginnt die Oberflaeche
	unterhalb der Roblox-Topbar, und nichts Klickbares kann darunter
	geraten. Der zusaetzliche Sicherheitsabstand aus Theme.Safe kommt
	obendrauf.

	Der Client haelt keinen eigenen fortgeschriebenen Spielzustand - er
	zeigt den letzten Serverschnappschuss. Zwei Wahrheiten waeren die
	sichere Quelle fuer "UI zeigt genug Geld, Kauf wird trotzdem abgelehnt".
]]

local Players = game:GetService("Players")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Log = require(Shared.Log)
local Remotes = require(Shared.Remotes)
local Theme = require(Shared.Theme)
local Types = require(Shared.Types)

local Client = script.Parent
local Effects = require(Client.Effects)
local SoundController = require(Client.SoundController)
local Layers = require(Client.UI.Layers)
local Responsive = require(Client.UI.Responsive)
local Modal = require(Client.UI.Components.Modal)
local Toast = require(Client.UI.Components.Toast)
local Tooltip = require(Client.UI.Components.Tooltip)
local CodesScreen = require(Client.Screens.CodesScreen)
local GemsScreen = require(Client.Screens.GemsScreen)
local Hud = require(Client.Screens.Hud)
local QuestsScreen = require(Client.Screens.QuestsScreen)
local RebirthScreen = require(Client.Screens.RebirthScreen)
local SettingsScreen = require(Client.Screens.SettingsScreen)
local ShopScreen = require(Client.Screens.ShopScreen)

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- ==========================================================================
-- Geruest
-- ==========================================================================

local gui = Instance.new("ScreenGui")
gui.Name = "TycoonUI"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = false
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.DisplayOrder = Layers.base("tooltip")
gui.Parent = playerGui

local root = Instance.new("Frame")
root.Name = "Root"
root.Size = UDim2.fromScale(1, 1)
root.BackgroundTransparency = Theme.Alpha.hidden
root.ZIndex = Layers.base("world")
root.Parent = gui

SoundController.init()
Modal.build(root)
Tooltip.build(root)
Effects.build(root)
Toast.build(root, Theme.Safe.top)

local hud = Hud.create(gui, root)
local shop = ShopScreen.create(gui, root)
local rebirth = RebirthScreen.create(gui, root)
local quests = QuestsScreen.create(gui, root)
local codes = CodesScreen.create(gui, root)
local gems = GemsScreen.create(gui, root)
local settings = SettingsScreen.create(gui, root)

-- ==========================================================================
-- Panel-Verwaltung
-- ==========================================================================

type Screen = {
	toggle: () -> (),
	close: () -> (),
	isOpen: () -> boolean,
	update: (state: Types.ClientState) -> (),
}

local screens: { [string]: Screen } = {
	shop = shop,
	rebirth = rebirth,
	quest = quests,
	code = codes,
	upgrade = gems,
	settings = settings,
}

-- Immer nur ein Panel offen: zwei uebereinander sind auf dem Handy nicht
-- mehr bedienbar, und der Backdrop-Zaehler bliebe unuebersichtlich.
local function closeAllExcept(keep: string?)
	for key, screen in pairs(screens) do
		if key ~= keep and screen.isOpen() then
			screen.close()
		end
		hud.setActive(key :: Hud.ButtonKey, key == keep and screen.isOpen())
	end
end

Hud.onButton = function(key: Hud.ButtonKey)
	SoundController.play("click")
	local screen: Screen? = screens[key]
	if screen == nil then
		return
	end
	local willOpen = not screen.isOpen()
	closeAllExcept(if willOpen then key else nil)
	screen.toggle()
	hud.setActive(key, screen.isOpen())
end

Modal.onBackdropClicked = function()
	closeAllExcept(nil)
end

-- ==========================================================================
-- Ausrichtung
-- ==========================================================================

Responsive.attach(gui, root, function(viewport: Responsive.Viewport)
	hud.layout(viewport)
	Toast.setInset(viewport.topInset)
end)

-- ==========================================================================
-- Nachrichten vom Server
-- ==========================================================================

-- Merkt sich den zuletzt abgeschickten Kauf. Der Server antwortet mit
-- einer Notify-Nachricht ohne Id; damit der richtige Slot pulsiert oder
-- ruettelt, wird die Id hier zwischengespeichert.
local lastPurchaseId: string? = nil
local lastCash: number? = nil

ShopScreen.onRequest = function(upgradeId: string)
	lastPurchaseId = upgradeId
end

Remotes.event("StateChanged").OnClientEvent:Connect(function(raw: any)
	-- Der Server ist die einzige Quelle; die Typpruefung faengt nur ein
	-- kaputtes Nachrichtenformat ab, damit daraus kein UI-Fehler wird.
	if typeof(raw) ~= "table" then
		return
	end
	local state = raw :: Types.ClientState
	-- Sammel-Ton am steigenden Guthaben statt an einem Remote pro Erz.
	if lastCash ~= nil and state.cash > lastCash then
		SoundController.play("collect")
	end
	lastCash = state.cash
	hud.update(state)
	for _, screen in pairs(screens) do
		screen.update(state)
	end
end)

Remotes.event("Notify").OnClientEvent:Connect(function(text: any, kind: any)
	if typeof(text) ~= "string" then
		return
	end
	local toastKind: Toast.Kind = if kind == "success" then "success"
		elseif kind == "error" then "error"
		else "info"
	Toast.show(text, toastKind)

	if toastKind == "error" then
		SoundController.play("error")
		-- Zahl blinkt rot statt eines zweiten Popups.
		hud.flashCash()
		if lastPurchaseId ~= nil then
			shop.onPurchaseResult(lastPurchaseId, false)
		end
	elseif toastKind == "success" and lastPurchaseId ~= nil then
		shop.onPurchaseResult(lastPurchaseId, true)
	end
	lastPurchaseId = nil
end)

Remotes.event("PlaySfx").OnClientEvent:Connect(function(key: any)
	if typeof(key) ~= "string" then
		return
	end
	SoundController.play(key)
	if key == "rebirth" then
		Effects.rebirthFlash()
	end
end)

-- ==========================================================================
-- Aufraeumen
-- ==========================================================================

--[[
	Wird beim Verlassen des Spiels aufgerufen. Wichtig fuer den Leak-Test:
	jede Komponente raeumt ihre Tweens und Verbindungen selbst auf, dieser
	Aufruf stoesst die Kette nur an.
]]
local function teardown()
	for _, screen in pairs(screens) do
		screen.close()
	end
	hud.destroy()
	shop.destroy()
	rebirth.destroy()
	quests.destroy()
	codes.destroy()
	gems.destroy()
	settings.destroy()
	Toast.destroy()
	Tooltip.destroy()
	Modal.destroy()
	Effects.destroy()
	gui:Destroy()
end

player.AncestryChanged:Connect(function()
	if player.Parent == nil then
		teardown()
	end
end)

Log.info("Client", "Oberflaeche bereit")
