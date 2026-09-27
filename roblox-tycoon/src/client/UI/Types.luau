--!strict
--[[
	Types – gemeinsamer Vertrag aller UI-Komponenten.

	Jede Komponente liefert `instance` (zum Einhaengen ins Layout) und
	`destroy` (zum Aufraeumen von Tweens, Verbindungen und Instanz).
	Ohne diesen Vertrag muesste jeder Bildschirm wissen, wie er welche
	Komponente aufzuraeumen hat.
]]

export type Component = {
	instance: GuiObject,
	destroy: (() -> ()),
}

export type ButtonState = "idle" | "hover" | "pressed" | "disabled" | "loading"

return {}
