import { describe, expect, it } from 'vitest';

import {
  CITY_COORDS,
  DISTRICT_OF,
  GPS_MAX_DISTANCE_KM,
  findNearestTown,
  haversineKm,
  isTown,
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
