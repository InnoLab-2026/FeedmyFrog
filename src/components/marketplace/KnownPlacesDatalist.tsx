'use client';

import { CITY_COORDS } from '@/lib/geo';

export const KNOWN_PLACES_LIST_ID = 'known-places';

/**
 * Suggestions for the listing forms' location field.
 *
 * The field stays free text — "Campus Reutlingen" is a reasonable thing to
 * write, and a dropdown would refuse it. But only a location that
 * resolveLocation() can place gets coordinates, and only a listing with
 * coordinates shows up under a radius filter, so it is worth nudging people
 * towards a name the app knows. A <datalist> suggests without constraining.
 */
export default function KnownPlacesDatalist() {
  return (
    <datalist id={KNOWN_PLACES_LIST_ID}>
      {Object.keys(CITY_COORDS).map((place) => (
        <option key={place} value={place} />
      ))}
    </datalist>
  );
}
