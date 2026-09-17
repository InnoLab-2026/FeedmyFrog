'use client';

import { useActionState, useEffect, useId, useState } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  createListing,
  type CreateState,
} from '@/actions/listings';

import type { Mode } from '@/types';
import {
  STANDARD_CATEGORY_TAGS,
  categoryLabel,
} from '@/data/categories';
import PlaceSelect from '@/components/marketplace/PlaceSelect';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';
import {
  DESCRIPTION_MAX_LENGTH,
  LISTING_LIMIT_VALUES,
  TITLE_MAX_LENGTH,
} from '@/lib/listingLimits';

interface CreateListingFormProps {
  email: string;
  /**
   * Called once the listing is published and the confirmation has been shown.
   *
   * Required, and the form does nothing else at that point — it does not know
   * whether it is a page that should navigate away or a dialog that should
   * close, and guessing wrong is what left the modal stuck under a full-screen
   * celebration it could not dismiss. Whoever renders it decides.
   */
  onPublished: () => void;
}

/*
 * How many of the built-in categories one listing may carry. Kept well under
 * the server's overall cap of TAGS_MAX_COUNT tags (ListingInput in
 * src/lib/validators.ts) so there is room left for the free-form hashtags
 * added in step 2.
 */
const MAX_CATEGORIES = 2;

/*
 * The confetti fountain: one [dx, dy] end point per piece, in pixels from the
 * launch point. Hoisted out of the component because it is a fixed piece of
 * choreography — rebuilding the array on every render would hand React 24 new
 * objects each time and change nothing on screen.
 */
const CONFETTI_PIECES: ReadonlyArray<readonly [number, number]> = [
  [-30, -220], [30, -240], [-70, -180], [80, -200],
  [-10, -260], [50, -170], [-90, -210], [100, -230],
  [-50, -160], [20, -280], [-110, -190], [120, -250],
  [0, -300], [-40, -200], [60, -270], [-80, -240],
  [15, -220], [-20, -250], [90, -180], [-60, -270],
  [40, -210], [-100, -160], [70, -290], [-15, -230],
];

const CONFETTI_COLORS = ['#FF3B30', '#007AFF', '#FFD60A', '#FF2D55', '#FF9F0A'];

/*
 * How long the confirmation stays up before the form hands back. Matches the
 * confetti animation; without motion there is nothing to wait for beyond long
 * enough to read the line.
 */
const CELEBRATION_MS = 1800;
const CELEBRATION_REDUCED_MS = 700;

export default function CreateListingForm({
  email,
  onPublished,
}: CreateListingFormProps) {
  const { t } = useTranslation();

  const [state, action, pending] =
    useActionState<CreateState | null, FormData>(
      createListing,
      null,
    );

  const reducedMotion = usePrefersReducedMotion();

  /*
   * The confirmation is keyed on the action's *result*, not on `pending`.
   * `pending` is also true while a submission is on its way to being rejected,
   * so celebrating on it told people their listing was published a moment
   * before the form showed them why it was not.
   */
  const published = state?.ok === true;

  useEffect(() => {
    if (!published) return;

    // Hand back once the confirmation has had its time on screen.
    const timer = window.setTimeout(
      onPublished,
      reducedMotion ? CELEBRATION_REDUCED_MS : CELEBRATION_MS,
    );

    return () => window.clearTimeout(timer);
  }, [published, reducedMotion, onPublished]);

  const [step, setStep] = useState(1);

  const [type, setType] = useState<Mode>('need');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter((item) => item !== tag);
      }
      if (current.length >= MAX_CATEGORIES) {
        return current;
      }
      return [...current, tag];
    });
  };

  const customTagList = customTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const allTags = [...new Set([...selectedTags, ...customTagList])];

  const categoryLimitReached = selectedTags.length >= MAX_CATEGORIES;

  const step1Valid = selectedTags.length > 0;

  const step2Valid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    location.trim().length > 0;

  /*
   * Ids for the two counted fields, so the labels are actually attached to
   * their controls and the counters can be named as their descriptions.
   *
   * `useId` rather than a literal: /meine mounts two CreateListingModal
   * instances (MyListingsPageContent renders the trigger above the list and
   * again in the empty state), and a hardcoded id would point both labels at
   * whichever copy the document happened to hold first.
   */
  const titleFieldId = useId();
  const descriptionFieldId = useId();

  const counterStyle: React.CSSProperties = {
    margin: '6px 0 0',
    textAlign: 'right',
    color: '#9a9a9a',
    fontSize: 'var(--fs-2xs)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--input-bg)',
    border: '1px solid var(--control-border)',
    borderRadius: '8px',
    fontSize: 'var(--fs-control-input)',
    color: 'var(--page-fg)',
    outline: 'none',
    boxShadow: 'var(--elevation-sm)',
  };

  return (
    <form action={action}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="tags" value={allTags.join(',')} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="location" value={location} />

      <div
        className="flex"
        style={{ gap: '12px', marginBottom: '34px' }}
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            style={{
              height: '8px',
              flex: 1,
              borderRadius: '999px',
              background: item <= step ? '#8DC63F' : 'var(--divider)',
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2
            style={{
              margin: '0 0 26px',
              color: 'var(--page-fg)',
              fontSize: 'var(--fs-xl)',
              fontWeight: 600,
            }}
          >
            {t('type_and_tags')}
          </h2>

          <div style={{ marginBottom: '30px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: 'var(--fs-base)',
                fontWeight: 600,
              }}
            >
              {t('type')} *
            </label>

            <div className="grid grid-cols-2" style={{ gap: '12px' }}>
              {(['need', 'offer'] as Mode[]).map((item) => {
                const active = type === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setType(item)}
                    style={{
                      minHeight: '62px',
                      background: active ? '#8DC63F' : 'var(--input-bg)',
                      color: active ? 'var(--on-accent)' : 'var(--page-fg)',
                      border: active
                        ? '1px solid #8DC63F'
                        : '1px solid var(--control-border)',
                      borderRadius: '9px',
                      fontSize: 'var(--fs-lg)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: 'var(--elevation-sm)',
                    }}
                  >
                    {item === 'need' ? t('mode_need') : t('mode_offer')}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: 'var(--fs-base)',
                fontWeight: 600,
              }}
            >
              {t('choose_tags')} *
            </label>

            {/* The picker caps the selection at MAX_CATEGORIES. Say so, and
                disable the unpicked buttons once the cap is reached — a
                click that silently does nothing reads as a broken button. */}
            <p
              style={{
                margin: '-6px 0 12px',
                color: 'var(--muted-fg)',
                fontSize: 'var(--fs-xs)',
              }}
            >
              {t('choose_tags_hint', { max: MAX_CATEGORIES })}
            </p>

            <div className="grid grid-cols-2" style={{ gap: '10px' }}>
              {STANDARD_CATEGORY_TAGS.map((tag) => {
                const selected = selectedTags.includes(tag);
                const blocked = categoryLimitReached && !selected;

                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    disabled={blocked}
                    onClick={() => toggleTag(tag)}
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
          </div>

          <button
            type="button"
            disabled={!step1Valid}
            onClick={() => setStep(2)}
            style={{
              width: '100%',
              minHeight: '58px',
              marginTop: '30px',
              background: '#8DC63F',
              color: 'var(--on-accent)',
              border: 'none',
              borderRadius: '8px',
              fontSize: 'var(--fs-lg)',
              fontWeight: 600,
              cursor: step1Valid ? 'pointer' : 'not-allowed',
              opacity: step1Valid ? 1 : 0.5,
            }}
          >
            {t('next')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2
            style={{
              margin: '0 0 26px',
              color: 'var(--page-fg)',
              fontSize: 'var(--fs-xl)',
              fontWeight: 600,
            }}
          >
            {t('details')}
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor={titleFieldId}
              style={{
                display: 'block',
                marginBottom: '9px',
                fontWeight: 600,
              }}
            >
              {t('title')} *
            </label>
            <input
              id={titleFieldId}
              type="text"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              aria-describedby={`${titleFieldId}-count`}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
            {/* Two renderings of one number. The compact "12/120" is for the
                eye and is hidden from assistive tech, because "twelve slash a
                hundred and twenty" is not what it means; the sentence beside
                it is the same figure said in words, and `aria-describedby`
                below is what has it read out when focus reaches the field.

                Deliberately not a live region: it would re-announce on every
                keystroke, over the reader's own typing echo. */}
            <p id={`${titleFieldId}-count`} style={counterStyle}>
              <span aria-hidden="true">
                {title.length}/{TITLE_MAX_LENGTH}
              </span>
              <span className="sr-only">
                {t('chars_used', {
                  used: title.length,
                  max: TITLE_MAX_LENGTH,
                })}
              </span>
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor={descriptionFieldId}
              style={{
                display: 'block',
                marginBottom: '9px',
                fontWeight: 600,
              }}
            >
              {t('description')} *
            </label>
            <textarea
              id={descriptionFieldId}
              className="slim-scrollbar"
              value={description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={6}
              aria-describedby={`${descriptionFieldId}-count`}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <p id={`${descriptionFieldId}-count`} style={counterStyle}>
              <span aria-hidden="true">
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </span>
              <span className="sr-only">
                {t('chars_used', {
                  used: description.length,
                  max: DESCRIPTION_MAX_LENGTH,
                })}
              </span>
            </p>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '9px',
                fontWeight: 600,
              }}
            >
              {t('location')} *
            </label>
            <PlaceSelect
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '9px',
                fontWeight: 600,
              }}
            >
              {t('custom_tags_optional')}
            </label>
            <input
              type="text"
              value={customTags}
              onChange={(e) => setCustomTags(e.target.value)}
              placeholder={t('custom_tags_placeholder')}
              style={{
                ...inputStyle,
                height: '58px',
                fontSize: 'var(--fs-base)',
              }}
            />
            <p
              style={{
                margin: '7px 0 0',
                color: 'var(--muted-fg)',
                fontSize: 'var(--fs-xs)',
              }}
            >
              {t('custom_tags_hint')}
            </p>
          </div>

          <div
            className="grid grid-cols-2"
            style={{ gap: '12px', marginTop: '28px' }}
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                minHeight: '52px',
                background: 'var(--input-bg)',
                color: 'var(--page-fg)',
                border: '1px solid var(--control-border)',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('back')}
            </button>
            <button
              type="button"
              disabled={!step2Valid}
              onClick={() => setStep(3)}
              style={{
                minHeight: '52px',
                background: '#8DC63F',
                color: 'var(--on-accent)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: step2Valid ? 'pointer' : 'not-allowed',
                opacity: step2Valid ? 1 : 0.5,
              }}
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2
            style={{
              margin: '0 0 26px',
              color: 'var(--page-fg)',
              fontSize: 'var(--fs-xl)',
              fontWeight: 600,
            }}
          >
            {t('contact_and_preview')}
          </h2>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '9px',
                fontWeight: 600,
              }}
            >
              {t('email')}
            </label>
            <input
              type="email"
              disabled
              value={email}
              style={{
                ...inputStyle,
                /*
                 * Deliberately not the editable field surface. The address
                 * comes from the session and cannot be changed here, and the
                 * only thing saying so is how it looks.
                 */
                background: 'var(--input-readonly-bg)',
                color: 'var(--muted-fg)',
                cursor: 'not-allowed',
              }}
            />
            <p
              style={{
                margin: '6px 0 0',
                color: 'var(--muted-fg)',
                fontSize: 'var(--fs-2xs)',
              }}
            >
              {t('email_from_account')}
            </p>
          </div>

          <div
            style={{
              padding: '20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
            }}
          >
            <p style={{ margin: '0 0 10px', fontWeight: 600, color: 'var(--page-fg)' }}>
              {t('preview')}
            </p>
            <h3
              style={{
                margin: '0 0 8px',
                fontSize: 'var(--fs-lg)',
                fontWeight: 600,
                color: 'var(--page-fg)',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: '0 0 12px',
                color: '#5a5a5a',
                fontSize: 'var(--fs-sm)',
                lineHeight: 1.6,
              }}
            >
              {description}
            </p>
            <div
              className="flex flex-wrap"
              style={{ gap: '7px', marginBottom: '12px' }}
            >
              {allTags.map((tag) => {
                const translatedTag = categoryLabel(tag, t);

                return (
                  <span
                    key={tag}
                    style={{
                      padding: '5px 9px',
                      background: 'rgba(141,198,63,0.08)',
                      color: '#8DC63F',
                      border: '1px solid rgba(141,198,63,0.2)',
                      borderRadius: '6px',
                      fontSize: 'var(--fs-2xs)',
                      fontWeight: 600,
                    }}
                  >
                    #{translatedTag}
                  </span>
                );
              })}
            </div>
            <p
              style={{
                margin: 0,
                color: 'var(--muted-fg)',
                fontSize: 'var(--fs-2xs)',
              }}
            >
              {location} • {email}
            </p>
          </div>

          {state && !state.ok && (
            <ul
              role="alert"
              style={{
                marginTop: '18px',
                color: 'var(--danger-fg)',
                fontSize: 'var(--fs-xs)',
              }}
            >
              {Object.entries(state.errors).flatMap(([key, codes]) =>
                codes.map((code, index) => (
                  /*
                   * One bag of values for every code: the message decides
                   * which of them it names, and i18next drops the rest. That
                   * is what keeps the number in the sentence the same number
                   * the validator enforced, in all five languages.
                   */
                  <li key={`${key}-${index}`}>
                    {t(`error_${code}`, LISTING_LIMIT_VALUES)}
                  </li>
                )),
              )}
            </ul>
          )}

          <div
            className="grid grid-cols-2"
            style={{ gap: '12px', marginTop: '28px' }}
          >
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                minHeight: '52px',
                background: 'var(--input-bg)',
                color: 'var(--page-fg)',
                border: '1px solid var(--control-border)',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('back')}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center justify-center"
              style={{
                gap: '8px',
                minHeight: '52px',
                background: '#8DC63F',
                color: 'var(--on-accent)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: pending ? 'not-allowed' : 'pointer',
                opacity: pending ? 0.6 : 1,
              }}
            >
              <Plus className="w-4 h-4" />
              {pending ? t('saving') : t('publish')}
            </button>
          </div>
        </div>
      )}

      {published && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(255,255,255,0.82)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Decoration only, and skipped entirely for anyone who asked for
              reduced motion — two dozen pieces flying up the viewport is
              exactly the kind of movement that setting is there to stop. The
              confirmation itself stays either way. */}
          {!reducedMotion &&
            CONFETTI_PIECES.map(([dx, dy], i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '58%',
                  width: i % 2 === 0 ? '8px' : '6px',
                  height: i % 3 === 0 ? '14px' : '9px',
                  marginLeft: '-3px',
                  borderRadius: '2px',
                  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  animation: `confetti-fountain ${CELEBRATION_MS}ms ease-out ${i * 0.03}s forwards`,
                  ['--dx' as string]: `${dx}px`,
                  ['--dy' as string]: `${dy}px`,
                }}
              />
            ))}

          <Image src="/happyfrog.png" alt="" width={160} height={107} />
          <p style={{ fontWeight: 700, fontSize: 'var(--fs-xl)', color: 'var(--on-accent)' }}>
            {t('listing_published')}
          </p>
        </div>
      )}
    </form>
  );
}
