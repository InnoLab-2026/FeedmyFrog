'use client';
import { useActionState } from 'react';
import { useTranslation } from 'react-i18next';
import PlaceSelect from '@/components/marketplace/PlaceSelect';
import { updateListing, type UpdateState } from '@/actions/listings';
import type { Listing } from '@/types';
import {
  DESCRIPTION_MAX_LENGTH,
  LISTING_LIMIT_VALUES,
  TITLE_MAX_LENGTH,
} from '@/lib/listingLimits';

/*
 * One style for all four fields, so they cannot drift apart. Inline rather
 * than Tailwind classes because the colours are theme tokens and the rest of
 * this form is written the same way.
 */
const fieldStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: 'var(--input-bg)',
  color: 'var(--page-fg)',
  border: '1px solid var(--control-border)',
  borderRadius: '10px',
  fontSize: 'var(--fs-control-input)',
};

export default function EditListingForm({ listing }: { listing: Listing }) {
  const { t } = useTranslation();
  const [state, action, pending] = useActionState<UpdateState | null, FormData>(
    updateListing,
    null,
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-4 p-6 rounded-2xl"
      style={{
        background: 'var(--card-bg)',
        color: 'var(--page-fg)',
        border: 'var(--card-border-strong)',
      }}
    >
      <input type="hidden" name="id" value={listing.id} />

      <fieldset>
        <legend style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--page-fg)' }}>
          {t('type')}
        </legend>
        <label className="mr-4">
          <input
            type="radio"
            name="type"
            value="need"
            defaultChecked={listing.type === 'need'}
          />{' '}
          {t('mode_need')}
        </label>
        <label>
          <input
            type="radio"
            name="type"
            value="offer"
            defaultChecked={listing.type === 'offer'}
          />{' '}
          {t('mode_offer')}
        </label>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span style={{ fontWeight: 500 }}>{t('title')}</span>
        <input
          name="title"
          required
          maxLength={TITLE_MAX_LENGTH}
          defaultValue={listing.title}
          style={fieldStyle}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span style={{ fontWeight: 500 }}>{t('description')}</span>
        <textarea
          name="description"
          required
          maxLength={DESCRIPTION_MAX_LENGTH}
          rows={5}
          defaultValue={listing.description}
          style={fieldStyle}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span style={{ fontWeight: 500 }}>{t('tags_label')}</span>
        <input
          name="tags"
          defaultValue={listing.tags.join(', ')}
          placeholder={t('custom_tags_placeholder')}
          style={fieldStyle}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span style={{ fontWeight: 500 }}>{t('location')}</span>
        <PlaceSelect
          name="location"
          required
          defaultValue={listing.location}
          style={fieldStyle}
        />
      </label>

      {state && !state.ok && (
        <ul role="alert" style={{ color: 'var(--danger-fg)', fontSize: 'var(--fs-sm)' }}>
          {Object.entries(state.errors).flatMap(([field, codes]) =>
            codes.map((code, i) => (
              <li key={`${field}-${i}`}>
                {t(`error_${code}`, LISTING_LIMIT_VALUES)}
              </li>
            )),
          )}
        </ul>
      )}

      <button
        type="submit"
        disabled={pending}
        className="py-3 rounded-xl"
        style={{
          background: '#8DC63F',
          color: 'var(--on-accent)',
          fontWeight: 600,
          border: 'none',
          cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.65 : 1,
        }}
      >
        {pending ? t('saving') : t('save_changes')}
      </button>
    </form>
  );
}
