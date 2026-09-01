import { LANGUAGES, type LangCode } from './translations';

/**
 * Name of the cookie carrying an explicit language choice.
 *
 * It has to be a cookie rather than localStorage: the server renders the
 * page and its <title>, so it needs to know the reader's language before any
 * JavaScript runs. localStorage is invisible to the server, which is why the
 * app used to serve every page in English and correct itself after hydration.
 */
export const LANG_COOKIE = 'lang';

/** One year — a language choice is not something to ask about again soon. */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DEFAULT_LANGUAGE: LangCode = 'en';

const SUPPORTED = new Set<string>(LANGUAGES.map((l) => l.code));

function isSupported(code: string): code is LangCode {
  return SUPPORTED.has(code);
}

/**
 * Narrows a BCP 47 tag to a language we actually have translations for:
 * `de-AT` and `DE` both become `de`. Region and script subtags are dropped
 * because the resources are per language, not per locale.
 */
export function normalizeLanguage(tag: string | null | undefined): LangCode | null {
  if (!tag) return null;

  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  return isSupported(base) ? base : null;
}

/**
 * Parses an `Accept-Language` header into tags ordered by descending quality,
 * per RFC 9110 §12.5.4. Entries without an explicit `q` default to 1.0, and
 * ties keep the order the client sent, which is already its preference order.
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];

  return header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
        ?.slice(2);

      const quality = q === undefined ? 1 : Number.parseFloat(q);

      return {
        tag: tag.trim(),
        // A malformed q is treated as unacceptable rather than as 1.0, so a
        // broken header cannot outrank a well-formed one.
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .filter((entry) => entry.tag !== '' && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
    .map((entry) => entry.tag);
}

/**
 * First supported language among the candidates, in the order given, or null.
 * Callers pass their preference chain — explicit choice first, then whatever
 * the browser asked for.
 */
export function pickLanguage(
  candidates: Array<string | null | undefined>,
): LangCode | null {
  for (const candidate of candidates) {
    const code = normalizeLanguage(candidate);
    if (code) return code;
  }

  return null;
}
