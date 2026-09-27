--!strict
--[[
	SoundController – Soundeffekte auf Clientseite.

	Sounds laufen bewusst lokal: ein serverseitig abgespielter Kaufsound
	waere fuer alle sechs Spieler hoerbar, obwohl nur einer gekauft hat.

	Alle Asset-Ids in Config sind leer. Dieses Modul legt fuer eine leere
	Id KEINEN Sound an - ein Sound mit leerer SoundId erzeugt beim Abspielen
	eine Warnung im Output, und das Spiel soll fehlerfrei starten.
]]

local SoundService = game:GetService("SoundService")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)

local SoundController = {}

local sounds: { [string]: Sound } = {}
local enabled = true

local function register(key: string, assetId: string, volume: number)
	if assetId == "" then
		return
	end
	local sound = Instance.new("Sound")
	sound.Name = "Sfx_" .. key
	sound.SoundId = assetId
	sound.Volume = volume
	sound.Parent = SoundService
	sounds[key] = sound
end

function SoundController.setEnabled(value: boolean)
	enabled = value
end

function SoundController.play(key: string)
	if not enabled then
		return
	end
	-- Optional annotiert: nicht registrierte Keys (leere Asset-Id) fehlen.
	local sound: Sound? = sounds[key]
	if sound ~= nil then
		sound:Play()
	end
end

function SoundController.init()
	register("purchase", Config.SOUNDS.PURCHASE, 0.5)
	register("collect", Config.SOUNDS.COLLECT, 0.3)
	register("rebirth", Config.SOUNDS.REBIRTH, 0.6)
	register("error", Config.SOUNDS.ERROR, 0.4)
end

return SoundController
