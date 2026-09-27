--!strict
--[[
	Modal – abdunkelnder Hintergrund hinter geoeffneten Panels.

	Zum "Backdrop Blur": Roblox kann GUI-Ebenen NICHT weichzeichnen. Es
	gibt keinen Filter, der auf ScreenGui-Inhalte wirkt. Machbar ist nur:

	  1. dunkles Overlay ueber der Welt (Transparency 0.45) – das ist der
	     eigentliche Traeger der Trennung, und
	  2. ein BlurEffect in Lighting, der die 3D-WELT hinter der
	     Oberflaeche weichzeichnet. Das kommt dem Effekt sehr nahe, weil
	     hinter einem Panel ohnehin fast nur Welt liegt.
	  3. eine leichte ColorCorrection-Absenkung, damit die Welt zusaetzlich
	     zuruecktritt.

	Die Ebenen des Interfaces selbst bleiben scharf. Etwas anderes ist in
	Roblox nicht moeglich, und ich behaupte es auch nicht.

	Der Backdrop ist zaehlergesteuert: mehrere Panels koennen ihn
	anfordern, er verschwindet erst, wenn das letzte geschlossen ist.
]]

local Lighting = game:GetService("Lighting")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent.Parent
local Layers = require(UI.Layers)
local Motion = require(UI.Motion)

local Modal = {}

local backdrop: TextButton? = nil
local blur: BlurEffect? = nil
local correction: ColorCorrectionEffect? = nil
local scope = Motion.scope()
local openCount = 0

-- Wird gesetzt, damit ein Klick auf den Hintergrund das oberste Panel schliesst.
Modal.onBackdropClicked = function() end

local BLUR_MAX = Theme.Space.x16

function Modal.build(root: GuiObject)
	if backdrop ~= nil then
		return
	end
	-- TextButton statt Frame: faengt Klicks ab, damit man nicht durch das
	-- Overlay hindurch in die Welt klickt.
	local overlay = Instance.new("TextButton")
	overlay.Name = "Backdrop"
	overlay.Size = UDim2.fromScale(1, 1)
	overlay.BackgroundColor3 = Theme.Color.bg0
	overlay.BackgroundTransparency = Theme.Alpha.hidden
	overlay.BorderSizePixel = 0
	overlay.AutoButtonColor = false
	overlay.Text = ""
	overlay.Visible = false
	overlay.ZIndex = Layers.at("modal", Theme.Depth.behind)
	overlay.Parent = root
	scope:track(overlay.Activated:Connect(function()
		Modal.onBackdropClicked()
	end))
	backdrop = overlay

	local blurEffect = Instance.new("BlurEffect")
	blurEffect.Name = "ModalBlur"
	blurEffect.Size = 0
	blurEffect.Enabled = false
	blurEffect.Parent = Lighting
	blur = blurEffect

	local cc = Instance.new("ColorCorrectionEffect")
	cc.Name = "ModalDim"
	cc.Brightness = 0
	cc.Enabled = false
	cc.Parent = Lighting
	correction = cc
end

function Modal.push()
	openCount += 1
	if openCount > 1 then
		return
	end
	local overlay, blurEffect, cc = backdrop, blur, correction
	if overlay == nil then
		return
	end
	overlay.Visible = true
	overlay.BackgroundTransparency = Theme.Alpha.hidden
	scope:to(overlay, { BackgroundTransparency = Theme.Alpha.backdrop },
		Theme.Duration.base, "enter")
	if blurEffect ~= nil then
		blurEffect.Enabled = true
		blurEffect.Size = 0
		scope:to(blurEffect, { Size = BLUR_MAX }, Theme.Duration.base, "enter")
	end
	if cc ~= nil then
		cc.Enabled = true
		cc.Brightness = 0
		scope:to(cc, { Brightness = -Theme.Alpha.glass }, Theme.Duration.base, "enter")
	end
end

function Modal.pop()
	openCount = math.max(0, openCount - 1)
	if openCount > 0 then
		return
	end
	local overlay, blurEffect, cc = backdrop, blur, correction
	if overlay == nil then
		return
	end
	local tween = scope:to(overlay, { BackgroundTransparency = Theme.Alpha.hidden },
		Theme.Duration.base, "exit")
	tween.Completed:Once(function()
		if openCount == 0 and backdrop ~= nil then
			backdrop.Visible = false
		end
	end)
	if blurEffect ~= nil then
		local blurTween = scope:to(blurEffect, { Size = 0 }, Theme.Duration.base, "exit")
		blurTween.Completed:Once(function()
			if openCount == 0 and blur ~= nil then
				-- Deaktivieren statt nur auf 0: ein aktiver BlurEffect
				-- kostet auch bei Groesse 0 einen Renderdurchgang.
				blur.Enabled = false
			end
		end)
	end
	if cc ~= nil then
		local ccTween = scope:to(cc, { Brightness = 0 }, Theme.Duration.base, "exit")
		ccTween.Completed:Once(function()
			if openCount == 0 and correction ~= nil then
				correction.Enabled = false
			end
		end)
	end
end

function Modal.destroy()
	scope:destroy()
	openCount = 0
	if backdrop ~= nil then
		backdrop:Destroy()
		backdrop = nil
	end
	if blur ~= nil then
		blur:Destroy()
		blur = nil
	end
	if correction ~= nil then
		correction:Destroy()
		correction = nil
	end
end

return Modal
