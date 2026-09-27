--!strict
--[[
	Preview – echte 3D-Vorschau im ViewportFrame.

	Warum kein flaches Icon: ein Shop-Eintrag, der das Objekt zeigt, das
	man kauft, verkauft sich besser als ein Symbol. Ein ViewportFrame
	rendert ein Modell mit eigener Kamera, unabhaengig von der Weltkamera.

	Die Modelle werden HIER aus Parts gebaut, nicht aus Assets geladen -
	dadurch braucht die Vorschau keine hochgeladene Mesh-Id und passt
	farblich automatisch zum Theme.

	Beleuchtung im ViewportFrame: es gibt keine Lights darin. Steuerbar
	sind nur LightColor und Ambient des ViewportFrame selbst. Neon-Teile
	leuchten dort NICHT wie in der Welt - deshalb wird der Glanz ueber
	hell eingefaerbte Teile gemacht, nicht ueber Material.Neon.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local UI = script.Parent
local Motion = require(UI.Motion)

local Preview = {}

export type Kind = "dropper" | "upgrader" | "collector" | "rate" | "speed" | "cosmetic"

export type Handle = {
	instance: ViewportFrame,
	destroy: (() -> ()),
	setTint: (color: Color3) -> (),
}

local function block(parent: Instance, size: Vector3, offset: Vector3,
	color: Color3, material: Enum.Material): Part
	local part = Instance.new("Part")
	part.Size = size
	part.CFrame = CFrame.new(offset)
	part.Color = color
	part.Material = material
	part.Anchored = true
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Parent = parent
	return part
end

local function wedge(parent: Instance, size: Vector3, cframe: CFrame,
	color: Color3, material: Enum.Material): WedgePart
	local part = Instance.new("WedgePart")
	part.Size = size
	part.CFrame = cframe
	part.Color = color
	part.Material = material
	part.Anchored = true
	part.Parent = parent
	return part
end

--[[
	Ein kleines Modell je Upgrade-Art. Alle sind so gebaut, dass sie in
	einen Wuerfel von etwa 4 Studs passen - dann braucht die Kamera keine
	Fallunterscheidung.
]]
local function buildModel(kind: Kind, accent: Color3): Model
	local model = Instance.new("Model")
	local steel = Theme.Color.bg3
	local dark = Theme.Color.bg1

	if kind == "dropper" then
		block(model, Vector3.new(2.2, 1.8, 2.2), Vector3.new(0, 0.9, 0), steel, Theme.Material.metal)
		block(model, Vector3.new(1, 0.8, 1), Vector3.new(0, -0.2, 0), accent, Theme.Material.surface)
		block(model, Vector3.new(2.6, 0.3, 2.6), Vector3.new(0, 1.95, 0), dark, Theme.Material.brushed)
		-- Gefaste Oberkante statt Kloetzchen-Look
		wedge(model, Vector3.new(2.2, 0.5, 0.6),
			CFrame.new(0, 2.3, -0.8), accent, Theme.Material.surface)
	elseif kind == "upgrader" then
		block(model, Vector3.new(0.4, 2.6, 0.4), Vector3.new(-1.1, 1.3, 0), steel, Theme.Material.metal)
		block(model, Vector3.new(0.4, 2.6, 0.4), Vector3.new(1.1, 1.3, 0), steel, Theme.Material.metal)
		block(model, Vector3.new(2.6, 0.4, 0.4), Vector3.new(0, 2.6, 0), steel, Theme.Material.metal)
		local field = block(model, Vector3.new(1.9, 2.2, 0.15), Vector3.new(0, 1.3, 0),
			accent, Theme.Material.surface)
		field.Transparency = Theme.Alpha.veil
	elseif kind == "collector" then
		block(model, Vector3.new(2.6, 1.6, 2), Vector3.new(0, 0.8, 0), steel, Theme.Material.metal)
		block(model, Vector3.new(1.4, 0.35, 1.4), Vector3.new(0, 1.75, 0), accent, Theme.Material.surface)
		block(model, Vector3.new(0.35, 1.2, 0.35), Vector3.new(0, 2.3, 0), steel, Theme.Material.metal)
		block(model, Vector3.new(1.8, 0.25, 0.25), Vector3.new(0, 2.9, 0), accent, Theme.Material.surface)
	elseif kind == "rate" then
		block(model, Vector3.new(1.6, 1.6, 1.6), Vector3.new(0, 0.9, 0), steel, Theme.Material.metal)
		for index = 0, 2 do
			wedge(model, Vector3.new(0.3, 0.8, 0.8),
				CFrame.new(-0.9 + index * 0.9, 2.1, 0) * CFrame.Angles(0, 0, math.rad(90)),
				accent, Theme.Material.surface)
		end
	elseif kind == "speed" then
		block(model, Vector3.new(3.4, 0.3, 1.5), Vector3.new(0, 1, 0), dark, Theme.Material.brushed)
		block(model, Vector3.new(0.5, 0.5, 1.7), Vector3.new(-1.6, 1, 0), steel, Theme.Material.metal)
		block(model, Vector3.new(0.5, 0.5, 1.7), Vector3.new(1.6, 1, 0), steel, Theme.Material.metal)
		block(model, Vector3.new(0.6, 0.6, 0.6), Vector3.new(-0.4, 1.4, 0), accent, Theme.Material.surface)
		block(model, Vector3.new(0.6, 0.6, 0.6), Vector3.new(0.8, 1.4, 0), accent, Theme.Material.surface)
	else -- cosmetic
		block(model, Vector3.new(2.8, 0.3, 2.8), Vector3.new(0, 0.15, 0), dark, Theme.Material.concrete)
		block(model, Vector3.new(2.8, 1.8, 0.25), Vector3.new(0, 1.05, -1.3), steel, Theme.Material.metal)
		block(model, Vector3.new(0.25, 1.8, 2.6), Vector3.new(-1.3, 1.05, 0), steel, Theme.Material.metal)
		wedge(model, Vector3.new(2.8, 0.9, 2.8),
			CFrame.new(0, 2.4, 0), accent, Theme.Material.surface)
	end

	for _, child in ipairs(model:GetChildren()) do
		if child:IsA("BasePart") then
			model.PrimaryPart = child
			break
		end
	end
	return model
end

export type Props = {
	parent: Instance,
	kind: Kind,
	accent: Color3,
	size: UDim2,
	zIndex: number,
	spin: boolean?,
}

function Preview.create(props: Props): Handle
	local scope = Motion.scope()

	local viewport = Instance.new("ViewportFrame")
	viewport.Name = "Preview"
	viewport.Size = props.size
	viewport.BackgroundColor3 = Theme.Color.bg0
	viewport.BackgroundTransparency = Theme.Alpha.opaque
	viewport.BorderSizePixel = 0
	viewport.ZIndex = props.zIndex
	-- Ambient und LightColor sind die einzigen Lichtregler eines
	-- ViewportFrame; echte Light-Instanzen wirken darin nicht.
	viewport.Ambient = Theme.Color.bg3
	viewport.LightColor = Theme.Color.textHigh
	viewport.LightDirection = Vector3.new(-1, -1.4, -0.8)
	viewport.Parent = props.parent
	Theme.corner(viewport, Theme.Radius.control)

	local world = Instance.new("WorldModel")
	world.Parent = viewport

	local model = buildModel(props.kind, props.accent)
	model.Parent = world

	local camera = Instance.new("Camera")
	camera.FieldOfView = Theme.Size.iconButton
	camera.CFrame = CFrame.lookAt(Vector3.new(4.2, 4.0, 4.2), Vector3.new(0, 1.2, 0))
	camera.Parent = viewport
	viewport.CurrentCamera = camera

	-- Langsame Drehung. Bei reduzierter Bewegung steht das Modell still.
	local spinConnection: RBXScriptConnection? = nil
	if props.spin ~= false and not Theme.reduceMotion then
		local angle = 0
		spinConnection = scope:track(
			game:GetService("RunService").RenderStepped:Connect(function(delta: number)
				angle += delta * Theme.Duration.fast
				model:PivotTo(CFrame.Angles(0, angle, 0))
			end)
		)
	end

	return {
		instance = viewport,
		setTint = function(color: Color3)
			for _, part in ipairs(model:GetDescendants()) do
				if part:IsA("BasePart") and part.Color == props.accent then
					part.Color = color
				end
			end
		end,
		destroy = function()
			if spinConnection ~= nil then
				spinConnection:Disconnect()
			end
			scope:destroy()
			viewport:Destroy()
		end,
	}
end

return Preview
