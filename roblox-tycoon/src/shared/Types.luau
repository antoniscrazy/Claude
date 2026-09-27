--!strict
--[[
	Types – zentrale Typdefinitionen.

	Dieses Modul enthaelt absichtlich KEINE Laufzeitlogik. Es exportiert nur
	Typen, damit Server, Client und Config gegen dieselben Vertraege arbeiten
	und der Luau-Typechecker Fehler an der Grenze zwischen den Schichten
	findet, statt erst zur Laufzeit.
]]

export type UpgradeKind = "dropper" | "upgrader" | "collector" | "rate" | "speed" | "cosmetic"

-- Effekt eines Upgrades. Ein Union waere praeziser, ist aber in Luau ohne
-- Tagged-Union-Narrowing bei Tabellen-Literalen unhandlich; stattdessen ein
-- Record mit optionalen Feldern plus `kind` als Diskriminator.
export type UpgradeEffect = {
	kind: UpgradeKind,
	value: number?,     -- dropper: Wert eines erzeugten Erzes
	interval: number?,  -- dropper: Sekunden zwischen zwei Drops
	mult: number?,      -- upgrader / collector: Multiplikator
	factor: number?,    -- rate: Beschleunigung aller Dropper
	speed: number?,     -- speed: neue Bandgeschwindigkeit in studs/s
}

export type UpgradeDef = {
	id: string,
	rank: number,
	price: number,
	requires: { string },  -- Abhaengigkeiten; Button erscheint erst, wenn alle gekauft
	label: string,
	desc: string,
	effect: UpgradeEffect,
}

export type DropperDef = {
	value: number,
	interval: number,
}

-- Was dauerhaft pro Spieler gespeichert wird.
export type ProfileData = {
	version: number,
	cash: number,
	gems: number,
	rebirths: number,
	totalEarned: number,
	purchased: { [string]: boolean },   -- gekaufte Upgrade-Ids
	redeemedCodes: { [string]: boolean },
	receipts: { [string]: boolean },    -- Idempotenz fuer Developer-Products
	quests: { [string]: number },       -- Fortschrittszaehler
	claimedQuests: { [string]: boolean },
	dailyLastClaim: number,             -- os.time() der letzten Abholung
	dailyStreak: number,
	settings: { [string]: boolean },
	playtime: number,                   -- Sekunden Gesamtspielzeit
}

export type Profile = {
	data: ProfileData,
	userId: number,
	key: string,
	loaded: boolean,
	releasing: boolean,
	lockAcquired: boolean,
	lastSave: number,
	dirty: boolean,
}

-- Zustand, den der Server an den Client repliziert.
export type ClientState = {
	cash: number,
	gems: number,
	rebirths: number,
	totalEarned: number,
	incomePerSecond: number,
	purchased: { [string]: boolean },
	available: { [string]: boolean },   -- Abhaengigkeiten erfuellt, noch nicht gekauft
	plotIndex: number?,
	rebirthCost: number,
	rebirthMultiplier: number,
	nextRebirthMultiplier: number,
	dailyReady: boolean,
	dailyStreak: number,
	quests: { [string]: number },
	claimedQuests: { [string]: boolean },
	owns2xCash: boolean,
	ownsVip: boolean,
}

export type QuestDef = {
	id: string,
	label: string,
	metric: string,   -- welcher Zaehler in ProfileData.quests
	target: number,
	rewardGems: number,
}

export type CodeDef = {
	cash: number?,
	gems: number?,
}

export type GemProductDef = {
	id: string,
	productId: number,
	gems: number,
	label: string,
}

-- Lifecycle, den jeder Serverdienst implementiert. Init verdrahtet nur
-- Referenzen (darf nicht yielden), Start darf yielden und Arbeit aufnehmen.
export type Service = {
	name: string,
	Init: ((Registry) -> ())?,
	Start: (() -> ())?,
	priority: number?,
}

export type Registry = { [string]: any }

return {}
