/**
 * Sichere localStorage-Hülle. Jeder Zugriff ist in try/catch gekapselt,
 * damit das Spiel auch in privaten Fenstern oder bei blockiertem Storage läuft.
 */
const PREFIX = 'neon-requiem:';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
