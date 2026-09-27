--!strict
--[[
	Config – die EINZIGE Quelle fuer Zahlen, Preise und Asset-Ids.

	Regel im Projekt: keine Magic Numbers im Logikcode. Wer eine Zahl braucht,
	holt sie hier. Die Upgrade-Tabelle unten ist NICHT von Hand getippt, sondern
	von tools/balance_sim.py erzeugt und dort auch verifiziert
	(Erstkauf < 45 s, Rebirth 1 nach ~30 min, kein Schritt > 2.5x langsamer
	als der vorherige). Wer Preise aendert, aendert sie im Simulator und
	generiert diese Tabelle neu - sonst stimmt die Kurve nicht mehr.

	Thema: Bergbau-Imperium. Das Thema steckt ausschliesslich in Namen, Farben
	und Materialien in diesem Modul - die Spiellogik ist themenneutral.
]]

local Types = require(script.Parent.Types)

local Config = {}

-- ==========================================================================
-- ALLGEMEIN
-- ==========================================================================

Config.GAME_NAME = "Bergbau-Imperium"
Config.DATA_STORE_NAME = "BergbauImperium_Profiles_v1"
Config.LEADERBOARD_STORE_NAME = "BergbauImperium_Leaderboard_v1"

-- Log-Level: 0=Debug 1=Info 2=Warn 3=Error. Im Live-Betrieb auf 1 lassen,
-- damit der Output nicht zugemuellt wird.
Config.LOG_LEVEL = 1

-- ==========================================================================
-- WELT
-- ==========================================================================

Config.WORLD = {
	PLOT_COUNT = 6,
	-- Plots liegen in einem 3x2-Raster.
	PLOT_COLUMNS = 3,
	PLOT_SPACING_X = 190,
	PLOT_SPACING_Z = 210,
	PLOT_SIZE = Vector3.new(160, 2, 170),
	-- Ein Kauf ueber die Shop-UI ist nur gueltig, wenn der Spieler innerhalb
	-- dieses Radius um sein Plot-Zentrum steht (Server-Distanzpruefung).
	PURCHASE_RADIUS = 140,
	LOBBY_CENTER = Vector3.new(0, 4, 300),
	LOBBY_SIZE = Vector3.new(140, 2, 90),
}

Config.COLORS = {
	ROCK = Color3.fromRGB(88, 92, 102),
	STEEL = Color3.fromRGB(122, 128, 140),
	DARK_STEEL = Color3.fromRGB(52, 56, 66),
	ACCENT = Color3.fromRGB(255, 176, 48),
	ACCENT_DARK = Color3.fromRGB(190, 120, 20),
	CASH = Color3.fromRGB(120, 235, 150),
	GEM = Color3.fromRGB(130, 190, 255),
	LOCKED = Color3.fromRGB(96, 100, 112),
	BUYABLE = Color3.fromRGB(70, 170, 255),
	BOUGHT = Color3.fromRGB(70, 200, 120),
	PANEL = Color3.fromRGB(22, 24, 32),
	PANEL_LIGHT = Color3.fromRGB(34, 37, 48),
	TEXT = Color3.fromRGB(236, 238, 245),
	TEXT_DIM = Color3.fromRGB(158, 163, 178),
	DANGER = Color3.fromRGB(255, 96, 96),
}

-- ==========================================================================
-- OEKONOMIE (Werte aus tools/balance_sim.py)
-- ==========================================================================

Config.ECONOMY = {
	-- Gratis-Startdropper: sorgt dafuer, dass in < 10 s das erste Geld laeuft.
	START_DROPPER = { value = 20, interval = 2.0 } :: Types.DropperDef,
	START_CASH = 0,
	START_GEMS = 0,

	CONVEYOR_BASE_SPEED = 20,       -- studs/s, bevor Band-Upgrades greifen
	ORE_LIFETIME = 25,              -- Sekunden, danach wird ein Erz entsorgt
	MAX_ORES_PER_PLOT = 45,         -- harte Obergrenze gegen Lag
	ORE_SIZE = Vector3.new(1.6, 1.6, 1.6),
	ORE_FALL_KILL_Y = -40,          -- darunter gilt ein Erz als verloren

	-- Wie oft der zentrale Scheduler laeuft. Alles Serverseitige haengt an
	-- diesen beiden Frequenzen - es gibt KEINEN Heartbeat pro Instanz.
	DROP_TICK_HZ = 10,              -- Dropper-Takt
	SWEEP_TICK_HZ = 2,              -- Aufraeumen / Limits
	STATE_PUSH_HZ = 4,              -- Zustands-Replikation zum Client
}

-- ==========================================================================
-- UPGRADE-BAUM (generiert - siehe Kopfkommentar)
-- ==========================================================================

Config.UPGRADES = {
	-- GENERIERT-ANFANG (tools/gen_config.py) - nicht von Hand aendern
	{ id = "dropper_2", rank = 1, price = 200, requires = {},
	  label = "Zweiter Bohrer", desc = "Ein weiterer Bohrer am Band",
	  effect = { kind = "dropper", value = 10, interval = 2 } },
	{ id = "conveyor_1", rank = 2, price = 310, requires = {"dropper_2"},
	  label = "Band Stufe I", desc = "Hoeherer Durchsatz auf dem Band",
	  effect = { kind = "speed", speed = 26 } },
	{ id = "upgrader_1", rank = 3, price = 481, requires = {"conveyor_1"},
	  label = "Schmelzofen I", desc = "Veredelt jedes Erz beim Durchfahren",
	  effect = { kind = "upgrader", mult = 1.49 } },
	{ id = "dropper_3", rank = 4, price = 745, requires = {"upgrader_1"},
	  label = "Dritter Bohrer", desc = "Noch ein Bohrer am Band",
	  effect = { kind = "dropper", value = 15, interval = 2 } },
	{ id = "rate_1", rank = 5, price = 1150, requires = {"dropper_3"},
	  label = "Bohrkopf I", desc = "Alle Bohrer foerdern schneller",
	  effect = { kind = "rate", factor = 1.25 } },
	{ id = "collector_1", rank = 6, price = 1790, requires = {"rate_1"},
	  label = "Waage I", desc = "Der Sammler zahlt mehr aus",
	  effect = { kind = "collector", mult = 1.79 } },
	{ id = "upgrader_2", rank = 7, price = 2770, requires = {"collector_1"},
	  label = "Schmelzofen II", desc = "Zweite Veredelungsstufe",
	  effect = { kind = "upgrader", mult = 1.49 } },
	{ id = "dropper_4", rank = 8, price = 4300, requires = {"upgrader_2"},
	  label = "Vierter Bohrer", desc = "Ein Bohrer mehr",
	  effect = { kind = "dropper", value = 22, interval = 2 } },
	{ id = "walls", rank = 9, price = 6660, requires = {"dropper_4"},
	  label = "Hallenwaende", desc = "Schliesst die Fabrikhalle ein",
	  effect = { kind = "cosmetic" } },
	{ id = "rate_2", rank = 10, price = 10300, requires = {"walls"},
	  label = "Bohrkopf II", desc = "Bohrer foerdern noch schneller",
	  effect = { kind = "rate", factor = 1.25 } },
	{ id = "conveyor_2", rank = 11, price = 16000, requires = {"rate_2"},
	  label = "Band Stufe II", desc = "Schnelleres Foerderband",
	  effect = { kind = "speed", speed = 32 } },
	{ id = "upgrader_3", rank = 12, price = 24800, requires = {"conveyor_2"},
	  label = "Schmelzofen III", desc = "Dritte Veredelungsstufe",
	  effect = { kind = "upgrader", mult = 1.79 } },
	{ id = "dropper_5", rank = 13, price = 38500, requires = {"upgrader_3"},
	  label = "Fuenfter Bohrer", desc = "Ein Bohrer mehr",
	  effect = { kind = "dropper", value = 33, interval = 2 } },
	{ id = "collector_2", rank = 14, price = 59600, requires = {"dropper_5"},
	  label = "Waage II", desc = "Der Sammler zahlt noch mehr aus",
	  effect = { kind = "collector", mult = 1.49 } },
	{ id = "roof", rank = 15, price = 92400, requires = {"collector_2", "walls"},
	  label = "Hallendach", desc = "Setzt der Halle ein Dach auf",
	  effect = { kind = "cosmetic" } },
	{ id = "rate_3", rank = 16, price = 143000, requires = {"roof"},
	  label = "Bohrkopf III", desc = "Bohrer foerdern noch schneller",
	  effect = { kind = "rate", factor = 1.25 } },
	{ id = "upgrader_4", rank = 17, price = 222000, requires = {"rate_3"},
	  label = "Schmelzofen IV", desc = "Vierte Veredelungsstufe",
	  effect = { kind = "upgrader", mult = 1.79 } },
	{ id = "dropper_6", rank = 18, price = 344000, requires = {"upgrader_4"},
	  label = "Sechster Bohrer", desc = "Ein Bohrer mehr",
	  effect = { kind = "dropper", value = 49, interval = 2 } },
	{ id = "conveyor_3", rank = 19, price = 533000, requires = {"dropper_6"},
	  label = "Band Stufe III", desc = "Maximales Bandtempo",
	  effect = { kind = "speed", speed = 40 } },
	{ id = "collector_3", rank = 20, price = 827000, requires = {"conveyor_3"},
	  label = "Waage III", desc = "Maximale Auszahlung",
	  effect = { kind = "collector", mult = 1.49 } },
	{ id = "lights", rank = 21, price = 1280000, requires = {"collector_3", "roof"},
	  label = "Hallenbeleuchtung", desc = "Flutlicht fuer die Halle",
	  effect = { kind = "cosmetic" } },
	{ id = "rate_4", rank = 22, price = 1990000, requires = {"lights"},
	  label = "Bohrkopf IV", desc = "Maximale Foerdergeschwindigkeit",
	  effect = { kind = "rate", factor = 1.25 } },
	{ id = "upgrader_5", rank = 23, price = 3080000, requires = {"rate_4"},
	  label = "Schmelzofen V", desc = "Fuenfte Veredelungsstufe",
	  effect = { kind = "upgrader", mult = 1.79 } },
	{ id = "dropper_7", rank = 24, price = 4770000, requires = {"upgrader_5"},
	  label = "Siebter Bohrer", desc = "Der letzte Bohrer",
	  effect = { kind = "dropper", value = 74, interval = 2 } },
	{ id = "vip_room", rank = 25, price = 7400000, requires = {"dropper_7"},
	  label = "VIP-Lounge", desc = "Oeffnet den VIP-Bereich auf dem Plot",
	  effect = { kind = "cosmetic" } },
	-- GENERIERT-ENDE
} :: { Types.UpgradeDef }

-- Schneller Zugriff nach Id. Wird einmal beim Laden gebaut.
Config.UPGRADES_BY_ID = {} :: { [string]: Types.UpgradeDef }
for _, def in ipairs(Config.UPGRADES) do
	Config.UPGRADES_BY_ID[def.id] = def
end

-- ==========================================================================
-- REBIRTH
-- ==========================================================================

Config.REBIRTH = {
	BASE_COST = 1000000,   -- Kosten fuer Rebirth 1 (im Simulator verifiziert)
	COST_GROWTH = 6.5,     -- jeder weitere Rebirth kostet das 6.5-fache
	CASH_MULT_PER = 0.75,  -- +75 % Einkommen je Rebirth
	GEMS_PER = 5,          -- Gems als Belohnung je Rebirth
}

-- Einkommensmultiplikator bei n Rebirths.
function Config.rebirthMultiplier(rebirths: number): number
	return 1 + Config.REBIRTH.CASH_MULT_PER * rebirths
end

-- Kosten fuer den naechsten Rebirth bei n bereits absolvierten.
function Config.rebirthCost(rebirths: number): number
	return math.floor(Config.REBIRTH.BASE_COST * (Config.REBIRTH.COST_GROWTH ^ rebirths))
end

-- ==========================================================================
-- MONETARISIERUNG
-- Alle Ids sind Platzhalter. Solange sie 0 sind, ueberspringt der Server
-- jeden Marketplace-Aufruf - dadurch startet das Spiel ohne Fehler im Output.
-- ==========================================================================

Config.MONETIZATION = {
	GAMEPASS_2X_CASH = 0,   -- REPLACE ME: GamePass-Id fuer 2x Cash
	GAMEPASS_VIP = 0,       -- REPLACE ME: GamePass-Id fuer den VIP-Bereich
	CASH_MULT_2X = 2,
	VIP_CASH_MULT = 1.25,
}

Config.GEM_PRODUCTS = {
	{ id = "gems_small",  productId = 0, gems = 50,   label = "50 Gems"   },  -- REPLACE ME
	{ id = "gems_medium", productId = 0, gems = 300,  label = "300 Gems"  },  -- REPLACE ME
	{ id = "gems_large",  productId = 0, gems = 1000, label = "1000 Gems" },  -- REPLACE ME
} :: { Types.GemProductDef }

-- ==========================================================================
-- CODES  (Gross-/Kleinschreibung wird beim Einloesen normalisiert)
-- ==========================================================================

Config.CODES = {
	release   = { cash = 5000,  gems = 10 },
	bergbau   = { cash = 2500,  gems = 5  },
	danke1k   = { cash = 25000, gems = 25 },
	glueckauf = { gems = 50 },
} :: { [string]: Types.CodeDef }

-- ==========================================================================
-- QUESTS / ERFOLGE
-- ==========================================================================

Config.QUESTS = {
	{ id = "earn_10k",    label = "Verdiene 10.000 $",      metric = "earned",    target = 10000,   rewardGems = 5  },
	{ id = "earn_1m",     label = "Verdiene 1.000.000 $",   metric = "earned",    target = 1000000, rewardGems = 25 },
	{ id = "buy_5",       label = "Kaufe 5 Upgrades",       metric = "purchases", target = 5,       rewardGems = 5  },
	{ id = "buy_15",      label = "Kaufe 15 Upgrades",      metric = "purchases", target = 15,      rewardGems = 15 },
	{ id = "buy_all",     label = "Kaufe alle 25 Upgrades", metric = "purchases", target = 25,      rewardGems = 50 },
	{ id = "rebirth_1",   label = "Mache 1 Rebirth",        metric = "rebirths",  target = 1,       rewardGems = 30 },
	{ id = "rebirth_5",   label = "Mache 5 Rebirths",       metric = "rebirths",  target = 5,       rewardGems = 120 },
	{ id = "playtime_1h", label = "Spiele 1 Stunde",        metric = "playtime",  target = 3600,    rewardGems = 20 },
} :: { Types.QuestDef }

-- ==========================================================================
-- DAILY REWARD
-- Die Pruefung laeuft ausschliesslich serverseitig gegen os.time() des
-- Servers. Der Client sagt nur "ich will abholen" und bekommt ja oder nein.
-- ==========================================================================

Config.DAILY = {
	COOLDOWN = 20 * 3600,        -- fruehestens nach 20 Stunden wieder
	STREAK_RESET = 48 * 3600,    -- nach 48 h ohne Abholung faellt die Serie
	BASE_CASH = 2500,
	CASH_PER_STREAK = 2500,
	MAX_STREAK = 7,
	GEMS_AT_MAX = 25,
}

-- ==========================================================================
-- LEADERBOARD
-- ==========================================================================

Config.LEADERBOARD = {
	TOP_N = 50,
	REFRESH_SECONDS = 120,
	PUBLISH_SECONDS = 60,
}

-- ==========================================================================
-- SOUND
-- Leerer String = kein Sound. Es werden bewusst KEINE Asset-Ids erfunden;
-- trage eigene ein, dann spielt das Spiel sie automatisch ab.
-- ==========================================================================

Config.SOUNDS = {
	AMBIENCE = "",   -- REPLACE ME: rbxassetid://...
	PURCHASE = "",   -- REPLACE ME
	COLLECT  = "",   -- REPLACE ME
	REBIRTH  = "",   -- REPLACE ME
	ERROR    = "",   -- REPLACE ME
}

-- ==========================================================================
-- REMOTE-RATE-LIMITS (Aufrufe pro Sekunde und Spieler)
-- Bewusst knapp ueber dem, was eine ehrliche UI braucht.
-- ==========================================================================

Config.RATE_LIMITS = {
	RequestPurchase = 8,
	RequestRebirth = 1,
	RedeemCode = 1,
	ClaimDaily = 1,
	ClaimQuest = 4,
	PromptGemProduct = 2,
}

table.freeze(Config.WORLD)
table.freeze(Config.ECONOMY)
table.freeze(Config.REBIRTH)

return Config
