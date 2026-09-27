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
local Theme = require(Shared.Theme)

local C = Theme.Color
local M = Theme.Material

local WorldService = {}
WorldService.name = "WorldService"


local function part(name: string, size: Vector3, cf: CFrame, color: Color3,
	material: Enum.Material, parent: Instance): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material
	p.Reflectance = Theme.Reflectance.none
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.CastShadow = false
	p.Parent = parent
	return p
end

-- ==========================================================================
-- Beleuchtung
-- ==========================================================================

local function setupLighting()
	--[[
		Zurueckhaltend dosiert: das Bild soll lesbar bleiben und nicht wie
		ein Instagram-Filter wirken. Die Zahlen sind aufeinander abgestimmt -
		ein hoeherer Bloom braucht eine hoehere Threshold, sonst glueht auch
		die Textur; eine hoehere Saturation macht das Indigo der Oberflaeche
		giftig.
	]]
	Lighting.Ambient = C.bg1
	Lighting.OutdoorAmbient = C.bg3
	Lighting.Brightness = 2
	Lighting.ClockTime = 15.5          -- weiches Seitenlicht statt Mittagssonne
	Lighting.GeographicLatitude = 22
	Lighting.ExposureCompensation = 0.2
	Lighting.EnvironmentDiffuseScale = 0.55
	Lighting.EnvironmentSpecularScale = 0.5
	Lighting.GlobalShadows = true
	Lighting.FogEnd = 3500

	if Lighting:FindFirstChildOfClass("Atmosphere") == nil then
		local atmosphere = Instance.new("Atmosphere")
		atmosphere.Density = 0.3
		atmosphere.Offset = 0.1
		atmosphere.Haze = 1.2
		atmosphere.Glare = 0.12
		atmosphere.Color = C.textMid
		atmosphere.Decay = C.bg3
		atmosphere.Parent = Lighting
	end

	if Lighting:FindFirstChildOfClass("ColorCorrectionEffect") == nil then
		local cc = Instance.new("ColorCorrectionEffect")
		cc.Name = "WorldGrade"
		cc.Brightness = 0.01
		cc.Contrast = 0.05
		cc.Saturation = 0.08
		cc.TintColor = C.textHigh
		cc.Parent = Lighting
	end

	if Lighting:FindFirstChildOfClass("BloomEffect") == nil then
		local bloom = Instance.new("BloomEffect")
		bloom.Intensity = 0.4
		bloom.Size = 20
		bloom.Threshold = 1.1
		bloom.Parent = Lighting
	end

	if Lighting:FindFirstChildOfClass("SunRaysEffect") == nil then
		local rays = Instance.new("SunRaysEffect")
		-- Sehr subtil: hoehere Werte legen einen Schleier ueber die Plots.
		rays.Intensity = 0.05
		rays.Spread = 0.6
		rays.Parent = Lighting
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
		CFrame.new(center), C.bg2, M.concrete, parent)

	-- Grosse Grundflaeche, damit man zwischen Lobby und Plots laufen kann.
	part("Ground", Vector3.new(1600, 8, 1200),
		CFrame.new(0, -4, 0), C.bg1, M.rock, parent)

	local spawnPad = Instance.new("SpawnLocation")
	spawnPad.Name = "LobbySpawn"
	spawnPad.Size = Vector3.new(18, 1, 18)
	spawnPad.CFrame = CFrame.new(center + Vector3.new(0, 1.5, 0))
	spawnPad.Color = C.premium
	spawnPad.Material = M.neon
	spawnPad.Anchored = true
	spawnPad.Duration = 0
	spawnPad.Parent = parent

	-- Titel-Schild ueber dem Spawn
	local pylon = part("TitlePylon", Vector3.new(2, 14, 2),
		CFrame.new(center + Vector3.new(0, 8, -38)), C.bg2, M.metal, parent)

	local billboard = Instance.new("BillboardGui")
	billboard.Size = UDim2.fromScale(40, 11)
	billboard.StudsOffsetWorldSpace = Vector3.new(0, 10, 0)
	billboard.MaxDistance = Theme.Size.worldSignOffset * 100
	billboard.LightInfluence = 0
	billboard.Parent = pylon

	local titleCard = Theme.Card({
		name = "Card", parent = billboard, size = UDim2.fromScale(1, 1),
		fill = C.bg1, radius = Theme.Radius.panel, strokeColor = C.premium,
		zIndex = Theme.Layer.world, shadow = false,
	})
	Theme.padding(titleCard, { all = Theme.Space.x12 })
	Theme.label({
		name = "Title", parent = titleCard, text = string.upper(Config.GAME_NAME),
		role = "display", size = Theme.TextSize.display, color = C.premium,
		layoutSize = UDim2.fromScale(1, 0.56),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = Theme.Layer.world + Theme.Depth.content,
	})
	Theme.label({
		name = "Sub", parent = titleCard,
		text = "Deine Fabrik wartet - lauf einfach los", role = "body",
		size = Theme.TextSize.lg, color = C.textMid,
		layoutSize = UDim2.fromScale(1, 0.36),
		position = UDim2.fromScale(0, 0.6),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = Theme.Layer.world + Theme.Depth.content, stroke = false,
	})
end

-- ==========================================================================
-- Bestenlisten-Tafel
-- ==========================================================================

export type Entry = { rank: number, userId: number, name: string, amount: string }

type RowRefs = {
	frame: Frame,
	medal: Frame,
	rankLabel: TextLabel,
	avatar: ImageLabel,
	nameLabel: TextLabel,
	amountLabel: TextLabel,
}

local rows: { RowRefs } = {}

-- Rang 1 bis 3 bekommen Medaillenfarben, alle aus der Warm-Familie.
local function medalColor(rank: number): Color3
	if rank == 1 then
		return C.premium
	elseif rank == 2 then
		return C.textMid
	elseif rank == 3 then
		return C.premiumDeep
	end
	return C.bg3
end

local function buildLeaderboard(parent: Folder)
	local center = Config.WORLD.LOBBY_CENTER
	local board = part("LeaderboardBoard", Vector3.new(1, 42, 30),
		CFrame.new(center + Vector3.new(-56, 21, 0)), C.bg0, M.surface, parent)

	local surface = Instance.new("SurfaceGui")
	surface.Name = "Board"
	surface.Face = Enum.NormalId.Right
	surface.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	surface.PixelsPerStud = 28
	surface.LightInfluence = 0
	surface.MaxDistance = Theme.Size.worldSignOffset * 44
	surface.Parent = board

	local background = Theme.Card({
		name = "Bg", parent = surface, size = UDim2.fromScale(1, 1),
		fill = C.bg1, radius = Theme.Radius.panel, strokeColor = C.premiumDeep,
		zIndex = Theme.Layer.world, shadow = false,
	})
	Theme.padding(background, { all = Theme.Space.x16 })

	Theme.label({
		name = "Heading", parent = background,
		text = "TOP " .. tostring(Config.LEADERBOARD.TOP_N), role = "display",
		size = Theme.TextSize.xxl, color = C.premium,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x48),
		zIndex = Theme.Layer.world + Theme.Depth.content,
	})
	Theme.label({
		name = "Sub", parent = background, text = "Gesamtverdienst", role = "body",
		size = Theme.TextSize.md, color = C.textLow,
		layoutSize = UDim2.new(1, 0, 0, Theme.Space.x24),
		position = UDim2.fromOffset(0, Theme.Space.x48),
		zIndex = Theme.Layer.world + Theme.Depth.content, stroke = false,
	})

	local list = Instance.new("ScrollingFrame")
	list.Name = "Rows"
	list.Size = UDim2.new(1, 0, 1, -(Theme.Space.x48 + Theme.Space.x32))
	list.Position = UDim2.fromOffset(0, Theme.Space.x48 + Theme.Space.x24)
	list.BackgroundTransparency = Theme.Alpha.hidden
	list.BorderSizePixel = 0
	list.ScrollBarThickness = Theme.Size.scrollBar
	list.ScrollBarImageColor3 = C.premiumDeep
	list.CanvasSize = UDim2.new()
	list.AutomaticCanvasSize = Enum.AutomaticSize.Y
	list.ZIndex = Theme.Layer.world + Theme.Depth.content
	list.Parent = background
	Theme.list({ parent = list, gap = Theme.Space.x4 })

	for rank = 1, Config.LEADERBOARD.TOP_N do
		-- Abwechselnd getoente Zeilen: ohne das verschwimmt eine
		-- 50-Zeilen-Liste zu einer Flaeche.
		local tinted = rank % 2 == 1
		local row = Instance.new("Frame")
		row.Name = "Row" .. rank
		row.Size = UDim2.new(1, -Theme.Space.x8, 0, Theme.Size.rowHeight)
		row.BackgroundColor3 = if tinted then C.bg2 else C.bg1
		row.BackgroundTransparency = if tinted then Theme.Alpha.opaque else Theme.Alpha.glass
		row.BorderSizePixel = 0
		row.LayoutOrder = rank
		row.Visible = false
		row.ZIndex = Theme.Layer.world + Theme.Depth.content
		row.Parent = list
		Theme.corner(row, Theme.Radius.control)
		Theme.padding(row, { left = Theme.Space.x8, right = Theme.Space.x12 })

		local medal = Instance.new("Frame")
		medal.Name = "Medal"
		medal.Size = UDim2.fromOffset(Theme.Space.x32, Theme.Space.x32)
		medal.Position = UDim2.fromScale(0, 0.5)
		medal.AnchorPoint = Vector2.new(0, 0.5)
		medal.BackgroundColor3 = medalColor(rank)
		medal.BorderSizePixel = 0
		medal.ZIndex = Theme.Layer.world + Theme.Depth.raised
		medal.Parent = row
		Theme.corner(medal, Theme.Radius.pill)

		local rankLabel = Theme.label({
			name = "Rank", parent = medal, text = tostring(rank), role = "numeric",
			size = Theme.TextSize.sm,
			color = if rank <= 3 then C.bg0 else C.textMid,
			layoutSize = UDim2.fromScale(1, 1),
			xAlign = Enum.TextXAlignment.Center,
			zIndex = Theme.Layer.world + Theme.Depth.overlay, stroke = false,
		})

		local avatar = Instance.new("ImageLabel")
		avatar.Name = "Avatar"
		avatar.Size = UDim2.fromOffset(Theme.Space.x32, Theme.Space.x32)
		avatar.Position = UDim2.new(0, Theme.Space.x48, 0.5, 0)
		avatar.AnchorPoint = Vector2.new(0, 0.5)
		avatar.BackgroundColor3 = C.bg3
		avatar.BorderSizePixel = 0
		avatar.ZIndex = Theme.Layer.world + Theme.Depth.raised
		avatar.Parent = row
		Theme.corner(avatar, Theme.Radius.pill)

		local nameLabel = Theme.label({
			name = "Name", parent = row, text = "", role = "heading",
			size = Theme.TextSize.md, color = C.textHigh,
			layoutSize = UDim2.new(1, -(Theme.Space.x48 * 3), 1, 0),
			position = UDim2.fromOffset(Theme.Space.x48 + Theme.Space.x48, 0),
			zIndex = Theme.Layer.world + Theme.Depth.raised,
		})
		local amountLabel = Theme.label({
			name = "Amount", parent = row, text = "", role = "numeric",
			size = Theme.TextSize.md, color = C.success,
			layoutSize = UDim2.new(0, Theme.Size.pillWidth * 0.7, 1, 0),
			position = UDim2.new(1, 0, 0, 0),
			anchor = Vector2.new(1, 0),
			xAlign = Enum.TextXAlignment.Right,
			zIndex = Theme.Layer.world + Theme.Depth.raised,
		})

		rows[rank] = {
			frame = row, medal = medal, rankLabel = rankLabel,
			avatar = avatar, nameLabel = nameLabel, amountLabel = amountLabel,
		}
	end

	local emptyLabel = Theme.label({
		name = "Empty", parent = background,
		text = "Noch keine Eintraege - sei der Erste", role = "body",
		size = Theme.TextSize.lg, color = C.textLow,
		layoutSize = UDim2.fromScale(1, 0.4),
		position = UDim2.fromScale(0, 0.4),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = Theme.Layer.world + Theme.Depth.overlay, stroke = false,
	})
	emptyLabel.Name = "Empty"
end

-- Wird von LeaderboardService aufgerufen.
function WorldService.setLeaderboardRows(entries: { Entry })
	for rank, row in ipairs(rows) do
		local entry: Entry? = entries[rank]
		if entry == nil then
			row.frame.Visible = false
			continue
		end
		row.frame.Visible = true
		row.nameLabel.Text = entry.name
		row.amountLabel.Text = entry.amount .. " $"
		row.rankLabel.Text = tostring(entry.rank)
	end
end

-- Avatarbild nachtragen. Getrennt von setLeaderboardRows, weil die
-- Thumbnail-Abfrage yieldet und die Tafel nicht darauf warten soll.
function WorldService.setLeaderboardAvatar(rank: number, image: string)
	local row = rows[rank]
	if row ~= nil then
		row.avatar.Image = image
	end
end

function WorldService.setLeaderboardEmpty(empty: boolean)
	for _, row in ipairs(rows) do
		if empty then
			row.frame.Visible = false
		end
	end
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
