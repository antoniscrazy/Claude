import de from '../data/i18n/de.json';
import en from '../data/i18n/en.json';
import { settings } from './Settings';

/** Lokalisierbarer Text in Datendateien: entweder ein String oder {de, en}. */
export type LocText = string | { de: string; en?: string };

const tables: Record<string, Record<string, string>> = { de, en };

/** UI-String nach Schlüssel. Fällt auf Deutsch und dann auf den Schlüssel zurück. */
export function t(key: string): string {
  const lang = settings.data.language;
  return tables[lang]?.[key] ?? tables.de[key] ?? key;
}

/** Text aus Story-/Dialogdaten in der aktuellen Sprache. */
export function loc(text: LocText): string {
  if (typeof text === 'string') return text;
  return (settings.data.language === 'en' && text.en) || text.de;
}
