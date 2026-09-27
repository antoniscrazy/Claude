--!strict
--[[
	Format – Zahlen- und Zeitformatierung fuer die UI.

	Liegt in Shared, weil Server (Billboards ueber der Welt) und Client (HUD)
	exakt dieselbe Darstellung brauchen. Zwei verschiedene Formatierer waeren
	eine sichere Quelle fuer "im HUD steht 1.2M, am Button 1.19M".
]]

local Format = {}

local SUFFIXES = { "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc" }

--[[
	Kurzform fuer Geldbetraege: 1234 -> "1.23K", 1500000 -> "1.5M".
	Ab 1e36 wird auf wissenschaftliche Notation umgeschaltet, damit die
	Suffixliste nicht ueberlaeuft (passiert bei hohen Rebirths wirklich).
]]
function Format.abbreviate(value: number): string
	if value ~= value then          -- NaN abfangen, sonst steht "nan" in der UI
		return "0"
	end
	local sign = if value < 0 then "-" else ""
	local n = math.abs(value)
	if n < 1000 then
		return sign .. tostring(math.floor(n))
	end
	local tier = math.floor(math.log(n, 1000))
	if tier > #SUFFIXES then
		return sign .. string.format("%.2e", n)
	end
	local scaled = n / (1000 ^ tier)
	-- %.3g haelt die Breite konstant (3 signifikante Stellen), damit die
	-- Buttons in der UI nicht springen.
	return sign .. string.format("%.3g", scaled) .. SUFFIXES[tier]
end

-- Volle Schreibweise mit Tausenderpunkten: 1234567 -> "1.234.567"
function Format.full(value: number): string
	local sign = if value < 0 then "-" else ""
	local s = tostring(math.floor(math.abs(value)))
	local out = ""
	local count = 0
	for i = #s, 1, -1 do
		out = string.sub(s, i, i) .. out
		count += 1
		if count % 3 == 0 and i > 1 then
			out = "." .. out
		end
	end
	return sign .. out
end

-- Sekunden -> "2h 14m" / "14m 3s" / "9s"
function Format.duration(seconds: number): string
	local s = math.max(0, math.floor(seconds))
	local h = math.floor(s / 3600)
	local m = math.floor((s % 3600) / 60)
	local sec = s % 60
	if h > 0 then
		return string.format("%dh %dm", h, m)
	elseif m > 0 then
		return string.format("%dm %ds", m, sec)
	end
	return string.format("%ds", sec)
end

return Format
