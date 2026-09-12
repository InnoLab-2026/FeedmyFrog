/*
 * The field lengths a listing must satisfy, named once.
 *
 * Each of these numbers has to be true in four places at the same time: the
 * schema in validators.ts, the `maxLength` on the control, the character
 * counter beside it, and the sentence the reader is shown when they go over.
 * Spelled out at each site they drift, and the drift is invisible -- nothing
 * compares a counter against a validator, and nothing compares a translated
 * "at most 2000 characters" against either.
 *
 * Its own module rather than part of validators.ts, because validators.ts
 * imports lib/env, which is `server-only`: a client component that imported
 * the limits from there would fail the build. Nothing is imported here, so
 * both sides can have them.
 */
export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 400;
export const TAG_MAX_LENGTH = 40;
export const TAGS_MAX_COUNT = 8;

/**
 * Interpolation values for the `error_*` strings that quote a limit.
 *
 * Passed wholesale at the one place error codes are rendered: the code decides
 * which placeholder its sentence names and i18next ignores the rest, so a new
 * limit needs no change at the call site. This is what keeps the number in the
 * message identical to the number the validator enforced — in every language,
 * rather than in whichever ones somebody remembered to edit.
 */
export const LISTING_LIMIT_VALUES = {
  titleMin: TITLE_MIN_LENGTH,
  titleMax: TITLE_MAX_LENGTH,
  descriptionMin: DESCRIPTION_MIN_LENGTH,
  descriptionMax: DESCRIPTION_MAX_LENGTH,
  tagMax: TAG_MAX_LENGTH,
  tagsMax: TAGS_MAX_COUNT,
} as const;
