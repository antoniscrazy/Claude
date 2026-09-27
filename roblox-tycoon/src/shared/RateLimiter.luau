--!strict
--[[
	RateLimiter – Token-Bucket pro Spieler und pro Remote.

	Warum: jedes RemoteEvent ist eine offene Tuer. Ein Exploiter kann ein
	Remote in einer Schleife tausendfach pro Sekunde feuern. Ohne Limit
	haengt der Server an der Validierung oder am DataStore. Der Bucket
	kostet pro Aufruf eine Subtraktion und eine Zeitdifferenz.

	Der Bucket fuellt sich kontinuierlich (nicht in festen Fenstern), damit
	eine ehrliche UI mit kurzen Bursts nicht faelschlich geblockt wird.
]]

export type Bucket = { tokens: number, last: number, rate: number }

local RateLimiter = {}

-- [userId][key] = Bucket
local buckets: { [number]: { [string]: Bucket } } = {}

--[[
	Gibt true zurueck, wenn der Aufruf erlaubt ist, und verbraucht dann ein
	Token. Gibt false zurueck, wenn das Budget erschoepft ist.
	`rate` = erlaubte Aufrufe pro Sekunde; die Bucket-Tiefe ist rate (also
	maximal eine Sekunde Burst im Voraus).
]]
function RateLimiter.consume(userId: number, key: string, rate: number): boolean
	local perPlayer = buckets[userId]
	if perPlayer == nil then
		perPlayer = {}
		buckets[userId] = perPlayer
	end

	local bucket = perPlayer[key]
	local now = os.clock()
	if bucket == nil then
		bucket = { tokens = rate, last = now, rate = rate }
		perPlayer[key] = bucket
	end

	-- Auffuellen seit dem letzten Aufruf, gedeckelt auf die Bucket-Tiefe.
	local elapsed = now - bucket.last
	bucket.last = now
	bucket.tokens = math.min(rate, bucket.tokens + elapsed * rate)

	if bucket.tokens < 1 then
		return false
	end
	bucket.tokens -= 1
	return true
end

-- Muss bei PlayerRemoving aufgerufen werden, sonst waechst die Tabelle
-- ueber die Serverlaufzeit unbegrenzt (klassisches Leak).
function RateLimiter.clear(userId: number)
	buckets[userId] = nil
end

return RateLimiter
