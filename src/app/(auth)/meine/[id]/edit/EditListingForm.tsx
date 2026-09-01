'use client';
import { useActionState } from 'react';
import { useTranslation } from 'react-i18next';
import KnownPlacesDatalist, {
  KNOWN_PLACES_LIST_ID,
} from '@/components/marketplace/KnownPlacesDatalist';
import { updateListing, type UpdateState } from '@/actions/listings';
import type { Listing } from '@/types';

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
      style={{ background: 'white', border: '2px solid black' }}
    >
      <input type="hidden" name="id" value={listing.id} />

      <fieldset>
        <legend style={{ fontWeight: 600, marginBottom: '8px' }}>{t('type')}</legend>
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
          maxLength={120}
          defaultValue={listing.title}
          className="px-4 py-2 rounded-xl"
          style={{ border: '2px solid black' }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span style={{ fontWeight: 500 }}>{t('description')}</span>
        <textarea
          name="description"
          required
          maxLength={2000}
          rows={5}
          defaultValue={listing.description}
          className="px-4 py-2 rounded-xl"
          style={{ border: '2px solid black' }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span style={{ fontWeight: 500 }}>{t('tags_label')}</span>
        <input
          name="tags"
          defaultValue={listing.tags.join(', ')}
          placeholder={t('custom_tags_placeholder')}
          className="px-4 py-2 rounded-xl"
          style={{ border: '2px solid black' }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span style={{ fontWeight: 500 }}>{t('location')}</span>
        <input
          name="location"
          required
          maxLength={80}
          list={KNOWN_PLACES_LIST_ID}
          defaultValue={listing.location}
          className="px-4 py-2 rounded-xl"
          style={{ border: '2px solid black' }}
        />
        <KnownPlacesDatalist />
      </label>

      {state && !state.ok && (
        <ul role="alert" style={{ color: 'red', fontSize: 'var(--fs-sm)' }}>
          {Object.entries(state.errors).flatMap(([field, codes]) =>
            codes.map((code, i) => (
              <li key={`${field}-${i}`}>{t(`error_${code}`)}</li>
            )),
          )}
        </ul>
      )}

      <button
        type="submit"
        disabled={pending}
        className="py-3 rounded-xl"
        style={{ background: 'black', color: 'white', fontWeight: 600 }}
      >
        {pending ? t('saving') : t('save_changes')}
      </button>
    </form>
  );
}
