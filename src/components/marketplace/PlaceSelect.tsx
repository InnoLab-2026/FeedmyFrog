'use client';

import type { SelectHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { PLACES_ALPHABETICAL } from '@/lib/geo';

type PlaceSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children'
>;

/**
 * The location field, for both listing forms.
 *
 * A <select> over the closed place list rather than a text box with
 * suggestions. The difference is not cosmetic: a free-text field invites a
 * street, a house number, or a pasted coordinate pair, and whatever is typed
 * is stored verbatim and shown on the card. A dropdown can only ever produce
 * one of twenty names.
 *
 * The empty first option is deliberately a real, selectable value rather than
 * a `disabled` label, so `required` catches a form submitted without a choice
 * and the browser shows its own message. The server re-checks against the
 * same list regardless — this component is the convenience, `ListingInput` is
 * the boundary.
 *
 * Place names are proper nouns and are not translated; only the placeholder
 * is.
 */
export default function PlaceSelect(props: PlaceSelectProps) {
  const { t } = useTranslation();

  return (
    <select {...props}>
      <option value="">{t('location_select')}</option>
      {PLACES_ALPHABETICAL.map((place) => (
        <option key={place} value={place}>
          {place}
        </option>
      ))}
    </select>
  );
}
