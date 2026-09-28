/**
 * Bilingual string support for the data files.
 *
 * Prose fields in src/data/*.ts are written as `l('English', 'Indonesian')`.
 * `localize()` walks a data object and resolves every such pair into a plain
 * string for the chosen language, and `Localized<T>` is the matching type.
 * Ids, dates, URLs, tags, tool names and union keys stay as they are.
 */

export type Lang = 'en' | 'id';
export const LANGS: readonly Lang[] = ['en', 'id'];

/** A string in both languages. An empty `id` falls back to `en`. */
export interface L { en: string; id: string }
export const l = (en: string, id: string): L => ({ en, id });

export type Localized<T> =
  T extends L ? string :
  T extends string | number | boolean | null | undefined ? T :
  T extends readonly (infer U)[] ? Localized<U>[] :
  T extends object ? { [K in keyof T]: Localized<T[K]> } :
  T;

const isL = (v: object): v is L => typeof (v as L).en === 'string' && typeof (v as L).id === 'string';

export function localize<T>(value: T, lang: Lang): Localized<T> {
  if (Array.isArray(value)) return value.map((v) => localize(v, lang)) as Localized<T>;
  if (value !== null && typeof value === 'object') {
    if (isL(value)) return (value[lang] || value.en) as Localized<T>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = localize(v, lang);
    return out as Localized<T>;
  }
  return value as Localized<T>;
}
