--!strict
--[[
	WorldService – Lobby, Beleuchtung, Ambiente und die Bestenlisten-Tafel.

	Die Welt wird per Code gebaut statt im Place gespeichert. Grund:
	die Geometrie ist vollstaendig aus Config ableitbar, und eine im XML
	eingefrorene Lobby waere bei jeder Layoutaenderung ein Merge-Konflikt.
	Ausserdem bleibt das Place-File dadurch klein und uebersichtlich.
]]

local Lighting = game:GetService("Lighting")
local SoundService = game:GetService("SoundService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Log = require(Shared.Log)

local C = Config.COLORS

local WorldService = {}
WorldService.name = "WorldService"

local leaderboardLabel: TextLabel? = nil

local function part(name: string, size: Vector3, cf: CFrame, color: Color3,
	material: Enum.Material, parent: Instance): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent
	return p
end

-- ==========================================================================
-- Beleuchtung
-- ==========================================================================

local function setupLighting()
	-- Technology wird bereits im Place auf Future gesetzt; hier nur die
	-- Feinabstimmung, damit Neon-Teile und Hallenlicht wirken.
	Lighting.Ambient = Color3.fromRGB(58, 60, 70)
	Lighting.OutdoorAmbient = Color3.fromRGB(108, 112, 128)
	Lighting.Brightness = 2
	Lighting.ClockTime = 15
	Lighting.GeographicLatitude = 20
	Lighting.ExposureCompensation = 0.15
	Lighting.EnvironmentDiffuseScale = 0.6
	Lighting.EnvironmentSpecularScale = 0.5
	Lighting.GlobalShadows = true
	Lighting.FogEnd = 3500

	if Lighting:FindFirstChildOfClass("Atmosphere") == nil then
		local atmosphere = Instance.new("Atmosphere")
		atmosphere.Density = 0.3
		atmosphere.Offset = 0.1
		atmosphere.Haze = 1.4
		atmosphere.Glare = 0.15
		atmosphere.Color = Color3.fromRGB(199, 199, 199)
		atmosphere.Decay = Color3.fromRGB(106, 112, 125)
		atmosphere.Parent = Lighting
	end

	if Lighting:FindFirstChildOfClass("ColorCorrectionEffect") == nil then
		local cc = Instance.new("ColorCorrectionEffect")
		cc.Brightness = 0.02
		cc.Contrast = 0.12
		cc.Saturation = 0.1
		cc.TintColor = Color3.fromRGB(255, 250, 244)
		cc.Parent = Lighting
	end

	if Lighting:FindFirstChildOfClass("BloomEffect") == nil then
		local bloom = Instance.new("BloomEffect")
		bloom.Intensity = 0.45
		bloom.Size = 20
		bloom.Threshold = 1.1
		bloom.Parent = Lighting
	end
end

-- ==========================================================================
-- Ambiente-Sound
-- ==========================================================================

local function setupAmbience()
	local id = Config.SOUNDS.AMBIENCE
	if id == "" then
		-- Bewusst still: es werden keine Asset-Ids erfunden. Sobald in
		-- Config eine echte Id steht, laeuft der Loop automatisch.
		Log.info("World", "Keine Ambience-Id gesetzt - Hintergrundton bleibt aus.")
		return
	end
	local sound = Instance.new("Sound")
	sound.Name = "Ambience"
	sound.SoundId = id
	sound.Looped = true
	sound.Volume = 0.25
	sound.Parent = SoundService
	sound:Play()
end

-- ==========================================================================
-- Lobby
-- ==========================================================================

local function buildLobby(parent: Folder)
	local world = Config.WORLD
	local center = world.LOBBY_CENTER

	part("LobbyFloor", world.LOBBY_SIZE,
		CFrame.new(center), C.PANEL_LIGHT, Enum.Material.Concrete, parent)

	-- Grosse Grundflaeche, damit man zwischen Lobby und Plots laufen kann.
	part("Ground", Vector3.new(1600, 8, 1200),
		CFrame.new(0, -4, 0), Color3.fromRGB(74, 84, 66), Enum.Material.Slate, parent)

	local spawnPad = Instance.new("SpawnLocation")
	spawnPad.Name = "LobbySpawn"
	spawnPad.Size = Vector3.new(18, 1, 18)
	spawnPad.CFrame = CFrame.new(center + Vector3.new(0, 1.5, 0))
	spawnPad.Color = C.ACCENT
	spawnPad.Material = Enum.Material.Neon
	spawnPad.Anchored = true
	spawnPad.Duration = 0
	spawnPad.Parent = parent

	-- Titel-Schild
	local pylon = part("TitlePylon", Vector3.new(2, 14, 2),
		CFrame.new(center + Vector3.new(0, 8, -38)), C.DARK_STEEL, Enum.Material.Metal, parent)

	local billboard = Instance.new("BillboardGui")
	billboard.Size = UDim2.fromScale(40, 11)
	billboard.StudsOffsetWorldSpace = Vector3.new(0, 10, 0)
	billboard.MaxDistance = 600
	billboard.Parent = pylon

	local frame = Instance.new("Frame")
	frame.Size = UDim2.fromScale(1, 1)
	frame.BackgroundColor3 = C.PANEL
	frame.BackgroundTransparency = 0.1
	frame.BorderSizePixel = 0
	frame.Parent = billboard

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 16)
	corner.Parent = frame

	local stroke = Instance.new("UIStroke")
	stroke.Color = C.ACCENT
	stroke.Thickness = 4
	stroke.Parent = frame

	local title = Instance.new("TextLabel")
	title.Size = UDim2.fromScale(0.94, 0.52)
	title.Position = UDim2.fromScale(0.03, 0.05)
	title.BackgroundTransparency = 1
	title.Text = string.upper(Config.GAME_NAME)
	title.TextColor3 = C.ACCENT
	title.Font = Enum.Font.GothamBlack
	title.TextScaled = true
	title.Parent = frame

	local subtitle = Instance.new("TextLabel")
	subtitle.Size = UDim2.fromScale(0.94, 0.34)
	subtitle.Position = UDim2.fromScale(0.03, 0.6)
	subtitle.BackgroundTransparency = 1
	subtitle.Text = "Deine Fabrik wartet - lauf einfach los!"
	subtitle.TextColor3 = C.TEXT
	subtitle.Font = Enum.Font.GothamMedium
	subtitle.TextScaled = true
	subtitle.Parent = frame
end

-- ==========================================================================
-- Bestenlisten-Tafel
-- ==========================================================================

local function buildLeaderboard(parent: Folder)
	local center = Config.WORLD.LOBBY_CENTER
	local board = part("LeaderboardBoard", Vector3.new(1, 42, 30),
		CFrame.new(center + Vector3.new(-56, 21, 0)), C.PANEL,
		Enum.Material.SmoothPlastic, parent)

	local surface = Instance.new("SurfaceGui")
	surface.Name = "Board"
	surface.Face = Enum.NormalId.Right
	surface.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	surface.PixelsPerStud = 28
	surface.LightInfluence = 0
	surface.MaxDistance = 260
	surface.Parent = board

	local background = Instance.new("Frame")
	background.Size = UDim2.fromScale(1, 1)
	background.BackgroundColor3 = C.PANEL
	background.BorderSizePixel = 0
	background.Parent = surface

	local heading = Instance.new("TextLabel")
	heading.Size = UDim2.new(1, -20, 0, 70)
	heading.Position = UDim2.fromOffset(10, 8)
	heading.BackgroundTransparency = 1
	heading.Text = "TOP " .. Config.LEADERBOARD.TOP_N .. " - GESAMTVERDIENST"
	heading.TextColor3 = C.ACCENT
	heading.Font = Enum.Font.GothamBlack
	heading.TextScaled = true
	heading.Parent = background

	local rows = Instance.new("TextLabel")
	rows.Name = "Rows"
	rows.Size = UDim2.new(1, -24, 1, -92)
	rows.Position = UDim2.fromOffset(12, 84)
	rows.BackgroundTransparency = 1
	rows.Text = "Wird geladen ..."
	rows.TextColor3 = C.TEXT
	-- Monospace, damit Rang, Name und Betrag untereinander stehen.
	rows.Font = Enum.Font.Code
	rows.TextSize = 22
	rows.TextXAlignment = Enum.TextXAlignment.Left
	rows.TextYAlignment = Enum.TextYAlignment.Top
	rows.Parent = background

	leaderboardLabel = rows
end

-- Wird von LeaderboardService aufgerufen.
function WorldService.setLeaderboardRows(rows: { string })
	local label = leaderboardLabel
	if label == nil then
		return
	end
	label.Text = table.concat(rows, "\n")
end

-- ==========================================================================
-- Lifecycle
-- ==========================================================================

function WorldService.Init()
	setupLighting()

	local folder = Instance.new("Folder")
	folder.Name = "World"
	folder.Parent = workspace

	buildLobby(folder)
	buildLeaderboard(folder)
	Log.info("World", "Lobby und Beleuchtung aufgebaut")
end

function WorldService.Start()
	setupAmbience()
end

return WorldService
