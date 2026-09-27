--!strict
--[[
	PlotBuilder – Geometrie EINES Tycoon-Plots.

	Kennt keine Spieler, kein Geld und keine Kaufregeln; liefert nur
	benannte Referenzen. Farben, Materialien und Reflectance kommen
	vollstaendig aus Theme – im Weltbau steht genauso wenig ein
	Farbliteral wie in der Oberflaeche.

	Bauregeln, die den "Anfaenger-Baukasten"-Eindruck vermeiden:

	  * Gefaste Kanten. Jeder Sockel bekommt vier WedgeParts an der
	    Oberkante. Roblox hat kein Bevel-Werkzeug; vier Keile im
	    90-Grad-Raster sind die naechstbeste Umsetzung und kosten
	    vier Parts statt eines Meshes.
	  * Alle Positionen liegen auf ganzen Studs, alle Rotationen in
	    90-Grad-Schritten (Vielfache von 15).
	  * SmoothPlastic statt Plastic, Reflectance hoechstens 0.12 –
	    hoehere Werte lassen Roblox-Teile nass statt metallisch wirken.
	  * Neon ausschliesslich fuer Lichtakzente (Ring, Duese, Sammlerfeld),
	    nie fuer grosse Flaechen.

	Der Kaufknopf besteht aus vier Teilen: Sockel, Fase, Leuchtring
	(flacher Zylinder) und Trittplatte, darueber ein schwebendes Panel
	mit Name, Preis, Symbol und Fortschrittsring.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Format = require(Shared.Format)
local Theme = require(Shared.Theme)
local Types = require(Shared.Types)

local C = Theme.Color
local M = Theme.Material

-- ==========================================================================
-- Layout (lokal zum Plot-Ursprung, alle Werte in ganzen Studs)
-- ==========================================================================

local L = {
	FLOOR_TOP = 1,

	BELT_Z = -45,
	BELT_Y_TOP = 6,
	BELT_MIN_X = -66,
	BELT_MAX_X = 66,
	BELT_WIDTH = 9,

	DROPPER_START_X = -62,
	DROPPER_STEP_X = 8,
	DROPPER_BODY_Y = 13,

	UPGRADER_START_X = 2,
	UPGRADER_STEP_X = 10,

	COLLECTOR_X = 60,

	BUTTON_ROW_Z = { 14, 36, 58 },
	BUTTON_PER_ROW = 9,
	BUTTON_STEP_X = 17,
	BUTTON_BASE = 9,
	BUTTON_TREAD = 7,

	CLAIM_Z = 75,
	REBIRTH_POS = Vector3.new(-66, 2, 66),
	VIP_ROOM_SIZE = 16,
	VIP_POS = Vector3.new(68, 8, 74),

	HALL_BACK_Z = -74,
	HALL_SIDE_X = 76,
	HALL_HEIGHT = 32,
	HALL_FRONT_Z = -8,
}

local DROPPER_ORDER = {
	"__base", "dropper_2", "dropper_3", "dropper_4",
	"dropper_5", "dropper_6", "dropper_7",
}
local UPGRADER_ORDER = {
	"upgrader_1", "upgrader_2", "upgrader_3", "upgrader_4", "upgrader_5",
}

-- Symbol je Upgrade-Art auf dem schwebenden Panel.
local function iconFor(kind: string): string
	if kind == "dropper" then
		return "drill"
	elseif kind == "upgrader" or kind == "collector" then
		return "furnace"
	elseif kind == "speed" or kind == "rate" then
		return "belt"
	end
	return "shop"
end

-- ==========================================================================
-- Typen
-- ==========================================================================

export type ButtonRefs = {
	def: Types.UpgradeDef,
	base: BasePart,
	tread: BasePart,
	ring: BasePart,
	bevel: { BasePart },
	billboard: BillboardGui,
	card: Frame,
	title: TextLabel,
	price: TextLabel,
	progress: Frame,
	stroke: UIStroke,
	homeCFrame: CFrame,
}

export type UpgraderRefs = { field: BasePart, frame: { BasePart } }

export type PlotRefs = {
	index: number,
	origin: CFrame,
	model: Model,
	ores: Folder,
	conveyors: { BasePart },
	conveyorBeam: Beam,
	dropSpawns: { [string]: CFrame },
	dropperBodies: { [string]: { BasePart } },
	upgraders: { [string]: UpgraderRefs },
	collector: BasePart,
	collectorSub: TextLabel,
	collectorBurst: ParticleEmitter,
	buttons: { [string]: ButtonRefs },
	claimPad: BasePart,
	claimTitle: TextLabel,
	claimSub: TextLabel,
	rebirthPad: BasePart,
	rebirthSub: TextLabel,
	hall: { BasePart },
	hallLights: { PointLight },
	vipDoor: BasePart,
	spawnCFrame: CFrame,
}

-- ==========================================================================
-- Bau-Hilfen
-- ==========================================================================

type PartOptions = {
	name: string,
	size: Vector3,
	cf: CFrame,
	color: Color3,
	material: Enum.Material?,
	transparency: number?,
	canCollide: boolean?,
	reflectance: number?,
	shape: Enum.PartType?,
	parent: Instance,
}

local function makePart(o: PartOptions): Part
	local p = Instance.new("Part")
	p.Name = o.name
	p.Size = o.size
	p.CFrame = o.cf
	p.Color = o.color
	p.Material = o.material or M.surface
	p.Transparency = o.transparency or Theme.Alpha.opaque
	p.Reflectance = o.reflectance or Theme.Reflectance.none
	p.CanCollide = if o.canCollide == nil then true else o.canCollide
	p.Shape = o.shape or Enum.PartType.Block
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.CastShadow = false
	p.Parent = o.parent
	return p
end

local function makeWedge(name: string, size: Vector3, cf: CFrame, color: Color3,
	material: Enum.Material, parent: Instance): WedgePart
	local w = Instance.new("WedgePart")
	w.Name = name
	w.Size = size
	w.CFrame = cf
	w.Color = color
	w.Material = material
	w.Anchored = true
	w.CanCollide = false
	w.CastShadow = false
	w.Parent = parent
	return w
end

--[[
	Vier Keile an der Oberkante eines quadratischen Sockels.
	Die Rotationen sind 0/90/180/270 Grad – Vielfache von 15, wie gefordert.
]]
local function bevelRing(center: CFrame, span: number, height: number,
	color: Color3, parent: Instance): { BasePart }
	local out: { BasePart } = {}
	local inset = span / 2 - height / 2
	for step = 0, 3 do
		-- 0, 90, 180, 270 Grad - alles Vielfache von 15.
		local yaw = math.rad(step * 90)
		local cf = center
			* CFrame.Angles(0, yaw, 0)
			* CFrame.new(0, height / 2, -inset)
			* CFrame.Angles(0, math.rad(180), 0)
		out[step + 1] = makeWedge("Bevel", Vector3.new(span, height, height),
			cf, color, M.metal, parent)
	end
	return out
end

--[[
	Schwebendes Panel im Stil der Oberflaeche: Karte mit Rand, Symbolfeld,
	Titel, Preis und einem Fortschrittsbalken als "Ring".

	Ein echter Kreisring waere in Roblox-GUI nur ueber ein Bild (mit
	Asset-Id) oder ein zerlegtes Viertelkreis-Konstrukt moeglich. Da hier
	keine Asset-Ids erfunden werden, ist es ein horizontaler Balken mit
	Pill-Radius – dieselbe Information, ohne Platzhalterbild.
]]
local function buyPanel(adornee: BasePart, def: Types.UpgradeDef)
	local bb = Instance.new("BillboardGui")
	bb.Name = "BuyPanel"
	bb.Size = UDim2.fromScale(Theme.Size.worldSignWidth, Theme.Size.worldSignWidth * 0.52)
	bb.StudsOffsetWorldSpace = Vector3.new(0, Theme.Size.worldSignOffset, 0)
	-- 60 Studs: ab da ist der Text ohnehin nicht mehr lesbar, und bei
	-- sechs Plots mit je 25 Panels ist das der teuerste Posten im Bild.
	bb.MaxDistance = Theme.Size.worldSignOffset * 10
	bb.LightInfluence = 0
	bb.Adornee = adornee
	bb.Parent = adornee

	local card = Theme.Card({
		name = "Card", parent = bb,
		size = UDim2.fromScale(1, 1),
		fill = C.bg1, radius = Theme.Radius.card,
		strokeColor = C.primary, zIndex = Theme.Layer.world, shadow = false,
	})
	Theme.padding(card, { all = Theme.Space.x8 })
	local stroke = card:FindFirstChildOfClass("UIStroke") :: UIStroke

	-- Symbolfeld links
	local iconField = Instance.new("Frame")
	iconField.Name = "IconField"
	iconField.Size = UDim2.fromScale(0.2, 0.62)
	iconField.Position = UDim2.fromScale(0, 0)
	iconField.BackgroundColor3 = C.primary
	iconField.BorderSizePixel = 0
	iconField.ZIndex = Theme.Layer.world + Theme.Depth.content
	iconField.Parent = card
	Theme.corner(iconField, Theme.Radius.chip)
	local glyph = Theme.label({
		name = "Glyph", parent = iconField, text = "", role = "display",
		size = Theme.TextSize.md, color = C.bg0,
		layoutSize = UDim2.fromScale(1, 1),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = Theme.Layer.world + Theme.Depth.raised, stroke = false,
	})
	glyph.Name = "Glyph_" .. iconFor(def.effect.kind)

	local title = Theme.label({
		name = "Title", parent = card, text = def.label, role = "heading",
		size = Theme.TextSize.md, color = C.textHigh,
		layoutSize = UDim2.fromScale(0.76, 0.34),
		position = UDim2.fromScale(0.24, 0),
		zIndex = Theme.Layer.world + Theme.Depth.content,
	})
	local price = Theme.label({
		name = "Price", parent = card,
		text = Format.abbreviate(def.price) .. " $", role = "numeric",
		size = Theme.TextSize.lg, color = C.success,
		layoutSize = UDim2.fromScale(0.76, 0.3),
		position = UDim2.fromScale(0.24, 0.32),
		zIndex = Theme.Layer.world + Theme.Depth.content,
	})

	-- Fortschritt beim Draufstehen
	local track = Instance.new("Frame")
	track.Name = "Track"
	track.Size = UDim2.fromScale(1, 0.14)
	track.Position = UDim2.fromScale(0, 0.86)
	track.BackgroundColor3 = C.bg0
	track.BorderSizePixel = 0
	track.ClipsDescendants = true
	track.ZIndex = Theme.Layer.world + Theme.Depth.content
	track.Parent = card
	Theme.corner(track, Theme.Radius.pill)

	local progress = Instance.new("Frame")
	progress.Name = "Progress"
	progress.Size = UDim2.fromScale(0, 1)
	progress.BackgroundColor3 = C.primary
	progress.BorderSizePixel = 0
	progress.ZIndex = Theme.Layer.world + Theme.Depth.raised
	progress.Parent = track
	Theme.corner(progress, Theme.Radius.pill)

	return card, title, price, progress, stroke, bb
end

local function makeSign(parent: BasePart, title: string, sub: string,
	accent: Color3, widthStuds: number, offsetY: number): (TextLabel, TextLabel)
	local bb = Instance.new("BillboardGui")
	bb.Name = "Sign"
	bb.Size = UDim2.fromScale(widthStuds, widthStuds * 0.4)
	bb.StudsOffsetWorldSpace = Vector3.new(0, offsetY, 0)
	bb.MaxDistance = Theme.Size.worldSignOffset * 32
	bb.LightInfluence = 0
	bb.Parent = parent

	local card = Theme.Card({
		name = "Card", parent = bb, size = UDim2.fromScale(1, 1),
		fill = C.bg1, radius = Theme.Radius.card, strokeColor = accent,
		zIndex = Theme.Layer.world, shadow = false,
	})
	Theme.padding(card, { all = Theme.Space.x8 })

	local titleLabel = Theme.label({
		name = "Title", parent = card, text = title, role = "display",
		size = Theme.TextSize.lg, color = accent,
		layoutSize = UDim2.fromScale(1, 0.5),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = Theme.Layer.world + Theme.Depth.content,
	})
	local subLabel = Theme.label({
		name = "Sub", parent = card, text = sub, role = "body",
		size = Theme.TextSize.sm, color = C.textMid,
		layoutSize = UDim2.fromScale(1, 0.42),
		position = UDim2.fromScale(0, 0.54),
		xAlign = Enum.TextXAlignment.Center,
		zIndex = Theme.Layer.world + Theme.Depth.content, stroke = false,
	})
	return titleLabel, subLabel
end

-- ==========================================================================
-- Aufbau
-- ==========================================================================

local PlotBuilder = {}

function PlotBuilder.build(index: number, origin: CFrame, parent: Instance): PlotRefs
	local model = Instance.new("Model")
	model.Name = "Plot" .. index
	model.Parent = parent

	local build = Instance.new("Folder")
	build.Name = "Build"
	build.Parent = model

	local ores = Instance.new("Folder")
	ores.Name = "Ores"
	ores.Parent = model

	local function at(x: number, y: number, z: number): CFrame
		return origin * CFrame.new(x, y, z)
	end

	local size = Config.WORLD.PLOT_SIZE

	-- ---- Boden und Rand ------------------------------------------------
	makePart({
		name = "Floor", size = size, cf = at(0, 0, 0),
		color = C.bg1, material = M.concrete, parent = build,
	})
	local halfX, halfZ = size.X / 2, size.Z / 2
	for _, spec in ipairs({
		{ Vector3.new(size.X, 3, 2), Vector3.new(0, 1.5, -halfZ) },
		{ Vector3.new(size.X, 3, 2), Vector3.new(0, 1.5, halfZ) },
		{ Vector3.new(2, 3, size.Z), Vector3.new(-halfX, 1.5, 0) },
		{ Vector3.new(2, 3, size.Z), Vector3.new(halfX, 1.5, 0) },
	}) do
		makePart({
			name = "Kerb", size = spec[1],
			cf = at(spec[2].X, spec[2].Y, spec[2].Z),
			color = C.bg3, material = M.metal,
			reflectance = Theme.Reflectance.subtle, parent = build,
		})
	end

	-- ---- Foerderband ----------------------------------------------------
	local beltLength = L.BELT_MAX_X - L.BELT_MIN_X
	local beltCenterX = (L.BELT_MIN_X + L.BELT_MAX_X) / 2
	local belt = makePart({
		name = "Conveyor",
		size = Vector3.new(beltLength, 1, L.BELT_WIDTH),
		cf = at(beltCenterX, L.BELT_Y_TOP - 0.5, L.BELT_Z),
		color = C.bg0, material = M.brushed,
		reflectance = Theme.Reflectance.subtle, parent = build,
	})
	belt.AssemblyLinearVelocity = Vector3.new(Config.ECONOMY.CONVEYOR_BASE_SPEED, 0, 0)

	-- Laufrichtungs-Beam ueber dem Band: zeigt an, wohin die Erze wandern.
	local beamStart = Instance.new("Attachment")
	beamStart.Position = Vector3.new(-beltLength / 2, 0.6, 0)
	beamStart.Parent = belt
	local beamEnd = Instance.new("Attachment")
	beamEnd.Position = Vector3.new(beltLength / 2, 0.6, 0)
	beamEnd.Parent = belt
	local beam = Instance.new("Beam")
	beam.Name = "FlowBeam"
	beam.Attachment0 = beamStart
	beam.Attachment1 = beamEnd
	beam.Width0 = L.BELT_WIDTH * 0.7
	beam.Width1 = L.BELT_WIDTH * 0.7
	beam.FaceCamera = false
	beam.LightEmission = 1
	beam.LightInfluence = 0
	beam.Color = ColorSequence.new(C.primary)
	-- An den Enden ausblenden, damit der Streifen nicht abrupt abschneidet.
	beam.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 1),
		NumberSequenceKeypoint.new(0.15, Theme.Alpha.ghost),
		NumberSequenceKeypoint.new(0.85, Theme.Alpha.ghost),
		NumberSequenceKeypoint.new(1, 1),
	})
	beam.Parent = belt

	for x = L.BELT_MIN_X + 6, L.BELT_MAX_X - 6, 18 do
		makePart({
			name = "BeltLeg", size = Vector3.new(2, L.BELT_Y_TOP - 1 - L.FLOOR_TOP, L.BELT_WIDTH),
			cf = at(x, (L.FLOOR_TOP + L.BELT_Y_TOP - 1) / 2, L.BELT_Z),
			color = C.bg2, material = M.metal,
			reflectance = Theme.Reflectance.metal, parent = build,
		})
	end
	for _, dz in ipairs({ -(L.BELT_WIDTH / 2 + 0.5), L.BELT_WIDTH / 2 + 0.5 }) do
		makePart({
			name = "BeltRail", size = Vector3.new(beltLength, 2, 1),
			cf = at(beltCenterX, L.BELT_Y_TOP + 0.5, L.BELT_Z + dz),
			color = C.bg3, material = M.metal,
			reflectance = Theme.Reflectance.metal, parent = build,
		})
	end

	-- ---- Dropper ---------------------------------------------------------
	local dropSpawns: { [string]: CFrame } = {}
	local dropperBodies: { [string]: { BasePart } } = {}
	for i, id in ipairs(DROPPER_ORDER) do
		local x = L.DROPPER_START_X + (i - 1) * L.DROPPER_STEP_X
		local body = makePart({
			name = "Dropper_" .. id, size = Vector3.new(5, 6, 8),
			cf = at(x, L.DROPPER_BODY_Y, L.BELT_Z),
			color = C.bg2, material = M.metal,
			reflectance = Theme.Reflectance.metal, parent = build,
		})
		local cap = makePart({
			name = "Cap", size = Vector3.new(6, 1, 9),
			cf = at(x, L.DROPPER_BODY_Y + 3, L.BELT_Z),
			color = C.bg3, material = M.brushed, parent = build,
		})
		local nozzle = makePart({
			name = "Nozzle", size = Vector3.new(2.6, 1.4, 2.6),
			cf = at(x, L.DROPPER_BODY_Y - 3.6, L.BELT_Z),
			color = C.primary, material = M.neon,
			canCollide = false, parent = build,
		})
		dropperBodies[id] = { body, cap, nozzle }
		dropSpawns[id] = at(x, L.DROPPER_BODY_Y - 5.2, L.BELT_Z)
	end

	-- ---- Veredler ---------------------------------------------------------
	local upgraders: { [string]: UpgraderRefs } = {}
	for i, id in ipairs(UPGRADER_ORDER) do
		local x = L.UPGRADER_START_X + (i - 1) * L.UPGRADER_STEP_X
		local half = L.BELT_WIDTH / 2 + 1
		local frame: { BasePart } = {
			makePart({ name = "PillarA", size = Vector3.new(1.4, 9, 1.4),
				cf = at(x, L.BELT_Y_TOP + 4.5, L.BELT_Z - half),
				color = C.bg3, material = M.metal,
				reflectance = Theme.Reflectance.metal, parent = build }),
			makePart({ name = "PillarB", size = Vector3.new(1.4, 9, 1.4),
				cf = at(x, L.BELT_Y_TOP + 4.5, L.BELT_Z + half),
				color = C.bg3, material = M.metal,
				reflectance = Theme.Reflectance.metal, parent = build }),
			makePart({ name = "Beam", size = Vector3.new(1.4, 1.4, half * 2 + 1.4),
				cf = at(x, L.BELT_Y_TOP + 9, L.BELT_Z),
				color = C.bg3, material = M.metal, parent = build }),
			makePart({ name = "Lamp", size = Vector3.new(1, 0.6, half * 2 - 1),
				cf = at(x, L.BELT_Y_TOP + 8.2, L.BELT_Z),
				color = C.premium, material = M.neon,
				canCollide = false, parent = build }),
		}
		local field = makePart({
			name = "Field_" .. id, size = Vector3.new(1.2, 8, L.BELT_WIDTH),
			cf = at(x, L.BELT_Y_TOP + 4, L.BELT_Z),
			color = C.premium, material = M.force,
			transparency = Theme.Alpha.veil, canCollide = false, parent = build,
		})
		local def = Config.UPGRADES_BY_ID[id]
		makeSign(field, def.label, `x{def.effect.mult} Erzwert`, C.premium,
			Theme.Size.worldSignWidth * 0.8, Theme.Size.worldSignOffset)
		upgraders[id] = { field = field, frame = frame }
	end

	-- ---- Sammler ----------------------------------------------------------
	local collectorBase = makePart({
		name = "CollectorBase", size = Vector3.new(12, 10, 16),
		cf = at(L.COLLECTOR_X + 8, L.FLOOR_TOP + 5, L.BELT_Z),
		color = C.bg2, material = M.metal,
		reflectance = Theme.Reflectance.metal, parent = build,
	})
	bevelRing(at(L.COLLECTOR_X + 8, L.FLOOR_TOP + 10, L.BELT_Z), 12, 1, C.bg3, build)
	local collector = makePart({
		name = "Collector", size = Vector3.new(3, 10, L.BELT_WIDTH),
		cf = at(L.COLLECTOR_X - 1, L.BELT_Y_TOP + 4, L.BELT_Z),
		color = C.success, material = M.neon,
		transparency = Theme.Alpha.veil, canCollide = false, parent = build,
	})
	local _, collectorSub = makeSign(collectorBase, "SAMMLER", "0 $ gesamt",
		C.success, Theme.Size.worldSignWidth, Theme.Size.worldSignOffset + 2)

	-- Muenzfunken beim Einloesen. Rate bleibt klein (< 20), sonst kostet
	-- der Emitter bei sechs Plots spuerbar Fuellrate.
	local burstAttachment = Instance.new("Attachment")
	burstAttachment.Position = Vector3.new(0, 5, 0)
	burstAttachment.Parent = collectorBase
	local burst = Instance.new("ParticleEmitter")
	burst.Name = "Coins"
	burst.Texture = Theme.Asset.PARTICLE_SPARKLE
	burst.Color = ColorSequence.new(C.premium)
	burst.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.9),
		NumberSequenceKeypoint.new(1, 0),
	})
	burst.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, Theme.Alpha.veil),
		NumberSequenceKeypoint.new(1, 1),
	})
	burst.Lifetime = NumberRange.new(0.3, 0.6)
	burst.Speed = NumberRange.new(6, 11)
	burst.SpreadAngle = Vector2.new(30, 30)
	burst.Rate = 0
	burst.LightEmission = 1
	burst.Enabled = false
	burst.Parent = burstAttachment

	-- ---- Kaufknoepfe ------------------------------------------------------
	local buttons: { [string]: ButtonRefs } = {}
	for i, def in ipairs(Config.UPGRADES) do
		local row = math.min(#L.BUTTON_ROW_Z, math.floor((i - 1) / L.BUTTON_PER_ROW) + 1)
		local col = (i - 1) % L.BUTTON_PER_ROW
		local rowCount = math.min(L.BUTTON_PER_ROW, #Config.UPGRADES - (row - 1) * L.BUTTON_PER_ROW)
		local x = (col - (rowCount - 1) / 2) * L.BUTTON_STEP_X
		local z = L.BUTTON_ROW_Z[row]

		local base = makePart({
			name = "Buy_" .. def.id,
			size = Vector3.new(L.BUTTON_BASE, 1.2, L.BUTTON_BASE),
			cf = at(x, L.FLOOR_TOP + 0.6, z),
			color = C.bg2, material = M.metal,
			reflectance = Theme.Reflectance.metal, parent = build,
		})
		local bevel = bevelRing(at(x, L.FLOOR_TOP + 1.2, z), L.BUTTON_BASE, 0.8, C.bg3, build)

		-- Leuchtring: flacher Zylinder. Die Zylinderachse liegt in X,
		-- deshalb 90 Grad um Z drehen, damit die Scheibe waagerecht liegt.
		local ring = makePart({
			name = "Ring", size = Vector3.new(0.4, L.BUTTON_TREAD + 1.4, L.BUTTON_TREAD + 1.4),
			cf = at(x, L.FLOOR_TOP + 1.3, z) * CFrame.Angles(0, 0, math.rad(90)),
			color = C.primary, material = M.neon,
			canCollide = false, shape = Enum.PartType.Cylinder, parent = build,
		})
		local tread = makePart({
			name = "Tread", size = Vector3.new(L.BUTTON_TREAD, 0.5, L.BUTTON_TREAD),
			cf = at(x, L.FLOOR_TOP + 1.45, z),
			color = C.bg3, material = M.surface, parent = build,
		})

		local card, title, price, progress, stroke, billboard = buyPanel(tread, def)
		buttons[def.id] = {
			def = def, base = base, tread = tread, ring = ring, bevel = bevel,
			billboard = billboard, card = card, title = title, price = price,
			progress = progress, stroke = stroke,
			homeCFrame = base.CFrame,
		}
	end

	-- ---- Claim-Pad ---------------------------------------------------------
	local claimPad = makePart({
		name = "ClaimPad", size = Vector3.new(16, 2, 16),
		cf = at(0, L.FLOOR_TOP + 1, L.CLAIM_Z),
		color = C.premium, material = M.neon, parent = build,
	})
	local claimTitle, claimSub = makeSign(claimPad, `FREI #{index}`,
		"Wird beim Beitritt vergeben", C.premium,
		Theme.Size.worldSignWidth * 1.4, Theme.Size.worldSignOffset + 1)

	-- ---- Rebirth-Pad --------------------------------------------------------
	local rebirthPad = makePart({
		name = "RebirthPad", size = Vector3.new(12, 2, 12),
		cf = at(L.REBIRTH_POS.X, L.FLOOR_TOP + 1, L.REBIRTH_POS.Z),
		color = C.danger, material = M.neon, parent = build,
	})
	bevelRing(at(L.REBIRTH_POS.X, L.FLOOR_TOP + 2, L.REBIRTH_POS.Z), 12, 0.8, C.dangerDeep, build)
	local _, rebirthSub = makeSign(rebirthPad, "REBIRTH", "-", C.danger,
		Theme.Size.worldSignWidth * 1.2, Theme.Size.worldSignOffset)

	-- ---- Halle ---------------------------------------------------------------
	local hall: { BasePart } = {}
	local hallDepth = L.HALL_FRONT_Z - L.HALL_BACK_Z
	local hallMidZ = (L.HALL_FRONT_Z + L.HALL_BACK_Z) / 2
	table.insert(hall, makePart({
		name = "HallBack", size = Vector3.new(L.HALL_SIDE_X * 2, L.HALL_HEIGHT, 2),
		cf = at(0, L.FLOOR_TOP + L.HALL_HEIGHT / 2, L.HALL_BACK_Z),
		color = C.bg1, material = M.metal, parent = build,
	}))
	for _, sx in ipairs({ -L.HALL_SIDE_X, L.HALL_SIDE_X }) do
		table.insert(hall, makePart({
			name = "HallSide", size = Vector3.new(2, L.HALL_HEIGHT, hallDepth),
			cf = at(sx, L.FLOOR_TOP + L.HALL_HEIGHT / 2, hallMidZ),
			color = C.bg1, material = M.metal, parent = build,
		}))
	end
	table.insert(hall, makePart({
		name = "HallRoof", size = Vector3.new(L.HALL_SIDE_X * 2, 2, hallDepth),
		cf = at(0, L.FLOOR_TOP + L.HALL_HEIGHT, hallMidZ),
		color = C.bg0, material = M.metal,
		transparency = Theme.Alpha.glass, parent = build,
	}))

	local hallLights: { PointLight } = {}
	for _, lx in ipairs({ -40, 0, 40 }) do
		local fixture = makePart({
			name = "Lamp", size = Vector3.new(6, 1, 6),
			cf = at(lx, L.FLOOR_TOP + L.HALL_HEIGHT - 2, hallMidZ),
			color = C.premiumLight, material = M.neon,
			canCollide = false, parent = build,
		})
		local light = Instance.new("PointLight")
		light.Brightness = 3
		light.Range = 45
		light.Color = C.premiumLight
		-- Schatten nur beim mittleren Licht: drei schattenwerfende Lichter
		-- pro Plot mal sechs Plots kosten auf Mobilgeraeten zu viel.
		light.Shadows = lx == 0
		light.Enabled = false
		light.Parent = fixture
		table.insert(hallLights, light)
		table.insert(hall, fixture)
	end

	-- ---- VIP-Raum ---------------------------------------------------------------
	makePart({
		name = "VipFloor", size = Vector3.new(L.VIP_ROOM_SIZE, 2, L.VIP_ROOM_SIZE),
		cf = at(L.VIP_POS.X, L.FLOOR_TOP + 1, L.VIP_POS.Z),
		color = C.bg2, material = M.marble,
		reflectance = Theme.Reflectance.subtle, parent = build,
	})
	local vipDoor = makePart({
		name = "VipDoor", size = Vector3.new(2, 12, 12),
		cf = at(L.VIP_POS.X - L.VIP_ROOM_SIZE / 2, L.FLOOR_TOP + 6, L.VIP_POS.Z),
		color = C.premium, material = M.glass,
		transparency = Theme.Alpha.veil, parent = build,
	})
	makeSign(vipDoor, "VIP", "Nur mit VIP-Pass", C.premium,
		Theme.Size.worldSignWidth * 0.8, Theme.Size.worldSignOffset + 2)

	model.PrimaryPart = claimPad

	return {
		index = index, origin = origin, model = model, ores = ores,
		conveyors = { belt }, conveyorBeam = beam,
		dropSpawns = dropSpawns, dropperBodies = dropperBodies,
		upgraders = upgraders,
		collector = collector, collectorSub = collectorSub, collectorBurst = burst,
		buttons = buttons,
		claimPad = claimPad, claimTitle = claimTitle, claimSub = claimSub,
		rebirthPad = rebirthPad, rebirthSub = rebirthSub,
		hall = hall, hallLights = hallLights, vipDoor = vipDoor,
		spawnCFrame = at(0, L.FLOOR_TOP + 4, L.CLAIM_Z - 9),
	}
end

PlotBuilder.DROPPER_ORDER = DROPPER_ORDER
PlotBuilder.UPGRADER_ORDER = UPGRADER_ORDER
PlotBuilder.BUTTON_RADIUS = L.BUTTON_BASE

return PlotBuilder
