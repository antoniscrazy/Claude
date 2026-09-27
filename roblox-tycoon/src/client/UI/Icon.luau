--!strict
--[[
	Icon – Symbole ohne Emojis und ohne erfundene Asset-Ids.

	Zwei Betriebsarten, gesteuert ueber Theme.Icon:
	  * Steht dort eine Asset-Id, wird ein ImageLabel gebaut.
	  * Steht dort "" (Auslieferungszustand), zeichnet dieses Modul den
	    Glyph aus einfachen Frames - Kreise, Ringe, gedrehte Quadrate,
	    Balken. Das sieht absichtlich wie ein Icon-Set aus und nicht wie
	    ein fehlendes Bild, und es kommt ohne Upload aus.

	Der Wechsel kostet keine Codeaenderung: dieselbe Funktion, gleiche
	Groesse, gleiche Farbe.

	Die Glyphen halten sich an vier Grundformen, damit das Set einheitlich
	wirkt: Kreis, Ring, Raute, Balken. Mehr braucht keines der Symbole.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local Icon = {}

export type Name =
	"cash" | "gem" | "rebirth" | "shop" | "upgrade" | "quest" | "code"
	| "settings" | "lock" | "check" | "close" | "plus"
	| "drill" | "furnace" | "belt" | "scale"

-- ==========================================================================
-- Grundformen
-- ==========================================================================

type Ctx = { parent: Frame, color: Color3, zIndex: number }

local function shape(ctx: Ctx, sizeScale: Vector2, posScale: Vector2,
	radius: number, rotation: number?, transparency: number?): Frame
	local piece = Instance.new("Frame")
	piece.Size = UDim2.fromScale(sizeScale.X, sizeScale.Y)
	piece.Position = UDim2.fromScale(posScale.X, posScale.Y)
	piece.AnchorPoint = Vector2.new(0.5, 0.5)
	piece.BackgroundColor3 = ctx.color
	piece.BackgroundTransparency = transparency or Theme.Alpha.opaque
	piece.BorderSizePixel = 0
	piece.Rotation = rotation or 0
	piece.ZIndex = ctx.zIndex
	piece.Parent = ctx.parent
	Theme.corner(piece, radius)
	return piece
end

local function circle(ctx: Ctx, diameter: number, at: Vector2): Frame
	return shape(ctx, Vector2.new(diameter, diameter), at, Theme.Radius.pill)
end

-- Ring: Kreis plus ausgestanzte Mitte in Hintergrundfarbe.
local function ring(ctx: Ctx, outer: number, inner: number, at: Vector2)
	circle(ctx, outer, at)
	local hole = circle(ctx, inner, at)
	hole.BackgroundColor3 = Theme.Color.bg1
	hole.ZIndex = ctx.zIndex + Theme.Depth.content
	return hole
end

local function bar(ctx: Ctx, w: number, h: number, at: Vector2, rotation: number?): Frame
	return shape(ctx, Vector2.new(w, h), at, Theme.Radius.chip, rotation)
end

local function diamond(ctx: Ctx, size: number, at: Vector2): Frame
	return shape(ctx, Vector2.new(size, size), at, Theme.Radius.chip, 45)
end

-- ==========================================================================
-- Glyphen
-- ==========================================================================

local MID = Vector2.new(0.5, 0.5)

local GLYPHS: { [string]: (Ctx) -> () } = {
	-- Muenze: Ring mit gefuellter Mitte und Kerbe
	cash = function(ctx)
		circle(ctx, 0.92, MID)
		local inner = circle(ctx, 0.62, MID)
		inner.BackgroundColor3 = Theme.Color.bg1
		inner.ZIndex = ctx.zIndex + Theme.Depth.content
		local mark = bar(ctx, 0.14, 0.44, MID)
		mark.ZIndex = ctx.zIndex + Theme.Depth.raised
	end,

	-- Edelstein: grosse Raute mit heller Facette
	gem = function(ctx)
		diamond(ctx, 0.72, MID)
		local facet = diamond(ctx, 0.3, Vector2.new(0.4, 0.4))
		facet.BackgroundColor3 = Theme.Color.textHigh
		facet.BackgroundTransparency = Theme.Alpha.veil
		facet.ZIndex = ctx.zIndex + Theme.Depth.content
	end,

	-- Kreisender Pfeil: Ring mit Luecke plus Spitze
	rebirth = function(ctx)
		ring(ctx, 0.92, 0.56, MID)
		local gap = bar(ctx, 0.34, 0.34, Vector2.new(0.78, 0.26))
		gap.BackgroundColor3 = Theme.Color.bg1
		gap.ZIndex = ctx.zIndex + Theme.Depth.raised
		local tip = diamond(ctx, 0.3, Vector2.new(0.76, 0.2))
		tip.ZIndex = ctx.zIndex + Theme.Depth.overlay
	end,

	-- Einkaufstasche: Koerper plus Henkel
	shop = function(ctx)
		shape(ctx, Vector2.new(0.78, 0.6), Vector2.new(0.5, 0.64), Theme.Radius.chip)
		ring(ctx, 0.46, 0.3, Vector2.new(0.5, 0.3))
		local cut = shape(ctx, Vector2.new(0.5, 0.26), Vector2.new(0.5, 0.46), Theme.Radius.chip)
		cut.BackgroundColor3 = Theme.Color.bg1
		cut.ZIndex = ctx.zIndex + Theme.Depth.content
	end,

	-- Pfeil nach oben im Ring
	upgrade = function(ctx)
		ring(ctx, 0.96, 0.7, MID)
		local stem = bar(ctx, 0.12, 0.4, Vector2.new(0.5, 0.54))
		stem.ZIndex = ctx.zIndex + Theme.Depth.raised
		local a = bar(ctx, 0.1, 0.3, Vector2.new(0.4, 0.4), 45)
		a.ZIndex = ctx.zIndex + Theme.Depth.raised
		local b = bar(ctx, 0.1, 0.3, Vector2.new(0.6, 0.4), -45)
		b.ZIndex = ctx.zIndex + Theme.Depth.raised
	end,

	-- Aufgabenliste: drei Zeilen, eine abgehakt
	quest = function(ctx)
		for index = 0, 2 do
			bar(ctx, 0.52, 0.1, Vector2.new(0.58, 0.24 + index * 0.26))
			local dot = circle(ctx, 0.16, Vector2.new(0.2, 0.24 + index * 0.26))
			dot.BackgroundTransparency = if index == 0
				then Theme.Alpha.opaque
				else Theme.Alpha.veil
		end
	end,

	-- Geschenk: Kasten plus Band
	code = function(ctx)
		shape(ctx, Vector2.new(0.86, 0.6), Vector2.new(0.5, 0.64), Theme.Radius.chip)
		shape(ctx, Vector2.new(0.94, 0.2), Vector2.new(0.5, 0.32), Theme.Radius.chip)
		local ribbon = bar(ctx, 0.14, 0.86, MID)
		ribbon.BackgroundColor3 = Theme.Color.bg1
		ribbon.ZIndex = ctx.zIndex + Theme.Depth.content
	end,

	-- Zahnrad: Ring plus vier Zaehne
	settings = function(ctx)
		for index = 0, 3 do
			bar(ctx, 0.2, 0.96, MID, index * 45)
		end
		ring(ctx, 0.72, 0.34, MID)
	end,

	-- Vorhaengeschloss
	lock = function(ctx)
		ring(ctx, 0.56, 0.32, Vector2.new(0.5, 0.32))
		local cut = shape(ctx, Vector2.new(0.6, 0.24), Vector2.new(0.5, 0.48), Theme.Radius.chip)
		cut.BackgroundColor3 = Theme.Color.bg1
		cut.ZIndex = ctx.zIndex + Theme.Depth.content
		local body = shape(ctx, Vector2.new(0.82, 0.5), Vector2.new(0.5, 0.7), Theme.Radius.chip)
		body.ZIndex = ctx.zIndex + Theme.Depth.raised
	end,

	check = function(ctx)
		bar(ctx, 0.12, 0.42, Vector2.new(0.34, 0.6), 45)
		bar(ctx, 0.12, 0.76, Vector2.new(0.6, 0.46), -45)
	end,

	close = function(ctx)
		bar(ctx, 0.14, 0.86, MID, 45)
		bar(ctx, 0.14, 0.86, MID, -45)
	end,

	plus = function(ctx)
		bar(ctx, 0.16, 0.8, MID)
		bar(ctx, 0.8, 0.16, MID)
	end,

	-- Bohrer: Schaft plus Spitze
	drill = function(ctx)
		shape(ctx, Vector2.new(0.36, 0.5), Vector2.new(0.5, 0.3), Theme.Radius.chip)
		diamond(ctx, 0.42, Vector2.new(0.5, 0.72))
		bar(ctx, 0.62, 0.12, Vector2.new(0.5, 0.16))
	end,

	-- Schmelzofen: Korpus plus gluehende Oeffnung
	furnace = function(ctx)
		shape(ctx, Vector2.new(0.82, 0.74), Vector2.new(0.5, 0.58), Theme.Radius.chip)
		local mouth = shape(ctx, Vector2.new(0.42, 0.3), Vector2.new(0.5, 0.66), Theme.Radius.chip)
		mouth.BackgroundColor3 = Theme.Color.bg1
		mouth.ZIndex = ctx.zIndex + Theme.Depth.content
		bar(ctx, 0.5, 0.12, Vector2.new(0.5, 0.14))
	end,

	-- Foerderband: Laufflaeche plus zwei Rollen
	belt = function(ctx)
		shape(ctx, Vector2.new(0.94, 0.26), MID, Theme.Radius.pill)
		local left = circle(ctx, 0.3, Vector2.new(0.22, 0.5))
		left.BackgroundColor3 = Theme.Color.bg1
		left.ZIndex = ctx.zIndex + Theme.Depth.content
		local right = circle(ctx, 0.3, Vector2.new(0.78, 0.5))
		right.BackgroundColor3 = Theme.Color.bg1
		right.ZIndex = ctx.zIndex + Theme.Depth.content
	end,

	-- Waage: Balken, Saeule, zwei Schalen
	scale = function(ctx)
		bar(ctx, 0.9, 0.12, Vector2.new(0.5, 0.3))
		bar(ctx, 0.12, 0.62, Vector2.new(0.5, 0.58))
		bar(ctx, 0.56, 0.12, Vector2.new(0.5, 0.88))
		circle(ctx, 0.22, Vector2.new(0.16, 0.48))
		circle(ctx, 0.22, Vector2.new(0.84, 0.48))
	end,
}

-- ==========================================================================
-- Oeffentlich
-- ==========================================================================

export type IconProps = {
	name: Name,
	parent: Instance?,
	size: number,
	color: Color3,
	zIndex: number,
	layoutOrder: number?,
	anchor: Vector2?,
	position: UDim2?,
}

function Icon.create(props: IconProps): Frame
	local holder = Instance.new("Frame")
	holder.Name = "Icon_" .. props.name
	holder.Size = UDim2.fromOffset(props.size, props.size)
	holder.Position = props.position or UDim2.fromScale(0, 0)
	holder.AnchorPoint = props.anchor or Vector2.zero
	holder.BackgroundTransparency = Theme.Alpha.hidden
	holder.ZIndex = props.zIndex
	holder.LayoutOrder = props.layoutOrder or 0
	holder.Parent = props.parent

	local assetId = (Theme.Icon :: { [string]: string })[props.name]
	if assetId ~= nil and assetId ~= "" then
		local image = Instance.new("ImageLabel")
		image.Size = UDim2.fromScale(1, 1)
		image.BackgroundTransparency = Theme.Alpha.hidden
		image.Image = assetId
		image.ImageColor3 = props.color
		image.ZIndex = props.zIndex
		image.Parent = holder
		return holder
	end

	local draw = GLYPHS[props.name]
	if draw ~= nil then
		draw({ parent = holder, color = props.color, zIndex = props.zIndex })
	end
	return holder
end

-- Faerbt einen bereits gezeichneten Glyph um (z. B. bei Zustandswechsel).
function Icon.recolor(holder: Frame, color: Color3)
	for _, child in ipairs(holder:GetDescendants()) do
		if child:IsA("ImageLabel") then
			child.ImageColor3 = color
		elseif child:IsA("Frame") and child.BackgroundColor3 ~= Theme.Color.bg1 then
			child.BackgroundColor3 = color
		end
	end
end

return Icon
