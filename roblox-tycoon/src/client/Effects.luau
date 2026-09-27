--!strict
--[[
	Effects – clientseitige Inszenierung fuer grosse Momente.

	Rebirth: kurzer Vollbild-Blitz, dann Kamera-Shake.

	Zum Shake: die Kamera wird NICHT direkt gesetzt, sondern ueber
	`CameraOffset` des Humanoids versetzt. Ein direkt gesetztes
	Camera.CFrame wird vom Standard-Kameraskript im naechsten Frame wieder
	ueberschrieben - der Shake waere unsichtbar oder wuerde flackern.
	CameraOffset addiert der Standard-Kamera einen Versatz und ueberlebt
	deren Update. Das ist der sauberste Weg ohne eigenes Kameraskript.
]]

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local Client = script.Parent
local Layers = require(Client.UI.Layers)
local Motion = require(Client.UI.Motion)

local Effects = {}

local flash: Frame? = nil
local scope = Motion.scope()
local shaking = false

local SHAKE_SECONDS = 0.4

function Effects.build(root: GuiObject)
	if flash ~= nil then
		return
	end
	local overlay = Instance.new("Frame")
	overlay.Name = "Flash"
	overlay.Size = UDim2.fromScale(1, 1)
	overlay.BackgroundColor3 = Theme.Color.textHigh
	overlay.BackgroundTransparency = Theme.Alpha.hidden
	overlay.BorderSizePixel = 0
	overlay.Visible = false
	-- Ueber allem ausser dem Tooltip: der Blitz soll die ganze
	-- Oberflaeche ueberstrahlen, aber nichts blockieren.
	overlay.ZIndex = Layers.at("tooltip", Theme.Depth.behind)
	overlay.Active = false
	overlay.Parent = root
	flash = overlay
end

local function humanoid(): Humanoid?
	local character = Players.LocalPlayer.Character
	if character == nil then
		return nil
	end
	local found = character:FindFirstChildOfClass("Humanoid")
	return found
end

--[[
	Kamera-Shake ueber Humanoid.CameraOffset.
	Die Amplitude faellt linear ab, damit der Effekt ausklingt statt
	abrupt zu enden. Am Ende wird der Versatz exakt auf null gesetzt -
	ein Restversatz bliebe sonst dauerhaft stehen.
]]
function Effects.shakeCamera(seconds: number?)
	if Theme.reduceMotion or shaking then
		return
	end
	local target = humanoid()
	if target == nil then
		return
	end
	shaking = true
	local duration = seconds or SHAKE_SECONDS
	task.spawn(function()
		local elapsed = 0
		local amplitude = Theme.Space.x4 / Theme.Space.x8
		local connection: RBXScriptConnection
		connection = RunService.RenderStepped:Connect(function(delta: number)
			elapsed += delta
			local living = humanoid()
			if living == nil or elapsed >= duration then
				connection:Disconnect()
				if living ~= nil then
					living.CameraOffset = Vector3.zero
				end
				shaking = false
				return
			end
			local decay = 1 - elapsed / duration
			local strength = amplitude * decay
			living.CameraOffset = Vector3.new(
				(math.random() - 0.5) * strength * 2,
				(math.random() - 0.5) * strength * 2,
				0
			)
		end)
	end)
end

function Effects.rebirthFlash()
	local overlay = flash
	if overlay == nil then
		return
	end
	if Theme.reduceMotion then
		Effects.shakeCamera()
		return
	end
	overlay.Visible = true
	overlay.BackgroundTransparency = Theme.Alpha.veil
	local fade = scope:to(overlay, { BackgroundTransparency = Theme.Alpha.hidden },
		Theme.Duration.slow, "exit")
	fade.Completed:Once(function()
		overlay.Visible = false
	end)
	Effects.shakeCamera()
end

function Effects.destroy()
	scope:destroy()
	if flash ~= nil then
		flash:Destroy()
		flash = nil
	end
	local target = humanoid()
	if target ~= nil then
		target.CameraOffset = Vector3.zero
	end
end

return Effects
