--!strict
--[[
	Theme – das Design-System. EINZIGE Quelle fuer Farbe, Abstand, Radius,
	Typografie, Bewegung, Groesse, Ebene und Material.

	Harte Projektregel: ausserhalb dieser Datei steht kein Color3, kein
	Enum.Font, keine Schriftgroesse, kein Radius, kein Pixel-Padding und
	kein TweenInfo. `tools/theme_lint.py` prueft das und bricht den Build
	ab, wenn doch. Wer hier eine Farbe aendert, aendert das ganze Spiel.

	Der Farbblock unten ist GENERIERT aus tools/contrast.py – dort wird
	jede Kombination aus Text und Untergrund gegen WCAG 4.5:1 geprueft,
	bevor sie hier landet.
]]

local Theme = {}

-- ==========================================================================
-- 1. FARBEN
-- ==========================================================================

Theme.Color = {
	-- GENERIERT-ANFANG (tools/gen_theme.py) - nicht von Hand aendern
	-- Oberflaechen
	bg0 = Color3.fromRGB(12, 13, 20),
	bg1 = Color3.fromRGB(20, 22, 33),
	bg2 = Color3.fromRGB(29, 32, 47),
	bg3 = Color3.fromRGB(41, 45, 64),

	-- Text
	textHigh = Color3.fromRGB(243, 243, 249),
	textMid = Color3.fromRGB(183, 188, 208),
	textLow = Color3.fromRGB(146, 152, 176),

	-- Primary - Aktion und Kauf
	primary = Color3.fromRGB(128, 144, 247),
	primaryHover = Color3.fromRGB(157, 169, 249),
	primaryPressed = Color3.fromRGB(92, 112, 245),
	primaryDeep = Color3.fromRGB(33, 54, 189),

	-- Success - Cash und Gewinn
	success = Color3.fromRGB(48, 207, 149),
	successHover = Color3.fromRGB(73, 212, 161),
	successPressed = Color3.fromRGB(41, 176, 126),
	successDeep = Color3.fromRGB(26, 76, 58),

	-- Gem - Hartwaehrung
	gem = Color3.fromRGB(167, 192, 251),
	gemHover = Color3.fromRGB(196, 213, 253),
	gemPressed = Color3.fromRGB(130, 166, 250),
	gemDeep = Color3.fromRGB(42, 96, 223),

	-- Premium - NUR Monetarisierung
	premium = Color3.fromRGB(235, 163, 20),
	premiumHover = Color3.fromRGB(237, 174, 49),
	premiumPressed = Color3.fromRGB(199, 139, 17),
	premiumDeep = Color3.fromRGB(85, 62, 17),
	premiumLight = Color3.fromRGB(250, 210, 120),

	-- Warning
	warning = Color3.fromRGB(236, 135, 19),
	warningHover = Color3.fromRGB(238, 149, 47),
	warningPressed = Color3.fromRGB(200, 115, 16),
	warningDeep = Color3.fromRGB(86, 53, 16),

	-- Danger - Rebirth und Reset
	danger = Color3.fromRGB(237, 86, 69),
	dangerHover = Color3.fromRGB(239, 111, 97),
	dangerPressed = Color3.fromRGB(233, 54, 35),
	dangerDeep = Color3.fromRGB(127, 36, 26),
	-- GENERIERT-ENDE
}

--[[
	Zustandsvarianten. Kein Hover- oder Pressed-Ton wird irgendwo im Code
	improvisiert (kein :Lerp(weiss, 0.1) o. ae.) – jede Variante ist oben
	definiert und kontrastgeprueft.

	Label-Regel: ALLE gefuellten Akzentflaechen tragen bg0 als Textfarbe.
	Ein heller Text auf primary waere bei der noetigen Flaechenhelligkeit
	unter 4.5:1 gefallen; ein Labelwechsel zwischen den Zustaenden wuerde
	ausserdem beim Druecken sichtbar flackern.
]]
export type Variant = "primary" | "secondary" | "ghost" | "danger" | "premium" | "success"

export type ColorSet = {
	fill: Color3,
	fillHover: Color3,
	fillPressed: Color3,
	border: Color3,
	label: Color3,
}

local C = Theme.Color

function Theme.variant(name: Variant): ColorSet
	if name == "primary" then
		return { fill = C.primary, fillHover = C.primaryHover, fillPressed = C.primaryPressed,
			border = C.primaryDeep, label = C.bg0 }
	elseif name == "danger" then
		return { fill = C.danger, fillHover = C.dangerHover, fillPressed = C.dangerPressed,
			border = C.dangerDeep, label = C.bg0 }
	elseif name == "premium" then
		return { fill = C.premium, fillHover = C.premiumHover, fillPressed = C.premiumPressed,
			border = C.premiumDeep, label = C.bg0 }
	elseif name == "success" then
		return { fill = C.success, fillHover = C.successHover, fillPressed = C.successPressed,
			border = C.successDeep, label = C.bg0 }
	elseif name == "secondary" then
		-- Gefuellte, aber neutrale Flaeche: Text in Akzentfarbe.
		return { fill = C.bg3, fillHover = C.bg3, fillPressed = C.bg2,
			border = C.bg3, label = C.textHigh }
	end
	-- ghost: keine Flaeche, nur Rand und Akzenttext
	return { fill = C.bg2, fillHover = C.bg3, fillPressed = C.bg2,
		border = C.bg3, label = C.primary }
end

-- Deckkraft-Stufen. Textabstufungen laufen ueber FARBE (textMid/textLow),
-- nicht ueber Transparency – transparenter Text ueber bunten Flaechen
-- verliert sonst unkontrolliert Kontrast.
Theme.Alpha = {
	opaque = 0,
	glass = 0.08,
	veil = 0.35,
	backdrop = 0.45,
	divider = 0.4,
	ghost = 0.55,
	hidden = 1,
}

-- ==========================================================================
-- 2. ABSTAENDE  (nur diese acht Werte, nichts dazwischen)
-- ==========================================================================

Theme.Space = {
	x2 = 2,
	x4 = 4,
	x8 = 8,
	x12 = 12,
	x16 = 16,
	x24 = 24,
	x32 = 32,
	x48 = 48,
}

-- ==========================================================================
-- 3. RADIEN
-- ==========================================================================

--[[
	Verschachtelungsregel: ein Element IN einem Container hat immer den
	kleineren Radius. Deshalb sind Card (12) und Control (8) getrennt –
	waeren beide 8, haette ein Button in einer Card denselben Radius wie
	die Card selbst und die Regel waere verletzt.
	Ebenen: panel 16 > card 12 > control 8 > chip 4.
]]
Theme.Radius = {
	chip = 4,
	control = 8,
	card = 12,
	panel = 16,
	pill = 999,
}

-- ==========================================================================
-- 4. TYPOGRAFIE
-- ==========================================================================

export type FontRole = "display" | "heading" | "body" | "numeric"

Theme.Font = {
	display = Enum.Font.GothamBlack,
	heading = Enum.Font.GothamBold,
	body = Enum.Font.GothamMedium,
	numeric = Enum.Font.GothamBold,
}

Theme.TextSize = {
	xs = 12,
	sm = 14,
	md = 16,
	lg = 20,
	xl = 24,
	xxl = 32,
	display = 44,
}

Theme.LineHeight = {
	tight = 1.15,
	normal = 1.25,
	loose = 1.3,
}

-- Kontur fuer Text vor bunten oder unruhigen Flaechen.
Theme.TextStroke = {
	thickness = 2,
	transparency = 0.3,
}

-- ==========================================================================
-- 5. RAHMEN, ELEVATION, ASSETS
-- ==========================================================================

Theme.Stroke = {
	hair = 1,
	thin = 2,
	thick = 3,
}

Theme.Elevation = {
	-- Versatz des Schattens nach unten, in Pixeln
	offset = 4,
	transparency = 0.45,
	-- Wie weit der Schatten ueber die Flaeche hinausragt
	spread = 8,
}

--[[
	Schatten-Asset.

	Roblox kennt keine echten Schlagschatten fuer GUI. Der uebliche Weg ist
	ein 9-Slice-PNG hinter der Flaeche. So legst du eines an: ein 128x128
	PNG mit transparentem Rand und weichem schwarzen Kern (Gauss ca. 24 px)
	exportieren, in Roblox hochladen, die Asset-Id unten eintragen und
	SLICE_CENTER auf Rect.new(32, 32, 96, 96) lassen – das haelt die
	weichen 32 px an jeder Kante und streckt nur die Mitte.

	Solange die Id leer ist, zeichnet Theme.shadow eine assetfreie
	Ersatzvariante: eine zweite, dunklere Flaeche mit groesserem Radius,
	nach unten versetzt. Die hat harte Kanten statt Weichzeichnung, liest
	sich aber als Tiefe und kommt ohne erfundene Asset-Ids aus.
]]
Theme.Asset = {
	SHADOW_9SLICE = "", -- REPLACE: 128x128 PNG, weicher schwarzer Schatten
	SLICE_CENTER = Rect.new(32, 32, 96, 96),

	-- Eingebaute Client-Texturen (kein Upload noetig). Austauschbar.
	PARTICLE_SPARKLE = "rbxasset://textures/particles/sparkles_main.dds",
	PARTICLE_SMOKE = "rbxasset://textures/particles/smoke_main.dds",
}

--[[
	Icons. Es werden bewusst KEINE Asset-Ids erfunden und keine Emojis
	benutzt. Solange hier "" steht, zeichnet das Icon-Modul den Glyph aus
	Frames (Kreise, Ringe, gedrehte Quadrate). Traegst du eine Id ein,
	nimmt dasselbe Modul stattdessen ein ImageLabel – ohne Codeaenderung.
]]
Theme.Icon = {
	cash = "",     -- REPLACE: Muenze von vorn, gefuellt
	gem = "",      -- REPLACE: geschliffener Edelstein, Raute
	rebirth = "",  -- REPLACE: kreisender Pfeil
	shop = "",     -- REPLACE: Einkaufstasche
	upgrade = "",  -- REPLACE: Pfeil nach oben in Kreis
	quest = "",    -- REPLACE: Haekchenliste
	code = "",     -- REPLACE: Geschenk
	settings = "", -- REPLACE: Zahnrad
	lock = "",     -- REPLACE: geschlossenes Vorhaengeschloss
	check = "",    -- REPLACE: Haekchen
	close = "",    -- REPLACE: X
	plus = "",     -- REPLACE: Pluszeichen
	drill = "",    -- REPLACE: Bohrkopf
	furnace = "",  -- REPLACE: Schmelzofen
	belt = "",     -- REPLACE: Foerderband
	scale = "",    -- REPLACE: Waage
}

-- ==========================================================================
-- 6. GROESSEN  (jede Pixelzahl im UI-Code kommt aus dieser Tabelle)
-- ==========================================================================

Theme.Size = {
	-- Mindestgroesse fuer eine Tippflaeche NACH UIScale (Apple/Google: 44)
	touchMin = 44,

	controlHeight = 44,
	controlHeightSm = 36,
	iconButton = 48,
	iconInner = 24,
	iconSm = 16,
	iconXs = 12,

	pillHeight = 48,
	pillWidth = 196,
	pillIcon = 32,

	panelWidth = 760,
	panelHeight = 540,
	panelHeaderHeight = 72,
	tabWidth = 152,

	slotWidth = 232,
	slotHeight = 268,
	slotPreview = 116,

	rowHeight = 56,
	barHeight = 10,
	badge = 14,
	dividerHeight = 1,
	scrollBar = 6,
	tooltipMaxWidth = 260,
	toastWidth = 320,
	hintWidth = 420,
	hintHeight = 52,

	-- Weltobjekte (Studs)
	worldSignWidth = 11,
	worldSignOffset = 6,
}

-- Sicherheitsabstaende zu den Bildschirmkanten.
Theme.Safe = {
	edge = 24,
	top = 48,          -- Roblox-Topbar
	bottomMobile = 72, -- Sprungknopf und Bewegungsstick
}

--[[
	Skalierung: 1920x1080 ist die Referenz (Faktor 1.0), gedeckelt bei 1.25.

	Die Untergrenze ist 0.92 und NICHT 0.72. Grund, nachgerechnet: die
	kleinste Stufe der Schriftskala ist 12 px. Unter etwa 11 px ist Text
	auf einem Handy nicht mehr zuverlaessig lesbar. 11 / 12 = 0.917, also
	0.92. Bei 0.72 waere dieselbe Stufe 8.6 px gross - das waere zwar
	regelkonform, aber unlesbar, und die Abnahmebedingung "UI lesbar auf
	375x667" waere verletzt. Der Wert ist damit aus der Lesbarkeits-
	schwelle hergeleitet statt gesetzt; tools/layout_check.py prueft ihn.

	Nebeneffekt: die noetige Entwurfsgroesse fuer eine Tippflaeche sinkt
	von 44/0.72 = 62 px auf 44/0.92 = 48 px - genau Theme.Size.iconButton.
]]
Theme.ScaleRule = {
	referenceWidth = 1920,
	referenceHeight = 1080,
	min = 0.92,
	max = 1.25,
}

-- ==========================================================================
-- 7. EBENEN  (feste ZIndex-Baender, keine ad-hoc Zahlen)
-- ==========================================================================

Theme.Layer = {
	world = 0,
	hud = 100,
	panel = 200,
	modal = 300,
	toast = 400,
	tooltip = 500,
}

-- Innerhalb eines Bandes: Hintergrund, Inhalt, darueberliegendes Element.
Theme.Depth = {
	behind = -1,
	base = 0,
	content = 2,
	raised = 4,
	overlay = 6,
}

-- ==========================================================================
-- 8. BEWEGUNG
-- ==========================================================================

Theme.Duration = {
	fast = 0.12,
	base = 0.18,
	slow = 0.32,
	press = 0.06,
	countUp = 0.32,
	shake = 0.18,
	spin = 0.9,
	shine = 1.6,
	pulse = 1.1,
}

Theme.Easing = {
	-- Eingaenge bremsen aus, Ausgaenge ziehen an, Erfolge federn leicht.
	enter = { style = Enum.EasingStyle.Quart, direction = Enum.EasingDirection.Out },
	exit = { style = Enum.EasingStyle.Quart, direction = Enum.EasingDirection.In },
	pop = { style = Enum.EasingStyle.Back, direction = Enum.EasingDirection.Out },
	press = { style = Enum.EasingStyle.Quart, direction = Enum.EasingDirection.Out },
}

Theme.Scale = {
	hover = 1.03,
	pressed = 0.96,
	panelEnter = 0.92,
	rest = 1,
}

-- Vom Einstellungsmenue gesetzt. Bei true werden alle Dauern zu 0 –
-- das Layout bleibt identisch, nur die Interpolation entfaellt.
Theme.reduceMotion = false

function Theme.duration(seconds: number): number
	return if Theme.reduceMotion then 0 else seconds
end

--[[
	Einziger Ort im Projekt, an dem ein TweenInfo entsteht.
	`easing` ist einer der Schluessel aus Theme.Easing.
]]
function Theme.tweenInfo(seconds: number, easing: string?): TweenInfo
	local preset = (Theme.Easing :: { [string]: { style: Enum.EasingStyle, direction: Enum.EasingDirection } })[easing or "enter"]
	return TweenInfo.new(
		Theme.duration(seconds),
		preset.style,
		preset.direction
	)
end

-- Endlos laufende Bewegung (Ladeanzeige, Glanzstreifen). Bei reduzierter
-- Bewegung liefert diese Funktion nil - der Aufrufer laesst die Animation
-- dann einfach weg, statt mit Dauer 0 endlos schnell zu drehen.
function Theme.loopInfo(seconds: number, reverses: boolean?): TweenInfo?
	if Theme.reduceMotion then
		return nil
	end
	return TweenInfo.new(
		seconds,
		Enum.EasingStyle.Linear,
		Enum.EasingDirection.InOut,
		-1,
		reverses == true
	)
end

-- ==========================================================================
-- 9. MATERIALIEN  (Weltobjekte beziehen ihr Material ebenfalls von hier)
-- ==========================================================================

Theme.Material = {
	surface = Enum.Material.SmoothPlastic,
	metal = Enum.Material.Metal,
	brushed = Enum.Material.DiamondPlate,
	concrete = Enum.Material.Concrete,
	rock = Enum.Material.Slate,
	wood = Enum.Material.WoodPlanks,
	glass = Enum.Material.Glass,
	neon = Enum.Material.Neon,
	force = Enum.Material.ForceField,
	marble = Enum.Material.Marble,
}

-- Reflectance bleibt bewusst niedrig: hohe Werte lassen Roblox-Teile
-- nass statt metallisch aussehen.
Theme.Reflectance = {
	none = 0,
	subtle = 0.06,
	metal = 0.12,
	max = 0.15,
}

-- ==========================================================================
-- 10. BAUSTEINE
-- ==========================================================================

function Theme.corner(parent: Instance, radius: number): UICorner
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, radius)
	corner.Parent = parent
	return corner
end

function Theme.stroke(parent: Instance, color: Color3, thickness: number): UIStroke
	local stroke = Instance.new("UIStroke")
	stroke.Color = color
	stroke.Thickness = thickness
	stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	stroke.LineJoinMode = Enum.LineJoinMode.Round
	stroke.Parent = parent
	return stroke
end

-- Kontur fuer Text. Pflicht vor bunten Flaechen.
function Theme.textStroke(label: Instance): UIStroke
	local stroke = Instance.new("UIStroke")
	stroke.Color = C.bg0
	stroke.Thickness = Theme.TextStroke.thickness
	stroke.Transparency = Theme.TextStroke.transparency
	stroke.LineJoinMode = Enum.LineJoinMode.Round
	stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual
	stroke.Parent = label
	return stroke
end

export type PaddingSpec = { top: number?, bottom: number?, left: number?, right: number?, all: number? }

function Theme.padding(parent: Instance, spec: PaddingSpec): UIPadding
	local padding = Instance.new("UIPadding")
	local all = spec.all
	padding.PaddingTop = UDim.new(0, spec.top or all or 0)
	padding.PaddingBottom = UDim.new(0, spec.bottom or all or 0)
	padding.PaddingLeft = UDim.new(0, spec.left or all or 0)
	padding.PaddingRight = UDim.new(0, spec.right or all or 0)
	padding.Parent = parent
	return padding
end

--[[
	Vertikaler Verlauf fuer plastische Anmutung: oben heller, unten dunkler.
	`strength` ist der Helligkeitsversatz an beiden Enden (0.06 = +-6 %).
]]
function Theme.gradient(parent: Instance, base: Color3, strength: number, rotation: number?): UIGradient
	local gradient = Instance.new("UIGradient")
	local white = Color3.new(1, 1, 1)
	local black = Color3.new(0, 0, 0)
	gradient.Color = ColorSequence.new({
		ColorSequenceKeypoint.new(0, base:Lerp(white, strength)),
		ColorSequenceKeypoint.new(1, base:Lerp(black, strength)),
	})
	gradient.Rotation = rotation or 90
	gradient.Parent = parent
	return gradient
end

--[[
	Schattenschicht hinter einer Flaeche.
	Mit Asset-Id: 9-Slice-ImageLabel. Ohne: assetfreie Ersatzflaeche.
]]
function Theme.shadow(parent: GuiObject, radius: number): GuiObject
	local spread = Theme.Elevation.spread
	local offset = Theme.Elevation.offset

	if Theme.Asset.SHADOW_9SLICE ~= "" then
		local image = Instance.new("ImageLabel")
		image.Name = "Shadow"
		image.BackgroundTransparency = Theme.Alpha.hidden
		image.Image = Theme.Asset.SHADOW_9SLICE
		image.ImageColor3 = C.bg0
		image.ImageTransparency = Theme.Elevation.transparency
		image.ScaleType = Enum.ScaleType.Slice
		image.SliceCenter = Theme.Asset.SLICE_CENTER
		image.Size = UDim2.new(1, spread * 2, 1, spread * 2)
		image.Position = UDim2.new(0, -spread, 0, -spread + offset)
		image.ZIndex = parent.ZIndex + Theme.Depth.behind
		image.Parent = parent
		return image
	end

	local fallback = Instance.new("Frame")
	fallback.Name = "Shadow"
	fallback.BackgroundColor3 = C.bg0
	fallback.BackgroundTransparency = Theme.Elevation.transparency
	fallback.BorderSizePixel = 0
	fallback.Size = UDim2.new(1, Theme.Space.x4, 1, Theme.Space.x4)
	fallback.Position = UDim2.new(0, -Theme.Space.x2, 0, -Theme.Space.x2 + offset)
	fallback.ZIndex = parent.ZIndex + Theme.Depth.behind
	fallback.Parent = parent
	Theme.corner(fallback, radius + Theme.Space.x2)
	return fallback
end

export type CardProps = {
	name: string?,
	parent: Instance?,
	size: UDim2?,
	position: UDim2?,
	anchor: Vector2?,
	fill: Color3?,
	radius: number?,
	zIndex: number?,
	shadow: boolean?,
	gradient: boolean?,
	strokeColor: Color3?,
	padding: number?,
	visible: boolean?,
}

--[[
	Die Karte: Schatten, Flaeche, Radius, Rand, optionaler Verlauf.
	Alles, was im Spiel wie eine Flaeche aussieht, kommt hier durch – es
	gibt keine zweite Stelle, die diese vier Schichten zusammenbaut.
]]
function Theme.Card(props: CardProps): Frame
	local fill = props.fill or C.bg2
	local radius = props.radius or Theme.Radius.card
	local zIndex = props.zIndex or Theme.Layer.hud

	local card = Instance.new("Frame")
	card.Name = props.name or "Card"
	card.Size = props.size or UDim2.fromScale(1, 1)
	card.Position = props.position or UDim2.fromScale(0, 0)
	card.AnchorPoint = props.anchor or Vector2.zero
	card.BackgroundColor3 = fill
	card.BackgroundTransparency = Theme.Alpha.opaque
	card.BorderSizePixel = 0
	card.ZIndex = zIndex
	card.Visible = if props.visible == nil then true else props.visible
	card.Parent = props.parent

	if props.shadow ~= false then
		Theme.shadow(card, radius)
	end
	Theme.corner(card, radius)
	-- Rand: eine Stufe heller als die Flaeche, damit die Kante liest.
	Theme.stroke(card, props.strokeColor or C.bg3, Theme.Stroke.hair)
	if props.gradient ~= false then
		Theme.gradient(card, fill, Theme.Elevation.transparency / Theme.Space.x8)
	end
	if props.padding ~= nil then
		Theme.padding(card, { all = props.padding })
	end
	return card
end

-- Trennlinie zwischen Gruppen.
function Theme.divider(parent: Instance, order: number): Frame
	local line = Instance.new("Frame")
	line.Name = "Divider"
	line.Size = UDim2.new(1, 0, 0, Theme.Size.dividerHeight)
	line.BackgroundColor3 = C.bg3
	line.BackgroundTransparency = Theme.Alpha.divider
	line.BorderSizePixel = 0
	line.LayoutOrder = order
	line.ZIndex = Theme.Depth.base
	line.Parent = parent
	return line
end

export type LabelProps = {
	name: string?,
	parent: Instance?,
	text: string?,
	role: FontRole?,
	size: number?,
	color: Color3?,
	layoutSize: UDim2?,
	position: UDim2?,
	anchor: Vector2?,
	xAlign: Enum.TextXAlignment?,
	yAlign: Enum.TextYAlignment?,
	wrapped: boolean?,
	zIndex: number?,
	stroke: boolean?,
	lineHeight: number?,
	autoSize: Enum.AutomaticSize?,
	layoutOrder: number?,
}

function Theme.label(props: LabelProps): TextLabel
	local role: FontRole = props.role or "body"
	local label = Instance.new("TextLabel")
	label.Name = props.name or "Label"
	label.Size = props.layoutSize or UDim2.fromScale(1, 1)
	label.Position = props.position or UDim2.fromScale(0, 0)
	label.AnchorPoint = props.anchor or Vector2.zero
	label.BackgroundTransparency = Theme.Alpha.hidden
	label.Text = props.text or ""
	label.Font = (Theme.Font :: { [string]: Enum.Font })[role]
	label.TextSize = props.size or Theme.TextSize.md
	label.TextColor3 = props.color or C.textHigh
	label.TextXAlignment = props.xAlign or Enum.TextXAlignment.Left
	label.TextYAlignment = props.yAlign or Enum.TextYAlignment.Center
	label.TextWrapped = props.wrapped == true
	label.LineHeight = props.lineHeight or Theme.LineHeight.normal
	label.ZIndex = props.zIndex or Theme.Depth.content
	label.AutomaticSize = props.autoSize or Enum.AutomaticSize.None
	label.LayoutOrder = props.layoutOrder or 0
	label.Parent = props.parent
	if props.stroke ~= false then
		Theme.textStroke(label)
	end
	return label
end

export type ListProps = {
	parent: Instance,
	gap: number,
	direction: Enum.FillDirection?,
	hAlign: Enum.HorizontalAlignment?,
	vAlign: Enum.VerticalAlignment?,
	wraps: boolean?,
}

function Theme.list(props: ListProps): UIListLayout
	local layout = Instance.new("UIListLayout")
	layout.Padding = UDim.new(0, props.gap)
	layout.FillDirection = props.direction or Enum.FillDirection.Vertical
	layout.HorizontalAlignment = props.hAlign or Enum.HorizontalAlignment.Left
	layout.VerticalAlignment = props.vAlign or Enum.VerticalAlignment.Top
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.Wraps = props.wraps == true
	layout.Parent = props.parent
	return layout
end

return Theme
