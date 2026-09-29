'use client';
import { useActionState, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PlaceSelect from '@/components/marketplace/PlaceSelect';
import { updateListing, type UpdateState } from '@/actions/listings';
import type { Listing, Mode } from '@/types';
import {
  STANDARD_CATEGORY_TAGS,
  categoryLabel,
  isStandardCategory,
} from '@/data/categories';
import {
  DESCRIPTION_MAX_LENGTH,
  LISTING_LIMIT_VALUES,
  MAX_CATEGORIES,
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
  const [type, setType] = useState<Mode>(listing.type);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    listing.tags.filter(isStandardCategory).slice(0, MAX_CATEGORIES),
  );
  const [customTags, setCustomTags] = useState(() =>
    listing.tags.filter((tag) => !isStandardCategory(tag)).join(', '),
  );
  const [state, action, pending] = useActionState<UpdateState | null, FormData>(
    updateListing,
    null,
  );

  const allTags = [
    ...new Set([
      ...selectedCategories,
      ...customTags.split(',').map((tag) => tag.trim()).filter(Boolean),
    ]),
  ];
  const categoryLimitReached = selectedCategories.length >= MAX_CATEGORIES;

  function toggleCategory(tag: string) {
    setSelectedCategories((current) => {
      if (current.includes(tag)) return current.filter((item) => item !== tag);
      if (current.length >= MAX_CATEGORIES) return current;
      return [...current, tag];
    });
  }

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
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="tags" value={allTags.join(',')} />

      <fieldset>
        <legend style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--page-fg)' }}>
          {t('type')} *
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['need', 'offer'] as Mode[]).map((option) => {
            const selected = type === option;

            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setType(option)}
                style={{
                  minHeight: '62px',
                  background: selected ? '#8DC63F' : 'var(--input-bg)',
                  color: selected ? 'var(--on-accent)' : 'var(--page-fg)',
                  border: selected
                    ? '1px solid #8DC63F'
                    : '1px solid var(--control-border)',
                  borderRadius: '9px',
                  fontSize: 'var(--fs-lg)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: 'var(--elevation-sm)',
                }}
              >
                {option === 'need' ? t('mode_need') : t('mode_offer')}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--page-fg)' }}>
          {t('choose_tags')} *
        </legend>
        <p
          style={{
            margin: '0 0 12px',
            color: 'var(--muted-fg)',
            fontSize: 'var(--fs-xs)',
          }}
        >
          {t('choose_tags_hint', { max: MAX_CATEGORIES })}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {STANDARD_CATEGORY_TAGS.map((tag) => {
            const selected = selectedCategories.includes(tag);
            const blocked = categoryLimitReached && !selected;

            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                disabled={blocked}
                onClick={() => toggleCategory(tag)}
                style={{
                  minHeight: '50px',
                  padding: '0 16px',
                  textAlign: 'left',
                  background: selected ? '#8DC63F' : 'var(--input-bg)',
                  color: selected ? 'var(--on-accent)' : 'var(--page-fg)',
                  border: selected
                    ? '1px solid #8DC63F'
                    : '1px solid var(--control-border)',
                  borderRadius: '8px',
                  fontSize: 'var(--fs-md)',
                  fontWeight: 500,
                  cursor: blocked ? 'not-allowed' : 'pointer',
                  opacity: blocked ? 0.55 : 1,
                  boxShadow: 'var(--elevation-sm)',
                }}
              >
                {categoryLabel(tag, t)}
              </button>
            );
          })}
        </div>
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
        <span style={{ fontWeight: 500 }}>{t('custom_tags_optional')}</span>
        <input
          value={customTags}
          onChange={(event) => setCustomTags(event.target.value)}
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
        disabled={pending || selectedCategories.length === 0}
        className="py-3 rounded-xl"
        style={{
          background: '#8DC63F',
          color: 'var(--on-accent)',
          fontWeight: 600,
          border: 'none',
          cursor: pending || selectedCategories.length === 0 ? 'not-allowed' : 'pointer',
          opacity: pending || selectedCategories.length === 0 ? 0.65 : 1,
        }}
      >
        {pending ? t('saving') : t('save_changes')}
      </button>
    </form>
  );
}
