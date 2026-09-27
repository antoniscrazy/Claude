--!strict
--[[
	MonetizationService – Gamepasses und Developer-Products.

	Wichtig fuer den Auslieferungszustand: alle Ids in Config sind 0.
	Ein Aufruf wie UserOwnsGamePassAsync(userId, 0) wirft eine Ausnahme und
	wuerde den Output fluten. Deshalb hat JEDER Marketplace-Aufruf hier eine
	Vorpruefung auf id ~= 0. So startet das unveraendert ausgelieferte Place
	fehlerfrei, und sobald echte Ids eingetragen sind, funktioniert alles
	ohne weitere Codeaenderung.

	Idempotenz bei Developer-Products: Roblox ruft ProcessReceipt so lange
	erneut auf, bis wir PurchaseGranted zurueckgeben - auch nach einem
	Serverneustart. Ohne Merken der PurchaseId bekaeme ein Spieler seine
	Gems mehrfach. Und umgekehrt: wir duerfen erst dann PurchaseGranted
	melden, wenn die Gutschrift auch WIRKLICH gespeichert ist, sonst ist das
	Geld weg und die Gems sind es auch.
]]

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Log = require(Shared.Log)
local Remotes = require(Shared.Remotes)
local Types = require(Shared.Types)

local DataService = require(script.Parent.DataService)
local PlotService = require(script.Parent.PlotService)

local MonetizationService = {}
MonetizationService.name = "MonetizationService"

-- Besitzstand wird gecacht: UserOwnsGamePassAsync ist ein Webaufruf und
-- darf nicht bei jedem Erz erneut passieren.
local passCache: { [number]: { [number]: boolean } } = {}
-- Laufende Hintergrundabfragen, damit dieselbe Abfrage nicht pro Tick
-- erneut gestartet wird.
local pending: { [string]: boolean } = {}

--[[
	Besitzabfrage - GARANTIERT OHNE YIELD.

	Das ist der entscheidende Punkt: cashMultiplier() wird aus dem zentralen
	TickScheduler heraus aufgerufen (10x pro Sekunde, im Heartbeat). Ein
	blockierender UserOwnsGamePassAsync-Aufruf wuerde dort den kompletten
	Scheduler anhalten, bis der Webaufruf antwortet - bei 6 Plots waeren das
	sichtbare Aussetzer in der Erzproduktion.

	Deshalb: nur den Cache lesen. Ist der Eintrag unbekannt, wird EINMAL ein
	Hintergrund-Thread gestartet und solange false angenommen. Beim Join
	wird der Cache ohnehin vorgewaermt, sodass dieser Fall praktisch nur
	direkt nach einem Kauf auftritt und dann hoechstens fuer einen Tick gilt.
]]
local function refreshPass(userId: number, passId: number)
	if passId == 0 or pending[userId .. ":" .. passId] then
		return
	end
	pending[userId .. ":" .. passId] = true
	task.spawn(function()
		local ok, result = pcall(function(): boolean
			return MarketplaceService:UserOwnsGamePassAsync(userId, passId)
		end)
		pending[userId .. ":" .. passId] = nil
		if not ok then
			Log.throttled(`pass_{passId}`, 60, 2, "Monetization",
				`Gamepass-Abfrage fehlgeschlagen: {tostring(result)}`)
			-- Bei Fehler NICHT cachen: ein zahlender Spieler haenge sonst
			-- bis zum Serverneustart ohne seinen Vorteil fest.
			return
		end
		local perPlayer = passCache[userId]
		if perPlayer == nil then
			perPlayer = {}
			passCache[userId] = perPlayer
		end
		perPlayer[passId] = result == true
	end)
end

local function ownsPass(player: Player, passId: number): boolean
	if passId == 0 then
		return false   -- Platzhalter-Id: kein Aufruf, kein Fehler
	end
	local perPlayer = passCache[player.UserId]
	local cached = if perPlayer ~= nil then perPlayer[passId] else nil
	if cached ~= nil then
		return cached
	end
	refreshPass(player.UserId, passId)
	return false
end

function MonetizationService.owns2xCash(player: Player): boolean
	return ownsPass(player, Config.MONETIZATION.GAMEPASS_2X_CASH)
end

function MonetizationService.ownsVip(player: Player): boolean
	return ownsPass(player, Config.MONETIZATION.GAMEPASS_VIP)
end

-- Gesamter Kaufmultiplikator aus bezahlten Vorteilen.
function MonetizationService.cashMultiplier(player: Player): number
	local mult = 1
	if MonetizationService.owns2xCash(player) then
		mult *= Config.MONETIZATION.CASH_MULT_2X
	end
	if MonetizationService.ownsVip(player) then
		mult *= Config.MONETIZATION.VIP_CASH_MULT
	end
	return mult
end

local function productById(productId: number): Types.GemProductDef?
	for _, product in ipairs(Config.GEM_PRODUCTS) do
		if product.productId == productId and productId ~= 0 then
			return product
		end
	end
	return nil
end

--[[
	ProcessReceipt. Ablauf bewusst in dieser Reihenfolge:
	  1. Spieler noch da?           -> sonst NotProcessedYet (Roblox fragt spaeter erneut)
	  2. Schon verbucht?            -> PurchaseGranted (Doppelgutschrift verhindern)
	  3. Profil speicherbar?        -> sonst NotProcessedYet, NIEMALS gewaehren
	  4. Gutschreiben + merken
	  5. Erst danach PurchaseGranted
]]
local function processReceipt(info: { [string]: any }): Enum.ProductPurchaseDecision
	local userId = info.PlayerId :: number
	local purchaseKey = tostring(info.PurchaseId)
	local player = Players:GetPlayerByUserId(userId)
	if player == nil then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local data = DataService.get(player)
	if data == nil then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	if data.receipts[purchaseKey] then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end

	if not DataService.canSave(player) then
		-- Ohne Speichermoeglichkeit waere die Gutschrift beim naechsten
		-- Join weg, das Robux aber ausgegeben. Lieber spaeter erneut.
		Log.warn("Monetization", `Kauf von {player.Name} verschoben: Profil nicht speicherbar`)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local product = productById(info.ProductId :: number)
	if product == nil then
		Log.warn("Monetization", `Unbekanntes Produkt {tostring(info.ProductId)}`)
		-- Unbekanntes Produkt niemals endlos wiederholen lassen.
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end

	data.gems += product.gems
	data.receipts[purchaseKey] = true
	DataService.markDirty(player)

	Remotes.event("Notify"):FireClient(player, `{product.gems} Gems gutgeschrieben!`, "success")
	Log.info("Monetization", `{player.Name} hat {product.label} gekauft`)
	return Enum.ProductPurchaseDecision.PurchaseGranted
end

--[[
	VIP-Tuer.

	Roblox kann eine Wand nicht "nur fuer manche Spieler" durchlaessig
	machen - CanCollide gilt serverseitig fuer alle. Der uebliche Trick
	(Client setzt CanCollide lokal auf false) verlagert die Entscheidung
	auf den Client und ist damit faelschbar.

	Deshalb hier serverseitig und autoritativ: wer die Tuer beruehrt und
	den Pass besitzt, wird auf die andere Seite gesetzt. Die Richtung wird
	aus der lokalen X-Position bestimmt, damit dieselbe Tuer auch wieder
	hinausfuehrt. Ein Spieler ohne Pass prallt schlicht ab und bekommt
	einen Hinweis.
]]
local function connectVipDoors()
	local lastPrompt: { [number]: number } = {}

	for _, state in ipairs(PlotService.all()) do
		local refs = state.refs
		refs.vipDoor.Touched:Connect(function(hit: BasePart)
			local character = hit.Parent
			if character == nil then
				return
			end
			local player = Players:GetPlayerFromCharacter(character)
			if player == nil then
				return
			end
			-- Tuer existiert nur, wenn die Lounge gebaut ist.
			if not refs.vipDoor.CanCollide then
				return
			end
			local root = character:FindFirstChild("HumanoidRootPart")
			if root == nil or not root:IsA("BasePart") then
				return
			end

			local now = os.clock()
			local previous = lastPrompt[player.UserId]
			if previous ~= nil and now - previous < 1.5 then
				return
			end
			lastPrompt[player.UserId] = now

			if not MonetizationService.ownsVip(player) then
				Remotes.event("Notify"):FireClient(
					player, "Die VIP-Lounge braucht den VIP-Pass.", "error")
				return
			end

			-- In Plot-lokale Koordinaten umrechnen, um die Seite zu bestimmen.
			local localPos = refs.origin:PointToObjectSpace(root.Position)
			local doorLocal = refs.origin:PointToObjectSpace(refs.vipDoor.Position)
			local inside = localPos.X > doorLocal.X
			local targetX = if inside then doorLocal.X - 6 else doorLocal.X + 8
			root.CFrame = refs.origin * CFrame.new(targetX, localPos.Y, localPos.Z)
		end)
	end

	Players.PlayerRemoving:Connect(function(player: Player)
		lastPrompt[player.UserId] = nil
	end)
end

function MonetizationService.Init()
	-- Nur EIN Handler im ganzen Spiel: Roblox erlaubt genau einen.
	MarketplaceService.ProcessReceipt = processReceipt
end

function MonetizationService.Start()
	-- Cache beim Join vorwaermen, damit der erste Erz-Tick bereits den
	-- richtigen Multiplikator sieht.
	local function prewarm(player: Player)
		refreshPass(player.UserId, Config.MONETIZATION.GAMEPASS_2X_CASH)
		refreshPass(player.UserId, Config.MONETIZATION.GAMEPASS_VIP)
	end
	Players.PlayerAdded:Connect(prewarm)
	for _, player in ipairs(Players:GetPlayers()) do
		prewarm(player)
	end

	connectVipDoors()

	Players.PlayerRemoving:Connect(function(player: Player)
		passCache[player.UserId] = nil
	end)

	-- Nach einem Gamepass-Kauf im laufenden Spiel den Cache verwerfen,
	-- damit der Vorteil sofort greift.
	MarketplaceService.PromptGamePassPurchaseFinished:Connect(
		function(player: Player, passId: number, wasPurchased: boolean)
			if not wasPurchased then
				return
			end
			local perPlayer = passCache[player.UserId]
			if perPlayer ~= nil then
				perPlayer[passId] = nil
			end
			refreshPass(player.UserId, passId)
			DataService.markDirty(player)
			Remotes.event("Notify"):FireClient(player, "Vielen Dank fuer den Kauf!", "success")
		end
	)
end

-- Vom Client angefragter Kaufdialog. Der Client kann PromptProductPurchase
-- auch selbst aufrufen; der Umweg ueber den Server sorgt dafuer, dass nur
-- Produkt-Ids aus der Config verwendet werden koennen.
function MonetizationService.promptGemProduct(player: Player, productKey: string)
	for _, product in ipairs(Config.GEM_PRODUCTS) do
		if product.id == productKey then
			if product.productId == 0 then
				Remotes.event("Notify"):FireClient(
					player, "Dieses Paket ist noch nicht eingerichtet.", "error")
				return
			end
			local ok, err = pcall(function()
				MarketplaceService:PromptProductPurchase(player, product.productId)
			end)
			if not ok then
				Log.warn("Monetization", `PromptProductPurchase fehlgeschlagen: {tostring(err)}`)
			end
			return
		end
	end
end

return MonetizationService
