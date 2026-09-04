/*
 * The built-in categories, in the order their tabs are rendered. They are
 * stored as plain German tag strings because that is what ends up in
 * `listings.tags` in the database; the UI never shows the raw string, it
 * shows `t(getCategoryTranslationKey(tag))`.
 *
 * Single source of truth on purpose: the create-listing form offers exactly
 * these as quick-pick tags and the marketplace renders exactly these as the
 * always-present tabs. Two independent copies drift the moment one side
 * gains a category, and a tab whose id is not a real tag filters to nothing.
 */
export const STANDARD_CATEGORY_TAGS = [
  'Familie',
  'Kinder',
  'Wochenende',
  'Mobilität',
  'Pendeln',
  'Verkauf',
  'Dienstleistungen',
  'Transport',
  'Bildung',
] as const;

const TRANSLATION_KEYS: Record<string, string> = {
  Familie: 'category_family',
  Kinder: 'category_children',
  Wochenende: 'category_weekend',
  Mobilität: 'category_mobility',
  Pendeln: 'category_commuting',
  Verkauf: 'category_sale',
  Dienstleistungen: 'category_services',
  Transport: 'category_transport',
  Bildung: 'category_education',
};

/**
 * Translation key for a tag.
 *
 * `Object.hasOwn`, never `in` or a bare lookup: tags are user input, and
 * every plain object inherits from Object.prototype. `'constructor' in
 * TRANSLATION_KEYS` is true and `TRANSLATION_KEYS['constructor']` is a
 * function — so a tag named after a prototype member would otherwise be
 * mistaken for a built-in category and hand a function to the renderer.
 */
export function getCategoryTranslationKey(tag: string): string {
  return Object.hasOwn(TRANSLATION_KEYS, tag) ? TRANSLATION_KEYS[tag] : tag;
}

export function isStandardCategory(tag: string): boolean {
  return Object.hasOwn(TRANSLATION_KEYS, tag);
}

/**
 * What a tag reads as in the UI.
 *
 * A built-in category is translated; anything else is a hashtag somebody
 * typed and is shown verbatim. Passing a user tag to `t()` would let it
 * resolve against the whole translation table — a listing tagged `logout`
 * would render a tab labelled "Log out" — so only known keys are looked up.
 */
export function categoryLabel(tag: string, t: (key: string) => string): string {
  return isStandardCategory(tag) ? t(getCategoryTranslationKey(tag)) : tag;
}
