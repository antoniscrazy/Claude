--!strict
--[[
	UIKit – Bausteine fuer die gesamte Oberflaeche.

	Die UI wird vollstaendig im Code gebaut, ohne importierte Assets.
	Dieses Modul buendelt die wiederkehrenden Handgriffe (Ecken, Rahmen,
	Abstaende, Tweens) und vor allem die RESPONSIVE-Logik.

	Zur Responsivitaet: es gibt genau zwei Mechanismen, und beide haengen
	an der Viewport-Groesse, nicht an einer Geraeteerkennung.

	  * UIScale auf dem Wurzelcontainer skaliert HUD und Knoepfe. Der
	    Faktor wird fuer Hoch- und Querformat getrennt berechnet, weil ein
	    gemeinsamer Faktor entweder auf dem Handy winzig oder auf dem
	    Desktop riesig ausfaellt.
	  * UIAspectRatioConstraint auf Panels haelt deren Form stabil, damit
	    ein Dialog im Hochformat nicht zum Streifen wird. Auch das
	    Seitenverhaeltnis wird je nach Orientierung umgeschaltet.

	Geprueft gegen 1920x1080 (Desktop), 1024x768 (Tablet) und 375x667
	(Handy Hochformat) - die Zahlen unten sind auf diese drei Faelle
	eingestellt.
]]

local TweenService = game:GetService("TweenService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)

local UIKit = {}

UIKit.C = Config.COLORS

export type FrameProps = {
	name: string?,
	parent: Instance?,
	size: UDim2?,
	position: UDim2?,
	anchor: Vector2?,
	color: Color3?,
	transparency: number?,
	zIndex: number?,
	visible: boolean?,
	clips: boolean?,
}

export type TextProps = {
	name: string?,
	parent: Instance?,
	size: UDim2?,
	position: UDim2?,
	anchor: Vector2?,
	text: string?,
	textColor: Color3?,
	font: Enum.Font?,
	textSize: number?,
	scaled: boolean?,
	xAlign: Enum.TextXAlignment?,
	yAlign: Enum.TextYAlignment?,
	wrapped: boolean?,
	background: Color3?,
	transparency: number?,
	zIndex: number?,
	autoSize: Enum.AutomaticSize?,
}

-- ==========================================================================
-- Kleinteile
-- ==========================================================================

function UIKit.corner(parent: Instance, radius: number): UICorner
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, radius)
	corner.Parent = parent
	return corner
end

function UIKit.stroke(parent: Instance, color: Color3, thickness: number): UIStroke
	local stroke = Instance.new("UIStroke")
	stroke.Color = color
	stroke.Thickness = thickness
	stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	stroke.Parent = parent
	return stroke
end

function UIKit.padding(parent: Instance, all: number): UIPadding
	local padding = Instance.new("UIPadding")
	padding.PaddingTop = UDim.new(0, all)
	padding.PaddingBottom = UDim.new(0, all)
	padding.PaddingLeft = UDim.new(0, all)
	padding.PaddingRight = UDim.new(0, all)
	padding.Parent = parent
	return padding
end

function UIKit.list(
	parent: Instance, gap: number,
	direction: Enum.FillDirection?, align: Enum.HorizontalAlignment?
): UIListLayout
	local layout = Instance.new("UIListLayout")
	layout.Padding = UDim.new(0, gap)
	layout.FillDirection = direction or Enum.FillDirection.Vertical
	layout.HorizontalAlignment = align or Enum.HorizontalAlignment.Center
	layout.VerticalAlignment = Enum.VerticalAlignment.Top
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.Parent = parent
	return layout
end

-- ==========================================================================
-- Container
-- ==========================================================================

function UIKit.frame(props: FrameProps): Frame
	local frame = Instance.new("Frame")
	frame.Name = props.name or "Frame"
	frame.Size = props.size or UDim2.fromScale(1, 1)
	frame.Position = props.position or UDim2.fromScale(0, 0)
	frame.AnchorPoint = props.anchor or Vector2.zero
	frame.BackgroundColor3 = props.color or UIKit.C.PANEL
	frame.BackgroundTransparency = props.transparency or 0
	frame.BorderSizePixel = 0
	frame.ZIndex = props.zIndex or 1
	frame.Visible = if props.visible == nil then true else props.visible
	frame.ClipsDescendants = props.clips == true
	frame.Parent = props.parent
	return frame
end

function UIKit.label(props: TextProps): TextLabel
	local label = Instance.new("TextLabel")
	label.Name = props.name or "Label"
	label.Size = props.size or UDim2.fromScale(1, 1)
	label.Position = props.position or UDim2.fromScale(0, 0)
	label.AnchorPoint = props.anchor or Vector2.zero
	label.Text = props.text or ""
	label.TextColor3 = props.textColor or UIKit.C.TEXT
	label.Font = props.font or Enum.Font.GothamMedium
	label.TextScaled = props.scaled == true
	if not label.TextScaled then
		label.TextSize = props.textSize or 16
	end
	label.TextXAlignment = props.xAlign or Enum.TextXAlignment.Center
	label.TextYAlignment = props.yAlign or Enum.TextYAlignment.Center
	label.TextWrapped = props.wrapped == true
	label.BackgroundColor3 = props.background or UIKit.C.PANEL
	label.BackgroundTransparency = props.transparency or 1
	label.BorderSizePixel = 0
	label.ZIndex = props.zIndex or 1
	label.AutomaticSize = props.autoSize or Enum.AutomaticSize.None
	label.Parent = props.parent
	return label
end

--[[
	Knopf mit Hover- und Druck-Rueckmeldung.
	Die Groessenaenderung laeuft ueber eine UIScale statt ueber Size, weil
	Size in einem UIListLayout das komplette Layout neu anstossen wuerde -
	auf dem Handy ein sichtbares Ruckeln bei jeder Beruehrung.
]]
function UIKit.button(props: TextProps): (TextButton, UIStroke)
	local button = Instance.new("TextButton")
	button.Name = props.name or "Button"
	button.Size = props.size or UDim2.fromScale(1, 1)
	button.Position = props.position or UDim2.fromScale(0, 0)
	button.AnchorPoint = props.anchor or Vector2.zero
	button.Text = props.text or ""
	button.TextColor3 = props.textColor or UIKit.C.TEXT
	button.Font = props.font or Enum.Font.GothamBold
	button.TextScaled = props.scaled == true
	if not button.TextScaled then
		button.TextSize = props.textSize or 16
	end
	button.BackgroundColor3 = props.background or UIKit.C.PANEL_LIGHT
	button.BackgroundTransparency = props.transparency or 0
	button.BorderSizePixel = 0
	button.AutoButtonColor = false
	button.ZIndex = props.zIndex or 1
	button.Parent = props.parent

	UIKit.corner(button, 10)
	local stroke = UIKit.stroke(button, UIKit.C.PANEL_LIGHT, 2)

	local scale = Instance.new("UIScale")
	scale.Parent = button

	local baseColor = button.BackgroundColor3
	button.MouseEnter:Connect(function()
		UIKit.tween(button, { BackgroundColor3 = baseColor:Lerp(Color3.new(1, 1, 1), 0.12) }, 0.12)
		UIKit.tween(scale, { Scale = 1.03 }, 0.12)
	end)
	button.MouseLeave:Connect(function()
		UIKit.tween(button, { BackgroundColor3 = baseColor }, 0.12)
		UIKit.tween(scale, { Scale = 1 }, 0.12)
	end)
	button.MouseButton1Down:Connect(function()
		UIKit.tween(scale, { Scale = 0.96 }, 0.08)
	end)
	button.MouseButton1Up:Connect(function()
		UIKit.tween(scale, { Scale = 1 }, 0.1)
	end)

	return button, stroke
end

function UIKit.scroll(props: FrameProps): ScrollingFrame
	local scroll = Instance.new("ScrollingFrame")
	scroll.Name = props.name or "Scroll"
	scroll.Size = props.size or UDim2.fromScale(1, 1)
	scroll.Position = props.position or UDim2.fromScale(0, 0)
	scroll.AnchorPoint = props.anchor or Vector2.zero
	scroll.BackgroundTransparency = 1
	scroll.BorderSizePixel = 0
	scroll.ScrollBarThickness = 5
	scroll.ScrollBarImageColor3 = UIKit.C.TEXT_DIM
	scroll.CanvasSize = UDim2.new()
	scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
	scroll.ScrollingDirection = Enum.ScrollingDirection.Y
	scroll.ZIndex = props.zIndex or 1
	scroll.Parent = props.parent
	return scroll
end

-- ==========================================================================
-- Animation
-- ==========================================================================

function UIKit.tween(instance: Instance, goal: { [string]: any }, duration: number, style: Enum.EasingStyle?): Tween
	local info = TweenInfo.new(
		duration,
		style or Enum.EasingStyle.Quad,
		Enum.EasingDirection.Out
	)
	local tween = TweenService:Create(instance, info, goal)
	tween:Play()
	return tween
end

-- ==========================================================================
-- Responsive
-- ==========================================================================

export type Viewport = { width: number, height: number, portrait: boolean, compact: boolean }

function UIKit.viewportOf(gui: ScreenGui): Viewport
	local size = gui.AbsoluteSize
	-- Beim allerersten Frame ist AbsoluteSize noch 0; dann mit einem
	-- Desktop-Standard rechnen statt durch null zu teilen.
	local width = if size.X > 0 then size.X else 1280
	local height = if size.Y > 0 then size.Y else 720
	return {
		width = width,
		height = height,
		portrait = height > width,
		compact = math.min(width, height) < 500,
	}
end

--[[
	Berechnet den UI-Skalierungsfaktor.
	Hochformat rechnet gegen die BREITE (die ist auf dem Handy der Engpass),
	Querformat gegen beide Achsen. Die Grenzen verhindern, dass die UI auf
	einem 4K-Monitor plakativ oder auf einem kleinen Handy unlesbar wird.
]]
function UIKit.scaleFor(viewport: Viewport): number
	if viewport.portrait then
		return math.clamp(viewport.width / 420, 0.72, 1.15)
	end
	if viewport.compact then
		-- Handy im Querformat: die kurze Kante ist winzig, die lange nicht.
		-- Gegen die Hoehe zu rechnen (wie unten) ergaebe den Mindestwert
		-- 0.78 und damit Tippflaechen unter 30 px. Also an der langen
		-- Kante bemessen, wie im Hochformat an der Breite.
		return math.clamp(viewport.width / 760, 0.78, 1.15)
	end
	return math.clamp(math.min(viewport.width / 1280, viewport.height / 720), 0.78, 1.15)
end

--[[
	Haengt eine UIScale an EINEN Widget-Container und haelt sie aktuell.

	Bewusst nicht an den bildschirmfuellenden Wurzelcontainer: eine UIScale
	skaliert das Element, an dem sie haengt, um dessen AnchorPoint. Auf
	einem Root mit Size (1,1) und AnchorPoint (0,0) wuerde dadurch die
	gesamte Oberflaeche auf z. B. 89 % der Bildschirmflaeche schrumpfen und
	oben links kleben - eine unten verankerte Leiste saesse dann bei 89 %
	der Hoehe statt am unteren Rand.

	Deshalb bekommt jeder Container mit eigenem Anker seine eigene UIScale.
	Panels brauchen keine: sie sind bereits ueber fromScale plus
	UISizeConstraint und UIAspectRatioConstraint an den Viewport gebunden
	(und ihre einzige UIScale gehoert der Oeffnen-Animation - zwei UIScale
	an einem Objekt vertragen sich nicht).
]]
function UIKit.attachScale(gui: ScreenGui, element: GuiObject): UIScale
	local scale = Instance.new("UIScale")
	scale.Parent = element
	local function apply()
		scale.Scale = UIKit.scaleFor(UIKit.viewportOf(gui))
	end
	apply()
	gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(apply)
	return scale
end

--[[
	Panel in Bildschirmmitte mit orientierungsabhaengigem Seitenverhaeltnis.
	Ohne die Umschaltung waere ein 1.45:1-Dialog im Hochformat nur noch
	gut 200 px hoch und die Liste darin unbrauchbar.
]]
function UIKit.centeredPanel(gui: ScreenGui, parent: Instance, name: string): Frame
	local panel = UIKit.frame({
		name = name, parent = parent,
		size = UDim2.fromScale(0.9, 0.84),
		position = UDim2.fromScale(0.5, 0.5),
		anchor = Vector2.new(0.5, 0.5),
		color = UIKit.C.PANEL,
		transparency = 0.02,
		visible = false,
		zIndex = 20,
	})
	UIKit.corner(panel, 16)
	UIKit.stroke(panel, UIKit.C.ACCENT, 2)

	local ratio = Instance.new("UIAspectRatioConstraint")
	ratio.AspectType = Enum.AspectType.FitWithinMaxSize
	ratio.DominantAxis = Enum.DominantAxis.Width
	ratio.Parent = panel

	local sizeLimit = Instance.new("UISizeConstraint")
	sizeLimit.MaxSize = Vector2.new(820, 620)
	sizeLimit.MinSize = Vector2.new(260, 240)
	sizeLimit.Parent = panel

	local function apply()
		local viewport = UIKit.viewportOf(gui)
		ratio.AspectRatio = if viewport.portrait then 0.78 else 1.45
	end
	apply()
	gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(apply)

	return panel
end

-- Ein- und Ausblenden mit kurzem Zoom. Gibt dem Panel ein Gefuehl von
-- Gewicht, ohne den Spieler warten zu lassen (0.16 s).
function UIKit.setPanelVisible(panel: Frame, visible: boolean)
	local existing = panel:FindFirstChildOfClass("UIScale")
	local uiScale: UIScale
	if existing ~= nil then
		uiScale = existing
	else
		uiScale = Instance.new("UIScale")
		uiScale.Parent = panel
	end
	if visible then
		panel.Visible = true
		uiScale.Scale = 0.9
		UIKit.tween(uiScale, { Scale = 1 }, 0.16, Enum.EasingStyle.Back)
		UIKit.tween(panel, { BackgroundTransparency = 0.02 }, 0.16)
	else
		local tween = UIKit.tween(uiScale, { Scale = 0.92 }, 0.12)
		tween.Completed:Once(function()
			panel.Visible = false
		end)
	end
end

return UIKit
