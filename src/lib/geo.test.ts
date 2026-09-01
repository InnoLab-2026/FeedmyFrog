import { describe, expect, it } from 'vitest';

import {
  CITY_COORDS,
  DEFAULT_RADIUS_KM,
  DISTRICT_OF,
  GPS_MAX_DISTANCE_KM,
  RADII,
  boundingBox,
  findNearestTown,
  haversineKm,
  isRadius,
  isTown,
  resolveLocation,
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

describe('resolveLocation', () => {
  it('matches an exact name', () => {
    expect(resolveLocation('Reutlingen')?.place).toBe('Reutlingen');
  });

  it('ignores case and surrounding whitespace', () => {
    expect(resolveLocation('  tÜbingen ')?.place).toBe('Tübingen');
  });

  it('finds a place inside the free text people actually type', () => {
    expect(resolveLocation('72762 Reutlingen')?.place).toBe('Reutlingen');
    expect(resolveLocation('Campus Reutlingen, Gebäude 5')?.place).toBe('Reutlingen');
  });

  it('resolves a name that contains no other place name', () => {
    expect(resolveLocation('Kirchentellinsfurt')?.place).toBe('Kirchentellinsfurt');
  });

  it('takes the broader of two places named at once', () => {
    // "Reutlingen-Betzingen" names a district and its town. Betzingen lies
    // inside Reutlingen, so either answer puts the listing in the right
    // place; picking the longer name just makes it deterministic.
    expect(resolveLocation('Reutlingen-Betzingen')?.place).toBe('Reutlingen');
  });

  it('keeps a district as itself rather than widening it to the town', () => {
    // The opposite of the GPS rule: the author chose to say where the listing
    // is, so widening it would only make the filter less accurate.
    expect(resolveLocation('Betzingen')?.place).toBe('Betzingen');
  });

  it('does not match a name that is only part of a longer word', () => {
    expect(resolveLocation('Reutlingenhausen')).toBeNull();
    expect(resolveLocation('XEningen')).toBeNull();
  });

  it('returns null for somewhere we cannot place', () => {
    expect(resolveLocation('Hamburg')).toBeNull();
    expect(resolveLocation('bei mir zu Hause')).toBeNull();
  });

  it('returns null for empty input rather than guessing', () => {
    expect(resolveLocation('')).toBeNull();
    expect(resolveLocation('   ')).toBeNull();
  });

  it('returns the coordinates the place is listed with', () => {
    expect(resolveLocation('Stuttgart')?.coords).toEqual(CITY_COORDS.Stuttgart);
  });
});

describe('boundingBox', () => {
  it('encloses the circle it is given', () => {
    const { lat, lng } = CITY_COORDS.Reutlingen;
    const box = boundingBox(lat, lng, 10);

    expect(box.minLat).toBeLessThan(lat);
    expect(box.maxLat).toBeGreaterThan(lat);
    expect(box.minLng).toBeLessThan(lng);
    expect(box.maxLng).toBeGreaterThan(lng);
  });

  it('never excludes a point that is genuinely inside the radius', () => {
    // The box is the cheap first pass; missing a row here would lose it from
    // the results entirely, so it has to err wide.
    const { lat, lng } = CITY_COORDS.Reutlingen;
    const radiusKm = 20;
    const box = boundingBox(lat, lng, radiusKm);

    for (let bearing = 0; bearing < 360; bearing += 5) {
      const rad = (bearing * Math.PI) / 180;
      // A point just inside the radius, in every direction.
      const d = (radiusKm * 0.99) / 111.32;
      const pointLat = lat + d * Math.cos(rad);
      const pointLng = lng + (d * Math.sin(rad)) / Math.cos((lat * Math.PI) / 180);

      expect(haversineKm(lat, lng, pointLat, pointLng)).toBeLessThanOrEqual(radiusKm);
      expect(pointLat).toBeGreaterThanOrEqual(box.minLat);
      expect(pointLat).toBeLessThanOrEqual(box.maxLat);
      expect(pointLng).toBeGreaterThanOrEqual(box.minLng);
      expect(pointLng).toBeLessThanOrEqual(box.maxLng);
    }
  });

  it('widens the longitude span more than the latitude span', () => {
    // A degree of longitude is shorter than a degree of latitude at 48°N.
    const box = boundingBox(48.5, 9.2, 10);
    expect(box.maxLng - box.minLng).toBeGreaterThan(box.maxLat - box.minLat);
  });

  it('grows with the radius', () => {
    const small = boundingBox(48.5, 9.2, 5);
    const large = boundingBox(48.5, 9.2, 20);
    expect(large.maxLat - large.minLat).toBeGreaterThan(small.maxLat - small.minLat);
  });

  it('stays finite at the pole instead of dividing by zero', () => {
    const box = boundingBox(90, 0, 10);
    expect(Number.isFinite(box.minLng)).toBe(true);
    expect(Number.isFinite(box.maxLng)).toBe(true);
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
