--!strict
--[[
	PlotBuilder – baut die Geometrie EINES Tycoon-Plots.

	Bewusst frei von Spiellogik: dieses Modul kennt keine Spieler, kein Geld
	und keine Kaufregeln. Es liefert nur benannte Referenzen auf Teile
	zurueck. Dadurch laesst sich das Layout aendern, ohne die Oekonomie
	anzufassen, und PlotService muss nie per FindFirstChild im Baum suchen
	(was bei StreamingEnabled ohnehin unzuverlaessig waere).

	Alle Koordinaten sind LOKAL zum Plot-Ursprung. Die Plots sind bewusst
	nicht rotiert, damit die Bandrichtung schlicht +X ist - eine Rotation
	wuerde bei AssemblyLinearVelocity eine Vektordrehung pro Band noetig
	machen, ohne dass das Spiel davon profitiert.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Types = require(Shared.Types)

local C = Config.COLORS

-- ==========================================================================
-- Layout-Konstanten (lokal zum Plot-Ursprung)
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

	CLAIM_Z = 75,   -- Pad 16 tief -> 67..83, bleibt innerhalb der Kante bei 85
	REBIRTH_POS = Vector3.new(-66, 2, 66),
	-- Freie Ecke rechts vorn: die dritte Knopfreihe endet bei z=62.5,
	-- der Rebirth-Pad liegt spiegelbildlich links. Keine Ueberlappung.
	VIP_ROOM_SIZE = 16,
	VIP_POS = Vector3.new(68, 8, 74),

	HALL_BACK_Z = -74,
	HALL_SIDE_X = 76,
	HALL_HEIGHT = 32,
	HALL_FRONT_Z = -8,
}

-- Reihenfolge der Dropper am Band: erst der Gratis-Startdropper, dann die
-- kaufbaren. "__base" ist kein Upgrade, sondern der Startdropper.
local DROPPER_ORDER = {
	"__base", "dropper_2", "dropper_3", "dropper_4",
	"dropper_5", "dropper_6", "dropper_7",
}
local UPGRADER_ORDER = {
	"upgrader_1", "upgrader_2", "upgrader_3", "upgrader_4", "upgrader_5",
}

-- ==========================================================================
-- Typen
-- ==========================================================================

export type ButtonRefs = {
	pad: BasePart,
	title: TextLabel,
	sub: TextLabel,
	stroke: UIStroke,
	def: Types.UpgradeDef,
}

export type UpgraderRefs = {
	field: BasePart,
	frame: { BasePart },
}

export type PlotRefs = {
	index: number,
	origin: CFrame,
	model: Model,
	ores: Folder,
	conveyors: { BasePart },
	dropSpawns: { [string]: CFrame },
	dropperBodies: { [string]: { BasePart } },
	upgraders: { [string]: UpgraderRefs },
	collector: BasePart,
	collectorSub: TextLabel,
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
	parent: Instance,
}

local function makePart(o: PartOptions): Part
	local p = Instance.new("Part")
	p.Name = o.name
	p.Size = o.size
	p.CFrame = o.cf
	p.Color = o.color
	p.Material = o.material or Enum.Material.SmoothPlastic
	p.Transparency = o.transparency or 0
	p.CanCollide = if o.canCollide == nil then true else o.canCollide
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.CastShadow = false   -- Schatten pro Kleinteil kosten auf Mobilgeraeten spuerbar
	p.Parent = o.parent
	return p
end

--[[
	Zwei-Zeilen-Schild ueber einem Teil. MaxDistance begrenzt, ab wann der
	Client das Gui ueberhaupt rendert - bei 6 Plots x ~30 Schildern waere
	das sonst die teuerste Sache auf dem Bildschirm.
]]
local function makeSign(
	parent: BasePart, title: string, sub: string,
	accent: Color3, widthStuds: number, offsetY: number
): (TextLabel, TextLabel, UIStroke)
	local bb = Instance.new("BillboardGui")
	bb.Name = "Sign"
	bb.Size = UDim2.fromScale(widthStuds, widthStuds * 0.4)
	bb.StudsOffsetWorldSpace = Vector3.new(0, offsetY, 0)
	bb.MaxDistance = 190
	bb.LightInfluence = 0
	bb.Parent = parent

	local frame = Instance.new("Frame")
	frame.Size = UDim2.fromScale(1, 1)
	frame.BackgroundColor3 = C.PANEL
	frame.BackgroundTransparency = 0.12
	frame.BorderSizePixel = 0
	frame.Parent = bb

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 10)
	corner.Parent = frame

	local stroke = Instance.new("UIStroke")
	stroke.Color = accent
	stroke.Thickness = 2.5
	stroke.Parent = frame

	local titleLabel = Instance.new("TextLabel")
	titleLabel.Name = "Title"
	titleLabel.Size = UDim2.fromScale(0.92, 0.46)
	titleLabel.Position = UDim2.fromScale(0.04, 0.06)
	titleLabel.BackgroundTransparency = 1
	titleLabel.Text = title
	titleLabel.TextColor3 = accent
	titleLabel.Font = Enum.Font.GothamBlack
	titleLabel.TextScaled = true
	titleLabel.Parent = frame

	local subLabel = Instance.new("TextLabel")
	subLabel.Name = "Sub"
	subLabel.Size = UDim2.fromScale(0.92, 0.38)
	subLabel.Position = UDim2.fromScale(0.04, 0.55)
	subLabel.BackgroundTransparency = 1
	subLabel.Text = sub
	subLabel.TextColor3 = C.TEXT
	subLabel.Font = Enum.Font.GothamMedium
	subLabel.TextScaled = true
	subLabel.Parent = frame

	return titleLabel, subLabel, stroke
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
		color = C.DARK_STEEL, material = Enum.Material.Concrete, parent = build,
	})
	local halfX, halfZ = size.X / 2, size.Z / 2
	for _, spec in ipairs({
		{ Vector3.new(size.X, 3, 2), Vector3.new(0, 1.5, -halfZ) },
		{ Vector3.new(size.X, 3, 2), Vector3.new(0, 1.5, halfZ) },
		{ Vector3.new(2, 3, size.Z), Vector3.new(-halfX, 1.5, 0) },
		{ Vector3.new(2, 3, size.Z), Vector3.new(halfX, 1.5, 0) },
	}) do
		local dim, pos = spec[1], spec[2]
		makePart({
			name = "Kerb", size = dim, cf = at(pos.X, pos.Y, pos.Z),
			color = C.ACCENT, material = Enum.Material.Metal, parent = build,
		})
	end

	-- ---- Foerderband ----------------------------------------------------
	-- Ein verankertes Teil mit AssemblyLinearVelocity wirkt als Foerderband.
	-- Das ist der aktuelle Weg (BasePart.Velocity ist veraltet) und kostet
	-- null Skriptzeit, weil die Physik-Engine die Arbeit macht.
	local beltLength = L.BELT_MAX_X - L.BELT_MIN_X
	local belt = makePart({
		name = "Conveyor",
		size = Vector3.new(beltLength, 1, L.BELT_WIDTH),
		cf = at((L.BELT_MIN_X + L.BELT_MAX_X) / 2, L.BELT_Y_TOP - 0.5, L.BELT_Z),
		color = C.DARK_STEEL, material = Enum.Material.DiamondPlate, parent = build,
	})
	belt.AssemblyLinearVelocity = Vector3.new(Config.ECONOMY.CONVEYOR_BASE_SPEED, 0, 0)

	for x = L.BELT_MIN_X + 6, L.BELT_MAX_X - 6, 18 do
		makePart({
			name = "BeltLeg", size = Vector3.new(2, L.BELT_Y_TOP - 1 - L.FLOOR_TOP, L.BELT_WIDTH),
			cf = at(x, (L.FLOOR_TOP + L.BELT_Y_TOP - 1) / 2, L.BELT_Z),
			color = C.STEEL, material = Enum.Material.Metal, parent = build,
		})
	end
	-- Seitenwaende, damit Erze nicht vom Band kippen.
	for _, dz in ipairs({ -(L.BELT_WIDTH / 2 + 0.5), L.BELT_WIDTH / 2 + 0.5 }) do
		makePart({
			name = "BeltRail", size = Vector3.new(beltLength, 2, 1),
			cf = at((L.BELT_MIN_X + L.BELT_MAX_X) / 2, L.BELT_Y_TOP + 0.5, L.BELT_Z + dz),
			color = C.STEEL, material = Enum.Material.Metal, parent = build,
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
			color = C.STEEL, material = Enum.Material.Metal, parent = build,
		})
		local nozzle = makePart({
			name = "Nozzle", size = Vector3.new(2.6, 1.4, 2.6),
			cf = at(x, L.DROPPER_BODY_Y - 3.6, L.BELT_Z),
			color = C.ACCENT, material = Enum.Material.Neon,
			canCollide = false, parent = build,
		})
		dropperBodies[id] = { body, nozzle }
		-- Spawnpunkt liegt UNTER der Duese, sonst steckt das Erz im Gehaeuse.
		dropSpawns[id] = at(x, L.DROPPER_BODY_Y - 5.2, L.BELT_Z)
	end

	-- ---- Veredler ---------------------------------------------------------
	local upgraders: { [string]: UpgraderRefs } = {}
	for i, id in ipairs(UPGRADER_ORDER) do
		local x = L.UPGRADER_START_X + (i - 1) * L.UPGRADER_STEP_X
		local half = L.BELT_WIDTH / 2 + 1
		-- Explizit als {BasePart} typisiert: Luau-Tabellentypen sind invariant,
		-- ein {Part} passt also nicht auf ein erwartetes {BasePart}.
		local frame: { BasePart } = {
			makePart({ name = "PillarA", size = Vector3.new(1.4, 9, 1.4),
				cf = at(x, L.BELT_Y_TOP + 4.5, L.BELT_Z - half),
				color = C.ACCENT, material = Enum.Material.Metal, parent = build }),
			makePart({ name = "PillarB", size = Vector3.new(1.4, 9, 1.4),
				cf = at(x, L.BELT_Y_TOP + 4.5, L.BELT_Z + half),
				color = C.ACCENT, material = Enum.Material.Metal, parent = build }),
			makePart({ name = "Beam", size = Vector3.new(1.4, 1.4, half * 2 + 1.4),
				cf = at(x, L.BELT_Y_TOP + 9, L.BELT_Z),
				color = C.ACCENT, material = Enum.Material.Metal, parent = build }),
		}
		local field = makePart({
			name = "Field_" .. id, size = Vector3.new(1.2, 8, L.BELT_WIDTH),
			cf = at(x, L.BELT_Y_TOP + 4, L.BELT_Z),
			color = C.ACCENT, material = Enum.Material.ForceField,
			transparency = 0.5, canCollide = false, parent = build,
		})
		local def = Config.UPGRADES_BY_ID[id]
		makeSign(field, def.label, `x{def.effect.mult} Erzwert`, C.ACCENT, 9, 7)
		upgraders[id] = { field = field, frame = frame }
	end

	-- ---- Sammler ----------------------------------------------------------
	-- Gehaeuse bewusst 8 studs hinter dem Kollektorfeld: stuende es direkt
	-- dahinter, traefe ein schnelles Erz im selben Frame Feld UND Wand,
	-- und bei ungluecklicher Reihenfolge prallt es ab statt eingeloest zu
	-- werden.
	local collectorBase = makePart({
		name = "CollectorBase", size = Vector3.new(12, 10, 16),
		cf = at(L.COLLECTOR_X + 8, L.FLOOR_TOP + 5, L.BELT_Z),
		color = C.STEEL, material = Enum.Material.Metal, parent = build,
	})
	local collector = makePart({
		name = "Collector", size = Vector3.new(3, 10, L.BELT_WIDTH),
		cf = at(L.COLLECTOR_X - 1, L.BELT_Y_TOP + 4, L.BELT_Z),
		color = C.CASH, material = Enum.Material.Neon,
		transparency = 0.4, canCollide = false, parent = build,
	})
	local _, collectorSub = makeSign(collectorBase, "SAMMLER", "0 $ gesamt", C.CASH, 12, 7)

	-- ---- Kaufknoepfe ------------------------------------------------------
	local buttons: { [string]: ButtonRefs } = {}
	for i, def in ipairs(Config.UPGRADES) do
		local row = math.min(#L.BUTTON_ROW_Z, math.floor((i - 1) / L.BUTTON_PER_ROW) + 1)
		local col = (i - 1) % L.BUTTON_PER_ROW
		local rowCount = math.min(L.BUTTON_PER_ROW, #Config.UPGRADES - (row - 1) * L.BUTTON_PER_ROW)
		local x = (col - (rowCount - 1) / 2) * L.BUTTON_STEP_X
		local pad = makePart({
			name = "Buy_" .. def.id, size = Vector3.new(9, 2, 9),
			cf = at(x, L.FLOOR_TOP + 1, L.BUTTON_ROW_Z[row]),
			color = C.LOCKED, material = Enum.Material.Neon, parent = build,
		})
		local title, sub, stroke = makeSign(pad, def.label, "gesperrt", C.LOCKED, 11, 5)
		buttons[def.id] = { pad = pad, title = title, sub = sub, stroke = stroke, def = def }
	end

	-- ---- Claim-Pad ---------------------------------------------------------
	local claimPad = makePart({
		name = "ClaimPad", size = Vector3.new(16, 2, 16),
		cf = at(0, L.FLOOR_TOP + 1, L.CLAIM_Z),
		color = C.ACCENT, material = Enum.Material.Neon, parent = build,
	})
	local claimTitle, claimSub = makeSign(
		claimPad, `FREI #{index}`, "Wird beim Beitritt vergeben", C.ACCENT, 16, 7)

	-- ---- Rebirth-Pad --------------------------------------------------------
	local rebirthPad = makePart({
		name = "RebirthPad", size = Vector3.new(12, 2, 12),
		cf = at(L.REBIRTH_POS.X, L.FLOOR_TOP + 1, L.REBIRTH_POS.Z),
		color = C.GEM, material = Enum.Material.Neon, parent = build,
	})
	local _, rebirthSub = makeSign(rebirthPad, "REBIRTH", "-", C.GEM, 13, 6)

	-- ---- Halle (erst nach Kauf sichtbar) -------------------------------------
	local hall: { BasePart } = {}
	local hallDepth = L.HALL_FRONT_Z - L.HALL_BACK_Z
	local hallMidZ = (L.HALL_FRONT_Z + L.HALL_BACK_Z) / 2
	table.insert(hall, makePart({
		name = "HallBack", size = Vector3.new(L.HALL_SIDE_X * 2, L.HALL_HEIGHT, 2),
		cf = at(0, L.FLOOR_TOP + L.HALL_HEIGHT / 2, L.HALL_BACK_Z),
		color = C.ROCK, material = Enum.Material.Metal, parent = build,
	}))
	for _, sx in ipairs({ -L.HALL_SIDE_X, L.HALL_SIDE_X }) do
		table.insert(hall, makePart({
			name = "HallSide", size = Vector3.new(2, L.HALL_HEIGHT, hallDepth),
			cf = at(sx, L.FLOOR_TOP + L.HALL_HEIGHT / 2, hallMidZ),
			color = C.ROCK, material = Enum.Material.Metal, parent = build,
		}))
	end
	local roof = makePart({
		name = "HallRoof", size = Vector3.new(L.HALL_SIDE_X * 2, 2, hallDepth),
		cf = at(0, L.FLOOR_TOP + L.HALL_HEIGHT, hallMidZ),
		color = C.DARK_STEEL, material = Enum.Material.Metal,
		transparency = 0.2, parent = build,
	})
	table.insert(hall, roof)

	-- ---- Hallenbeleuchtung ----------------------------------------------------
	local hallLights: { PointLight } = {}
	for _, lx in ipairs({ -40, 0, 40 }) do
		local fixture = makePart({
			name = "Lamp", size = Vector3.new(6, 1, 6),
			cf = at(lx, L.FLOOR_TOP + L.HALL_HEIGHT - 2, hallMidZ),
			color = C.ACCENT, material = Enum.Material.Neon,
			canCollide = false, parent = build,
		})
		local light = Instance.new("PointLight")
		light.Brightness = 3
		light.Range = 45
		light.Color = Color3.fromRGB(255, 226, 180)
		light.Enabled = false
		light.Parent = fixture
		table.insert(hallLights, light)
		table.insert(hall, fixture)
	end

	-- ---- VIP-Tuer ---------------------------------------------------------------
	local vipRoomFloor = makePart({
		name = "VipFloor", size = Vector3.new(L.VIP_ROOM_SIZE, 2, L.VIP_ROOM_SIZE),
		cf = at(L.VIP_POS.X, L.FLOOR_TOP + 1, L.VIP_POS.Z),
		color = C.PANEL_LIGHT, material = Enum.Material.Marble, parent = build,
	})
	vipRoomFloor.CastShadow = false
	local vipDoor = makePart({
		name = "VipDoor", size = Vector3.new(2, 12, 12),
		cf = at(L.VIP_POS.X - L.VIP_ROOM_SIZE / 2, L.FLOOR_TOP + 6, L.VIP_POS.Z),
		color = C.GEM, material = Enum.Material.Glass,
		transparency = 0.45, parent = build,
	})
	makeSign(vipDoor, "VIP", "Nur mit VIP-Pass", C.GEM, 9, 8)

	model.PrimaryPart = claimPad

	return {
		index = index,
		origin = origin,
		model = model,
		ores = ores,
		conveyors = { belt },
		dropSpawns = dropSpawns,
		dropperBodies = dropperBodies,
		upgraders = upgraders,
		collector = collector,
		collectorSub = collectorSub,
		buttons = buttons,
		claimPad = claimPad,
		claimTitle = claimTitle,
		claimSub = claimSub,
		rebirthPad = rebirthPad,
		rebirthSub = rebirthSub,
		hall = hall,
		hallLights = hallLights,
		vipDoor = vipDoor,
		-- Spawn liegt in der Luecke zwischen Knopfreihe 3 (endet bei z=62.5)
		-- und dem Claim-Pad (ab z=67). Auf einem Knopf zu spawnen wuerde
		-- sofort einen Kaufversuch ausloesen.
		spawnCFrame = at(0, L.FLOOR_TOP + 4, L.CLAIM_Z - 9),
	}
end

PlotBuilder.DROPPER_ORDER = DROPPER_ORDER
PlotBuilder.UPGRADER_ORDER = UPGRADER_ORDER

return PlotBuilder
