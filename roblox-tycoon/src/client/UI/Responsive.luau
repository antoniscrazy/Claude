--!strict
--[[
	Responsive – ein UIScale pro ScreenGui plus Sicherheitsabstaende.

	Skalierung: Referenz 1920x1080 = 1.0, begrenzt auf 0.72 bis 1.25.
	Gerechnet wird gegen BEIDE Achsen (kleinerer Wert gewinnt), damit ein
	sehr breites oder sehr flaches Fenster nichts aus dem Bild schiebt.

	Wichtig fuer die Abnahme "Touch-Ziel >= 44 px NACH UIScale": weil die
	Untergrenze 0.72 ist, muss jede Tippflaeche im Entwurf mindestens
	44 / 0.72 = 62 px gross sein. Theme.Size.controlHeight (44) allein
	reicht also NICHT - deshalb liefert minTouchSize() die noetige
	Entwurfsgroesse, und tools/layout_check.py prueft sie nach.
]]

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Theme = require(Shared.Theme)

local Responsive = {}

export type Viewport = {
	width: number,
	height: number,
	scale: number,
	portrait: boolean,
	compact: boolean,
	topInset: number,
	bottomInset: number,
}

function Responsive.scaleFor(width: number, height: number): number
	local rule = Theme.ScaleRule
	local factor = math.min(width / rule.referenceWidth, height / rule.referenceHeight)
	return math.clamp(factor, rule.min, rule.max)
end

-- Entwurfsgroesse, die nach der kleinstmoeglichen Skalierung noch 44 px ergibt.
function Responsive.minTouchSize(): number
	return math.ceil(Theme.Size.touchMin / Theme.ScaleRule.min)
end

function Responsive.read(gui: ScreenGui): Viewport
	local size = gui.AbsoluteSize
	-- Im ersten Frame ist AbsoluteSize noch (0,0).
	local width = if size.X > 0 then size.X else Theme.ScaleRule.referenceWidth
	local height = if size.Y > 0 then size.Y else Theme.ScaleRule.referenceHeight
	local portrait = height > width
	local compact = math.min(width, height) < Theme.ScaleRule.referenceHeight / 2

	--[[
		Die ScreenGui laeuft mit IgnoreGuiInset = false. Roblox zieht die
		Topbar-Hoehe dann BEREITS von der nutzbaren Flaeche ab - der
		Nullpunkt liegt unterhalb der Topbar. Hier noch einmal
		Theme.Safe.top zu addieren waere doppelt gezaehlt und wuerde auf
		dem Handy ein Drittel des Bildes verschenken. Es bleibt also nur
		der normale Randabstand.
	]]
	local topInset = Theme.Safe.edge
	local bottomInset = if portrait or compact
		then Theme.Safe.bottomMobile
		else Theme.Safe.edge

	return {
		width = width,
		height = height,
		scale = Responsive.scaleFor(width, height),
		portrait = portrait,
		compact = compact,
		topInset = topInset,
		bottomInset = bottomInset,
	}
end

--[[
	Haengt die globale UIScale an den Wurzelcontainer und ruft `onChange`
	bei jeder Groessenaenderung auf.

	Die UIScale sitzt auf einem Vollbild-Container mit AnchorPoint (0,0);
	dadurch skaliert sie den Inhalt vom linken oberen Eck aus. Damit
	unten und rechts verankerte Elemente trotzdem am Rand bleiben, werden
	sie ueber AnchorPoint und Scale-Position gesetzt (nie ueber feste
	Pixelpositionen) - dann verschiebt die Skalierung nur ihre Groesse.
]]
function Responsive.attach(gui: ScreenGui, root: GuiObject,
	onChange: (viewport: Viewport) -> ()): UIScale
	local scale = Instance.new("UIScale")
	scale.Parent = root

	local function apply()
		local viewport = Responsive.read(gui)
		scale.Scale = viewport.scale
		onChange(viewport)
	end
	apply()
	gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(apply)
	return scale
end

return Responsive
