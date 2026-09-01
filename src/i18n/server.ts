import 'server-only';
import { cookies, headers } from 'next/headers';

import { resources, type LangCode } from './translations';
import { legalResources } from './legalResources';
import {
  DEFAULT_LANGUAGE,
  LANG_COOKIE,
  parseAcceptLanguage,
  pickLanguage,
} from './matchLanguage';

/**
 * The language to render this request in.
 *
 * Order of preference:
 *   1. the `lang` cookie — an explicit choice from the language switcher,
 *   2. `Accept-Language` — what the browser says the reader prefers,
 *   3. English.
 *
 * Resolving this on the server is what lets `<html lang>` and every page
 * title be right in the first byte of HTML. Reading a cookie opts the route
 * into dynamic rendering, which costs nothing here: every page except
 * /robots.txt is already dynamic (session checks and `force-dynamic`).
 */
export async function getRequestLanguage(): Promise<LangCode> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  const chosen = cookieStore.get(LANG_COOKIE)?.value;
  const accepted = parseAcceptLanguage(headerList.get('accept-language'));

  return pickLanguage([chosen, ...accepted]) ?? DEFAULT_LANGUAGE;
}

/**
 * Translation lookup for server components and `generateMetadata`.
 *
 * A plain read from the resource object rather than an i18next instance: this
 * runs on a module shared by every concurrent request, and a lookup that
 * cannot hold state cannot mix two readers' languages up. Falls back to
 * English for a key a locale is missing, the same as i18next would.
 */
export function serverT(language: LangCode, key: keyof typeof resources.en.translation): string {
  const table = resources[language].translation as Record<string, string>;
  const fallback = resources.en.translation as Record<string, string>;

  return table[key] ?? fallback[key] ?? key;
}

/** Title of a legal document, for the two legal pages' metadata. */
export function serverLegalTitle(
  language: LangCode,
  document: 'privacy' | 'imprint',
): string {
  return legalResources[language][document].title;
}
