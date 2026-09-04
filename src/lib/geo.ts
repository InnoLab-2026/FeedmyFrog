/**
 * Places the location filter knows about, and the rule for turning a device
 * position into one of them.
 *
 * Pure and framework-free so the snapping rule can be tested directly — the
 * privacy-relevant part of the GPS feature is exactly this rule, and it is
 * not something to leave sitting untested inside a component.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Every location this platform knows, and the only values `listings.location`
 * may hold.
 *
 * A closed set, not a suggestion list. The create and edit forms render it as
 * a <select> and `ListingInput` in src/lib/validators.ts validates against it,
 * so a location is a *choice from this list* rather than something a user
 * writes. That is what keeps a street address, a house number, or a raw
 * coordinate pair from ever reaching the database in the location field.
 *
 * Declared `as const` so it is a tuple of string literals: `z.enum(PLACES)`
 * infers the exact union, and `Place` below is that union rather than
 * `string`, so a typo anywhere in the codebase is a compile error.
 */
export const PLACES = [
  'Reutlingen',
  'Betzingen',
  'Sondelfingen',
  'Oferdingen',
  'Gönningen',
  'Degerschlacht',
  'Mössingen',
  'Pfullingen',
  'Eningen',
  'Wannweil',
  'Kirchentellinsfurt',
  'Stuttgart',
  'Tübingen',
  'Esslingen',
  'Ludwigsburg',
  'Waiblingen',
  'Böblingen',
  'Sindelfingen',
  'Göppingen',
  'Fellbach',
] as const;

export type Place = (typeof PLACES)[number];

export function isPlace(value: unknown): value is Place {
  return typeof value === 'string' && (PLACES as readonly string[]).includes(value);
}

/**
 * The place list in the order a reader scans a dropdown, rather than the
 * order the table happens to be written in. Sorted with the German collation
 * so "Böblingen" and "Gönningen" land where a German speaker looks for them
 * instead of after "Z".
 */
export const PLACES_ALPHABETICAL: readonly Place[] = [...PLACES].sort((a, b) =>
  a.localeCompare(b, 'de'),
);

/**
 * Coordinates of each place, used for two things and stored for neither:
 * snapping a GPS fix to the nearest place, and working out which places lie
 * within a radius of another. The database holds only the place *name* — the
 * coordinates are a constant of this table, so storing them per row would be
 * duplicating a lookup as personal data.
 */
export const CITY_COORDS: Record<Place, Coordinates> = {
  Reutlingen: { lat: 48.4914, lng: 9.2042 },
  Betzingen: { lat: 48.5089, lng: 9.1756 },
  Sondelfingen: { lat: 48.508, lng: 9.233 },
  Oferdingen: { lat: 48.526, lng: 9.24 },
  Gönningen: { lat: 48.43, lng: 9.15 },
  Degerschlacht: { lat: 48.515, lng: 9.168 },
  Mössingen: { lat: 48.4064, lng: 9.0542 },
  Pfullingen: { lat: 48.4644, lng: 9.2261 },
  Eningen: { lat: 48.486, lng: 9.255 },
  Wannweil: { lat: 48.515, lng: 9.15 },
  Kirchentellinsfurt: { lat: 48.531, lng: 9.147 },
  Stuttgart: { lat: 48.7758, lng: 9.1829 },
  Tübingen: { lat: 48.5216, lng: 9.0576 },
  Esslingen: { lat: 48.7394, lng: 9.3068 },
  Ludwigsburg: { lat: 48.8975, lng: 9.1916 },
  Waiblingen: { lat: 48.8302, lng: 9.3189 },
  Böblingen: { lat: 48.6831, lng: 9.0107 },
  Sindelfingen: { lat: 48.7155, lng: 9.0018 },
  Göppingen: { lat: 48.703, lng: 9.6531 },
  Fellbach: { lat: 48.8132, lng: 9.2755 },
};

/*
 * Districts of Reutlingen. They stay in the list because someone may well
 * want to say their listing is in Betzingen — but a GPS fix must never
 * resolve to one. Snapping a position to a district pins the reader to a
 * neighbourhood, which says far more about where they are than a
 * "listings near me" filter has any need to know.
 */
export const DISTRICT_OF: Partial<Record<Place, Place>> = {
  Betzingen: 'Reutlingen',
  Sondelfingen: 'Reutlingen',
  Oferdingen: 'Reutlingen',
  Degerschlacht: 'Reutlingen',
  Gönningen: 'Reutlingen',
};

/**
 * Beyond this, the nearest town is not somewhere the reader plausibly is, so
 * no town is returned at all. Without the guard someone in Hamburg was
 * silently labelled as being near Stuttgart, 600 km away.
 */
export const GPS_MAX_DISTANCE_KM = 50;

export function isTown(place: string): boolean {
  return place in CITY_COORDS && !(place in DISTRICT_OF);
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * The town a device position belongs to, or null when the position is not in
 * the area this platform covers.
 *
 * Districts take part in the search but are never the answer: the nearest
 * reference point wins, and a district then resolves to its parent town. That
 * ordering matters both ways round. A fix taken in Betzingen is closer to
 * Wannweil's centre than to Reutlingen's, so excluding districts outright
 * would put a Reutlingen resident in the next municipality; and returning the
 * district itself would pin them to a neighbourhood. Going through the
 * district gets the town right without ever narrowing past it.
 *
 * The caller keeps the returned town's coordinates and throws the device
 * position away, so nothing downstream sees a position more precise than a
 * town centre.
 */
export function findNearestTown(
  lat: number,
  lng: number,
  maxDistanceKm: number = GPS_MAX_DISTANCE_KM,
): { town: Place; distanceKm: number } | null {
  let nearest: { place: Place; distanceKm: number } | null = null;

  for (const place of PLACES) {
    const coords = CITY_COORDS[place];
    const distanceKm = haversineKm(lat, lng, coords.lat, coords.lng);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { place, distanceKm };
    }
  }

  if (!nearest || nearest.distanceKm > maxDistanceKm) return null;

  return {
    town: DISTRICT_OF[nearest.place] ?? nearest.place,
    distanceKm: nearest.distanceKm,
  };
}

/** Radius options offered in the UI, in kilometres. */
export const RADII = [3, 5, 10, 20] as const;

export const DEFAULT_RADIUS_KM = 10;

export function isRadius(value: number): boolean {
  return (RADII as readonly number[]).includes(value);
}

/**
 * The places lying within `radiusKm` of `place`, including `place` itself.
 *
 * This is the whole radius filter. With a closed set of twenty locations the
 * question "which listings are near here?" is answered by working out which
 * *names* are near here — twenty great-circle distances in memory, once per
 * request — and then asking the database for `location IN (…)`.
 *
 * That replaces a stored coordinate pair per row, a bounding-box range scan
 * and a trigonometric distance evaluated per row. It is less code, less
 * work for Postgres, and it means the database never holds a coordinate at
 * all: the only geodata at rest is a place name from this list.
 *
 * An unknown place yields an empty array, which the caller turns into "no
 * filter" rather than "matches nothing".
 */
export function placesWithin(place: string, radiusKm: number): Place[] {
  if (!isPlace(place)) return [];

  const centre = CITY_COORDS[place];

  return PLACES.filter((candidate) => {
    const coords = CITY_COORDS[candidate];
    return haversineKm(centre.lat, centre.lng, coords.lat, coords.lng) <= radiusKm;
  });
}
