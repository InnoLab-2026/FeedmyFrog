import { inArray } from 'drizzle-orm';

import { listings } from './schema';
import { PLACES, isPlace, placesWithin } from '@/lib/geo';

/**
 * Restricts a listings query to rows whose location is within `radiusKm` of a
 * named place.
 *
 * Because `listings.location` is a closed set of twenty names, "near here" is
 * a question about *names*: placesWithin() does twenty great-circle distances
 * in memory, once per request, and the database is asked for a plain
 * `location IN (…)`. No coordinate is stored per row, no bounding box is
 * scanned, and no trigonometry runs inside Postgres.
 *
 * The place arrives as a name and is validated against the same table rather
 * than trusted, so a crafted link cannot ask about an arbitrary point. An
 * unknown name returns undefined, which drizzle's `and()` drops — the filter
 * is simply not applied rather than silently matching nothing.
 */
export function withinRadius(place: string, radiusKm: number) {
  const nearby = placesWithin(place, radiusKm);
  if (nearby.length === 0) return undefined;

  return inArray(listings.location, nearby);
}

/** The place name from a URL parameter, only if it is one we actually know. */
export function resolvePlaceParam(value: string | undefined): string | null {
  if (!value) return null;

  const needle = value.trim().toLowerCase();
  const match = PLACES.find((place) => place.toLowerCase() === needle);

  return match ?? null;
}

export { isPlace };
