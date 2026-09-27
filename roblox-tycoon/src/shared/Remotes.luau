--!strict
--[[
	Remotes – zentrale Registry aller Netzwerkgrenzen.

	Es gibt genau eine Stelle im Projekt, an der ein Remote entsteht. Grund:
	verstreute Instance.new("RemoteEvent") sind im Review nicht auffindbar,
	und jede uebersehene Tuer ist eine Luecke. Wer hier nichts eintraegt,
	kann auch nichts senden.

	Richtung ist dokumentiert, nicht erzwungen (Roblox kann das nicht), aber
	der Server prueft bei jedem eingehenden Remote ohnehin alles selbst.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

export type RemoteKind = "Event" | "Function"

export type RemoteDef = {
	kind: RemoteKind,
	-- "c2s" = Client sendet Absicht, "s2c" = Server informiert.
	direction: "c2s" | "s2c",
	note: string,
}

local DEFS: { [string]: RemoteDef } = {
	-- Client -> Server (Absichten; der Server validiert jedes Argument)
	RequestPurchase  = { kind = "Event",    direction = "c2s", note = "Spieler will Upgrade kaufen" },
	RequestRebirth   = { kind = "Event",    direction = "c2s", note = "Spieler will rebirthen" },
	RedeemCode       = { kind = "Function", direction = "c2s", note = "Code einloesen, gibt (ok, text)" },
	ClaimDaily       = { kind = "Function", direction = "c2s", note = "Tagesbelohnung, gibt (ok, text)" },
	ClaimQuest       = { kind = "Function", direction = "c2s", note = "Quest-Belohnung, gibt (ok, text)" },
	PromptGemProduct = { kind = "Event",    direction = "c2s", note = "Kaufdialog fuer Gem-Paket oeffnen" },

	-- Server -> Client (reine Information; nie autoritativ auf Clientseite)
	StateChanged     = { kind = "Event",    direction = "s2c", note = "Voller Spielerzustand" },
	Notify           = { kind = "Event",    direction = "s2c", note = "Kurze Meldung (text, kind)" },
	PlaySfx          = { kind = "Event",    direction = "s2c", note = "Soundeffekt ausloesen" },
}

local Remotes = {}
Remotes.DEFS = DEFS

local folder: Folder? = nil

-- Legt den Ordner und alle Remotes an. Darf NUR der Server aufrufen.
function Remotes.initServer(): Folder
	assert(RunService:IsServer(), "Remotes.initServer nur auf dem Server")
	local existing = ReplicatedStorage:FindFirstChild("Remotes")
	if existing ~= nil and existing:IsA("Folder") then
		folder = existing
		return existing
	end

	local created = Instance.new("Folder")
	created.Name = "Remotes"
	for name, def in pairs(DEFS) do
		local remote: Instance = if def.kind == "Event"
			then Instance.new("RemoteEvent")
			else Instance.new("RemoteFunction")
		remote.Name = name
		remote.Parent = created
	end
	created.Parent = ReplicatedStorage
	folder = created
	return created
end

local function container(): Folder
	if folder ~= nil then
		return folder
	end
	local found = ReplicatedStorage:WaitForChild("Remotes", 30)
	assert(found ~= nil and found:IsA("Folder"), "Remotes-Ordner nicht gefunden")
	folder = found
	return found
end

function Remotes.event(name: string): RemoteEvent
	local def = DEFS[name]
	assert(def ~= nil and def.kind == "Event", `Unbekanntes RemoteEvent: {name}`)
	local remote = container():WaitForChild(name, 30)
	assert(remote ~= nil and remote:IsA("RemoteEvent"), `RemoteEvent fehlt: {name}`)
	return remote
end

function Remotes.fn(name: string): RemoteFunction
	local def = DEFS[name]
	assert(def ~= nil and def.kind == "Function", `Unbekannte RemoteFunction: {name}`)
	local remote = container():WaitForChild(name, 30)
	assert(remote ~= nil and remote:IsA("RemoteFunction"), `RemoteFunction fehlt: {name}`)
	return remote
end

return Remotes
