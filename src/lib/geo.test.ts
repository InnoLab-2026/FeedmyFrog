import { describe, expect, it } from 'vitest';

import {
  CITY_COORDS,
  DEFAULT_RADIUS_KM,
  DISTRICT_OF,
  GPS_MAX_DISTANCE_KM,
  PLACES,
  PLACES_ALPHABETICAL,
  RADII,
  findNearestTown,
  haversineKm,
  isPlace,
  isRadius,
  isTown,
  placesWithin,
} from './geo';

describe('haversineKm', () => {
  it('is zero for the same point', () => {
    expect(haversineKm(48.4914, 9.2042, 48.4914, 9.2042)).toBeCloseTo(0, 6);
  });

  it('is symmetric', () => {
    const a = haversineKm(48.4914, 9.2042, 48.7758, 9.1829);
    const b = haversineKm(48.7758, 9.1829, 48.4914, 9.2042);
    expect(a).toBeCloseTo(b, 9);
  });

  it('matches the known Reutlingen-Stuttgart distance', () => {
    // ~31.7 km as the crow flies.
    const km = haversineKm(48.4914, 9.2042, 48.7758, 9.1829);
    expect(km).toBeGreaterThan(30);
    expect(km).toBeLessThan(33);
  });
});

describe('isTown', () => {
  it('accepts a town', () => {
    expect(isTown('Reutlingen')).toBe(true);
    expect(isTown('Tübingen')).toBe(true);
  });

  it('rejects a district of Reutlingen', () => {
    for (const district of Object.keys(DISTRICT_OF)) {
      expect(isTown(district)).toBe(false);
    }
  });

  it('rejects a place that is not in the list at all', () => {
    expect(isTown('Hamburg')).toBe(false);
  });
});

describe('findNearestTown', () => {
  /*
   * The point of these: a GPS fix must resolve to a town, never to a
   * neighbourhood. Betzingen and Sondelfingen are Reutlingen districts and
   * are physically closer to a fix taken there than the Reutlingen centre
   * is, so a naive nearest-place search returns the district — which is
   * exactly the too-precise answer this feature must not give.
   */
  it('resolves a fix taken in Betzingen to Reutlingen, not to the district', () => {
    const { lat, lng } = CITY_COORDS.Betzingen;
    expect(findNearestTown(lat, lng)?.town).toBe('Reutlingen');
  });

  it('resolves a fix taken in Sondelfingen to Reutlingen', () => {
    const { lat, lng } = CITY_COORDS.Sondelfingen;
    expect(findNearestTown(lat, lng)?.town).toBe('Reutlingen');
  });

  it('never returns a district for any point in the covered area', () => {
    for (let lat = 48.3; lat <= 48.95; lat += 0.05) {
      for (let lng = 8.9; lng <= 9.7; lng += 0.05) {
        const nearest = findNearestTown(lat, lng);
        if (nearest) expect(DISTRICT_OF[nearest.town]).toBeUndefined();
      }
    }
  });

  it('resolves a fix in the town centre to that town', () => {
    for (const [town, coords] of Object.entries(CITY_COORDS)) {
      if (!isTown(town)) continue;
      expect(findNearestTown(coords.lat, coords.lng)?.town).toBe(town);
    }
  });

  it('picks the genuinely nearest town, not the first listed', () => {
    // Just north of Tübingen, well away from Reutlingen.
    expect(findNearestTown(48.53, 9.05)?.town).toBe('Tübingen');
  });

  it('returns null for a position outside the covered area', () => {
    // Hamburg — the old code silently reported "near Stuttgart" here.
    expect(findNearestTown(53.5511, 9.9937)).toBeNull();
  });

  it('returns null rather than reaching across the country', () => {
    expect(findNearestTown(52.52, 13.405)).toBeNull(); // Berlin
    expect(findNearestTown(48.1372, 11.5756)).toBeNull(); // Munich
  });

  it('reports the distance it used, within the cap', () => {
    const nearest = findNearestTown(48.4914, 9.2042);
    expect(nearest).not.toBeNull();
    expect(nearest!.distanceKm).toBeLessThanOrEqual(GPS_MAX_DISTANCE_KM);
  });

  it('honours a caller-supplied cap', () => {
    // Reutlingen centre is ~0 km away, so a 0.1 km cap still matches, but a
    // point 20 km out does not.
    expect(findNearestTown(48.4914, 9.2042, 0.1)?.town).toBe('Reutlingen');
    expect(findNearestTown(48.65, 9.45, 5)).toBeNull();
  });
});

describe('PLACES is a closed set', () => {
  it('has an entry in CITY_COORDS for every name, and no extras', () => {
    expect([...PLACES].sort()).toEqual(Object.keys(CITY_COORDS).sort());
  });

  it('contains no duplicates', () => {
    expect(new Set(PLACES).size).toBe(PLACES.length);
  });

  it('every district resolves to a name that is itself in the set', () => {
    for (const [district, town] of Object.entries(DISTRICT_OF)) {
      expect(PLACES).toContain(district);
      expect(PLACES).toContain(town);
    }
  });

  it('PLACES_ALPHABETICAL is the same set, ordered for German readers', () => {
    expect([...PLACES_ALPHABETICAL].sort()).toEqual([...PLACES].sort());
    expect(PLACES_ALPHABETICAL[0]).toBe('Betzingen');
    // Umlauts sort with their base letter, not after Z.
    expect(PLACES_ALPHABETICAL.indexOf('Böblingen')).toBeLessThan(
      PLACES_ALPHABETICAL.indexOf('Degerschlacht'),
    );
  });
});

describe('isPlace', () => {
  it('accepts every canonical name', () => {
    for (const place of PLACES) expect(isPlace(place)).toBe(true);
  });

  it('rejects the free text the old location field used to accept', () => {
    expect(isPlace('Campus Reutlingen')).toBe(false);
    expect(isPlace('72762 Reutlingen')).toBe(false);
    expect(isPlace('Reutlingen-Betzingen')).toBe(false);
    expect(isPlace('reutlingen')).toBe(false);
    expect(isPlace('')).toBe(false);
  });

  it('rejects a coordinate pair, which is the point of the closed set', () => {
    expect(isPlace('48.49731, 9.20427')).toBe(false);
    expect(isPlace('48.49731')).toBe(false);
  });

  it('rejects non-strings without throwing', () => {
    expect(isPlace(undefined)).toBe(false);
    expect(isPlace(null)).toBe(false);
    expect(isPlace(42)).toBe(false);
    expect(isPlace({ toString: () => 'Reutlingen' })).toBe(false);
  });
});

describe('placesWithin', () => {
  it('always includes the centre itself', () => {
    for (const place of PLACES) {
      expect(placesWithin(place, 3)).toContain(place);
    }
  });

  it('returns only names that are genuinely within the radius', () => {
    const centre = CITY_COORDS.Reutlingen;

    for (const place of placesWithin('Reutlingen', 10)) {
      const coords = CITY_COORDS[place];
      expect(
        haversineKm(centre.lat, centre.lng, coords.lat, coords.lng),
      ).toBeLessThanOrEqual(10);
    }
  });

  it('omits every name outside the radius', () => {
    const near = placesWithin('Reutlingen', 10);

    // Stuttgart is ~32 km from Reutlingen.
    expect(near).not.toContain('Stuttgart');
    expect(near).toContain('Betzingen');
  });

  it('grows monotonically with the radius', () => {
    let previous = 0;

    for (const radius of RADII) {
      const count = placesWithin('Reutlingen', radius).length;
      expect(count).toBeGreaterThanOrEqual(previous);
      previous = count;
    }
  });

  it('is symmetric — if A is near B then B is near A', () => {
    for (const a of PLACES) {
      for (const b of placesWithin(a, 20)) {
        expect(placesWithin(b, 20)).toContain(a);
      }
    }
  });

  it('returns an empty array for anything not in the set', () => {
    expect(placesWithin('Hamburg', 10)).toEqual([]);
    expect(placesWithin('48.49731, 9.20427', 10)).toEqual([]);
    expect(placesWithin('', 10)).toEqual([]);
  });
});

describe('radius options', () => {
  it('accepts every radius the UI offers', () => {
    for (const radius of RADII) expect(isRadius(radius)).toBe(true);
  });

  it('rejects anything else, so a crafted URL cannot widen the search', () => {
    expect(isRadius(500)).toBe(false);
    expect(isRadius(0)).toBe(false);
    expect(isRadius(Number.NaN)).toBe(false);
  });

  it('offers the default as one of the options', () => {
    expect(isRadius(DEFAULT_RADIUS_KM)).toBe(true);
  });
});
