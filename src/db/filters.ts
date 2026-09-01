import { and, between, isNotNull, sql } from 'drizzle-orm';

import { listings } from './schema';
import { CITY_COORDS, boundingBox } from '@/lib/geo';

/**
 * Restricts a listings query to rows within `radiusKm` of a named place.
 *
 * The place arrives as a *name*, looked up here rather than taken as
 * coordinates from the URL: a crafted link cannot ask about an arbitrary
 * point, and the query string stays readable. An unknown name returns
 * undefined, which drizzle's `and()` drops — the filter is simply not applied
 * rather than silently matching nothing.
 *
 * Two steps on purpose. The bounding box is a plain range scan the
 * (lat, lng) index can serve, and it is deliberately a little wide; the
 * great-circle distance then trims the corners of that box to a true circle.
 * Doing only the second step would mean computing a trigonometric distance
 * for every row in the table.
 *
 * Rows with no coordinates — a location free text we could not place — are
 * excluded rather than assumed to be nearby.
 */
export function withinRadius(place: string, radiusKm: number) {
  const coords = CITY_COORDS[place];
  if (!coords) return undefined;

  const box = boundingBox(coords.lat, coords.lng, radiusKm);

  return and(
    isNotNull(listings.lat),
    isNotNull(listings.lng),
    between(listings.lat, box.minLat, box.maxLat),
    between(listings.lng, box.minLng, box.maxLng),
    sql`6371 * 2 * asin(sqrt(
      power(sin(radians(${listings.lat} - ${coords.lat}) / 2), 2) +
      cos(radians(${coords.lat})) * cos(radians(${listings.lat})) *
      power(sin(radians(${listings.lng} - ${coords.lng}) / 2), 2)
    )) <= ${radiusKm}`,
  );
}

/** The place name from a URL parameter, only if it is one we actually know. */
export function resolvePlaceParam(value: string | undefined): string | null {
  if (!value) return null;

  const match = Object.keys(CITY_COORDS).find(
    (place) => place.toLowerCase() === value.trim().toLowerCase(),
  );

  return match ?? null;
}
