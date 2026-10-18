import { de, type MessageKey } from './de';

export type { MessageKey };
export type Locale = 'de';

type Dictionary = Record<MessageKey, string>;

const dictionaries: Record<Locale, Dictionary> = { de };
/** Content overlays per locale: `${id}.${field}` → text. Empty for German (defaults live in data). */
const contentOverlays: Record<Locale, Record<string, string>> = { de: {} };

let locale: Locale = 'de';

export function setLocale(next: Locale): void {
  locale = next;
}

export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  const template = dictionaries[locale][key] ?? key;
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** Translates content (item/action names) by id, falling back to the German default in the data. */
export function tContent(id: string, field: 'name' | 'desc', fallback: string): string {
  return contentOverlays[locale][`${id}.${field}`] ?? fallback;
}
