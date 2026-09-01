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
 * Translation key for a tag. Any tag that is not one of the built-in
 * categories is a free-form hashtag a user typed in, so it falls through to
 * the tag string itself — exactly right, since there is no translation for
 * made-up text.
 */
export function getCategoryTranslationKey(tag: string): string {
  return TRANSLATION_KEYS[tag] ?? tag;
}

export function isStandardCategory(tag: string): boolean {
  return tag in TRANSLATION_KEYS;
}
