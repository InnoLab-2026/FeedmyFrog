/**
 * Avatar initials derived from an email's local part (the piece before
 * `@`, i.e. the login name): the first non-symbol character, plus one
 * more per "." in the local part, each taken from the start of its own
 * segment — e.g. "anna@..." -> "A", "max.mustermann@..." -> "MM".
 */
export function getInitials(email: string): string {
  const local = email.split('@')[0] ?? '';
  const segments = local.split('.');

  const letters = segments
    .map((segment) => segment.match(/[\p{L}\p{N}]/u)?.[0])
    .filter((char): char is string => Boolean(char))
    .map((char) => char.toUpperCase());

  return letters.join('') || '?';
}
