--!strict
--[[
	Bootstrap (Client) – Einstiegspunkt der Oberflaeche.

	Aufgaben, bewusst klein gehalten:
	  1. ScreenGui und Wurzelcontainer anlegen (ein einziger, damit die
	     Responsive-Skalierung an EINER UIScale haengt).
	  2. Controller bauen.
	  3. Eingehende Remotes auf die Controller verteilen.

	Der Client haelt bewusst KEINEN eigenen Spielzustand, den er selbst
	fortschreibt. Er zeigt nur den letzten Schnappschuss vom Server an.
	Alles andere waere eine zweite Wahrheit, die irgendwann von der
	Serverwahrheit abweicht - und genau daraus entstehen die Bugs, bei
	denen die UI 1.000 $ zeigt und der Kauf trotzdem abgelehnt wird.
]]

local Players = game:GetService("Players")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Log = require(Shared.Log)
local Remotes = require(Shared.Remotes)
local Types = require(Shared.Types)

local Client = script.Parent
local HudController = require(Client.HudController)
local NotifyController = require(Client.NotifyController)
local PanelController = require(Client.PanelController)
local ShopController = require(Client.ShopController)
local SoundController = require(Client.SoundController)
local UIKit = require(Client.UIKit)

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- ==========================================================================
-- Gerüst
-- ==========================================================================

local gui = Instance.new("ScreenGui")
gui.Name = "TycoonUI"
gui.ResetOnSpawn = false          -- UI ueberlebt den Tod des Charakters
gui.IgnoreGuiInset = true
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.Parent = playerGui

-- Bildschirmfuellender, BEWUSST UNSKALIERTER Container. Die Skalierung
-- sitzt weiter unten an den einzelnen Widget-Gruppen (siehe UIKit.attachScale).
local root = UIKit.frame({
	name = "Root", parent = gui,
	size = UDim2.fromScale(1, 1), transparency = 1,
})

SoundController.init()
NotifyController.build(gui, root)
HudController.build(gui, root)
ShopController.build(gui, root)
PanelController.build(gui, root)

HudController.onButton = function(key: string)
	if key == "shop" then
		PanelController.closeAll()
		ShopController.toggle()
	else
		PanelController.toggle(key)
	end
end

-- ==========================================================================
-- Eingehende Nachrichten
-- ==========================================================================

Remotes.event("StateChanged").OnClientEvent:Connect(function(raw: any)
	-- Der Server ist die einzige Quelle; trotzdem eine Typpruefung, damit
	-- ein Nachrichtenformat-Fehler nicht als kryptischer UI-Fehler endet.
	if typeof(raw) ~= "table" then
		return
	end
	local state = raw :: Types.ClientState
	HudController.update(state)
	ShopController.update(state)
	PanelController.update(state)
end)

Remotes.event("Notify").OnClientEvent:Connect(function(text: any, kind: any)
	if typeof(text) ~= "string" then
		return
	end
	NotifyController.show(text, if typeof(kind) == "string" then kind else "info")
	if kind == "error" then
		SoundController.play("error")
	end
end)

Remotes.event("PlaySfx").OnClientEvent:Connect(function(key: any)
	if typeof(key) == "string" then
		SoundController.play(key)
	end
end)

Log.info("Client", "Oberflaeche bereit")
