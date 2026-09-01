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

export const CITY_COORDS: Record<string, Coordinates> = {
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
export const DISTRICT_OF: Record<string, string> = {
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
): { town: string; distanceKm: number } | null {
  let nearest: { place: string; distanceKm: number } | null = null;

  for (const [place, coords] of Object.entries(CITY_COORDS)) {
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
 * Coordinates for a listing's free-text location, or null when it names
 * nowhere we know.
 *
 * The create form takes free text on purpose — "Campus Reutlingen" is a
 * perfectly good thing to write — so this has to be forgiving: an exact name
 * first, then a known place appearing as a whole word inside the text, which
 * catches the "72762 Reutlingen" people actually type. Whole words only, so
 * "Reutlingenhausen" is not read as Reutlingen.
 *
 * When a text names two places at once ("Reutlingen-Betzingen"), the longest
 * name wins. That is the broader of the two, which is the safe direction:
 * the district lies inside its town, so the answer is right either way, and
 * the rule is at least deterministic.
 *
 * Unlike a GPS fix, a district resolves to itself: the author chose to say
 * where their listing is, and narrowing that to the parent town would only
 * make the filter less accurate.
 */
export function resolveLocation(text: string): { place: string; coords: Coordinates } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();

  for (const place of Object.keys(CITY_COORDS)) {
    if (place.toLowerCase() === normalized) {
      return { place, coords: CITY_COORDS[place] };
    }
  }

  let best: string | null = null;
  let bestLength = 0;

  for (const place of Object.keys(CITY_COORDS)) {
    const name = place.toLowerCase();
    // Word boundaries by hand: \b does not treat "ö" or "ü" as word
    // characters, so it would split "Mössingen" in the wrong places.
    const index = normalized.indexOf(name);
    if (index === -1) continue;

    const before = normalized[index - 1];
    const after = normalized[index + name.length];
    const isBoundary = (char: string | undefined) =>
      char === undefined || !/[\p{L}\p{N}]/u.test(char);

    if (!isBoundary(before) || !isBoundary(after)) continue;

    if (name.length > bestLength) {
      best = place;
      bestLength = name.length;
    }
  }

  return best ? { place: best, coords: CITY_COORDS[best] } : null;
}

/**
 * Latitude/longitude bounds enclosing a circle, so the database can narrow
 * with an index before the exact great-circle distance is computed. The box
 * is deliberately a little generous — it may admit rows the precise check
 * then rejects, which is the safe direction to be wrong in.
 */
export function boundingBox(
  lat: number,
  lng: number,
  radiusKm: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const KM_PER_DEGREE_LAT = 111.32;

  const deltaLat = radiusKm / KM_PER_DEGREE_LAT;

  // A degree of longitude shrinks towards the poles. The floor keeps the
  // division finite if this is ever called somewhere extreme.
  const shrink = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  const deltaLng = radiusKm / (KM_PER_DEGREE_LAT * shrink);

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLng: lng - deltaLng,
    maxLng: lng + deltaLng,
  };
}
