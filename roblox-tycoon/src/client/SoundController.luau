--!strict
--[[
	SoundController – Klang als Teil des Gefuehls.

	Alles laeuft lokal: ein serverseitig abgespielter Kaufklick waere fuer
	alle sechs Spieler hoerbar.

	Zur Tonhoehen-Variation beim Sammeln: bei Dauerfeuer (bis zu acht Erze
	pro Sekunde) ist ein exakt identischer Ton nach zwanzig Sekunden
	unertraeglich. Eine zufaellige Abweichung von 0.95 bis 1.05 im
	PlaybackSpeed reicht, damit das Ohr es als Textur statt als Wiederholung
	hoert. Zusaetzlich gibt es eine Mindestpause, damit sich die Toene
	nicht zu Rauschen aufsummieren.

	Alle SoundIds sind Platzhalter. Ohne Id wird KEIN Sound-Objekt angelegt -
	ein Sound mit leerer SoundId erzeugt beim Abspielen eine Warnung.
]]

local SoundService = game:GetService("SoundService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Theme = require(Shared.Theme)

local SoundController = {}

type Entry = { sound: Sound, pitchVary: boolean, minGap: number, lastPlay: number }

local entries: { [string]: Entry } = {}
local ambience: Sound? = nil
local sfxEnabled = true
local ambienceEnabled = true

local function register(key: string, assetId: string, volume: number,
	pitchVary: boolean, minGap: number)
	if assetId == "" then
		return
	end
	local sound = Instance.new("Sound")
	sound.Name = "Sfx_" .. key
	sound.SoundId = assetId
	sound.Volume = volume
	sound.Parent = SoundService
	entries[key] = { sound = sound, pitchVary = pitchVary, minGap = minGap, lastPlay = 0 }
end

function SoundController.setEnabled(value: boolean)
	sfxEnabled = value
end

function SoundController.setAmbienceEnabled(value: boolean)
	ambienceEnabled = value
	local loop = ambience
	if loop == nil then
		return
	end
	if value then
		loop:Play()
	else
		loop:Stop()
	end
end

function SoundController.play(key: string)
	if not sfxEnabled then
		return
	end
	local entry: Entry? = entries[key]
	if entry == nil then
		return
	end
	local now = os.clock()
	if now - entry.lastPlay < entry.minGap then
		return
	end
	entry.lastPlay = now
	if entry.pitchVary then
		-- 0.95 bis 1.05
		entry.sound.PlaybackSpeed = 1 + (math.random() - 0.5) / Theme.Space.x8
	end
	entry.sound:Play()
end

function SoundController.init()
	-- Klick trocken und kurz, Fehler dumpf, Kauf hell.
	register("click", Config.SOUNDS.CLICK, 0.35, false, 0)
	register("hover", Config.SOUNDS.HOVER, 0.12, false, 0)
	register("purchase", Config.SOUNDS.PURCHASE, 0.5, false, 0)
	register("error", Config.SOUNDS.ERROR, 0.4, false, 0)
	register("rebirth", Config.SOUNDS.REBIRTH, 0.6, false, 0)
	-- Sammeln: Tonhoehe variiert, Mindestpause gegen Rauschen.
	register("collect", Config.SOUNDS.COLLECT, 0.22, true, 0.06)

	if Config.SOUNDS.AMBIENCE ~= "" then
		local loop = Instance.new("Sound")
		loop.Name = "Ambience"
		loop.SoundId = Config.SOUNDS.AMBIENCE
		loop.Looped = true
		loop.Volume = 0.2
		loop.Parent = SoundService
		ambience = loop
		if ambienceEnabled then
			loop:Play()
		end
	end
end

return SoundController
