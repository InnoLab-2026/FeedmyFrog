'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  createListing,
  type CreateState,
} from '@/actions/listings';

import type { Mode } from '@/types';
import {
  STANDARD_CATEGORY_TAGS,
  getCategoryTranslationKey,
  isStandardCategory,
} from '@/data/categories';
import KnownPlacesDatalist, {
  KNOWN_PLACES_LIST_ID,
} from '@/components/marketplace/KnownPlacesDatalist';

interface CreateListingFormProps {
  email: string;
}

/*
 * How many of the built-in categories one listing may carry. Kept well under
 * the server's overall cap of 8 tags (ListingInput in src/lib/validators.ts)
 * so there is room left for the free-form hashtags added in step 2.
 */
const MAX_CATEGORIES = 2;

export default function CreateListingForm({
  email,
}: CreateListingFormProps) {
  const { t } = useTranslation();

  const [state, action, pending] =
    useActionState<CreateState | null, FormData>(
      createListing,
      null,
    );

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'white',
    border: '1px solid rgba(47,47,47,0.2)',
    borderRadius: '8px',
    fontSize: 'var(--fs-control-input)',
    color: '#2F2F2F',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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
              background: item <= step ? '#8DC63F' : '#dedede',
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2
            style={{
              margin: '0 0 26px',
              color: '#2F2F2F',
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
                      background: active ? '#8DC63F' : 'white',
                      color: active ? 'white' : '#2F2F2F',
                      border: active
                        ? '1px solid #8DC63F'
                        : '1px solid rgba(47,47,47,0.2)',
                      borderRadius: '9px',
                      fontSize: 'var(--fs-lg)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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
                color: '#666',
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
                      background: selected ? '#8DC63F' : 'white',
                      color: selected ? '#1a3200' : '#2F2F2F',
                      border: selected
                        ? '1px solid #8DC63F'
                        : '1px solid rgba(47,47,47,0.2)',
                      borderRadius: '8px',
                      fontSize: 'var(--fs-md)',
                      fontWeight: 500,
                      cursor: blocked ? 'not-allowed' : 'pointer',
                      opacity: blocked ? 0.45 : 1,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    {t(getCategoryTranslationKey(tag))}
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
              color: '#1a3200',
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
              color: '#2F2F2F',
              fontSize: 'var(--fs-xl)',
              fontWeight: 600,
            }}
          >
            {t('details')}
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '9px',
                fontWeight: 600,
              }}
            >
              {t('title')} *
            </label>
            <input
              type="text"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '9px',
                fontWeight: 600,
              }}
            >
              {t('description')} *
            </label>
            <textarea
              value={description}
              maxLength={2000}
              rows={6}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
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
            <input
              type="text"
              value={location}
              maxLength={80}
              list={KNOWN_PLACES_LIST_ID}
              onChange={(e) => setLocation(e.target.value)}
              style={inputStyle}
            />
            <KnownPlacesDatalist />
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
                color: '#666',
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
                background: 'white',
                border: '1px solid rgba(47,47,47,0.2)',
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
                color: '#1a3200',
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
              color: '#2F2F2F',
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
                background: '#F5F5F5',
                color: '#666',
              }}
            />
            <p
              style={{
                margin: '6px 0 0',
                color: '#666',
                fontSize: 'var(--fs-2xs)',
              }}
            >
              {t('email_from_account')}
            </p>
          </div>

          <div
            style={{
              padding: '20px',
              background: '#F7FBF9',
              border: '1px solid rgba(47,47,47,0.15)',
              borderRadius: '10px',
            }}
          >
            <p style={{ margin: '0 0 10px', fontWeight: 600 }}>
              {t('preview')}
            </p>
            <h3
              style={{
                margin: '0 0 8px',
                fontSize: 'var(--fs-lg)',
                fontWeight: 600,
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
                const translatedTag = isStandardCategory(tag)
                  ? t(getCategoryTranslationKey(tag))
                  : tag;

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
                color: '#666',
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
                color: '#dc2626',
                fontSize: 'var(--fs-xs)',
              }}
            >
              {Object.entries(state.errors).flatMap(([key, codes]) =>
                codes.map((code, index) => (
                  <li key={`${key}-${index}`}>{t(`error_${code}`)}</li>
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
                background: 'white',
                border: '1px solid rgba(47,47,47,0.2)',
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
                color: '#1a3200',
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
            {pending && (
        <div
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
                    {[
            [ -30, -220 ], [ 30, -240 ], [ -70, -180 ], [ 80, -200 ],
            [ -10, -260 ], [ 50, -170 ], [ -90, -210 ], [ 100, -230 ],
            [ -50, -160 ], [ 20, -280 ], [ -110, -190 ], [ 120, -250 ],
            [ 0, -300 ],   [ -40, -200 ], [ 60, -270 ], [ -80, -240 ],
            [ 15, -220 ],  [ -20, -250 ], [ 90, -180 ], [ -60, -270 ],
            [ 40, -210 ],  [ -100, -160 ], [ 70, -290 ], [ -15, -230 ],
          ].map(([dx, dy], i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '58%',
                width: i % 2 === 0 ? '8px' : '6px',
                height: i % 3 === 0 ? '14px' : '9px',
                marginLeft: '-3px',
                borderRadius: '2px',
                background: ['#FF3B30', '#007AFF', '#FFD60A', '#FF2D55', '#FF9F0A'][i % 5],
                animation: `confetti-fountain 1.8s ease-out ${i * 0.03}s forwards`,
                ['--dx' as string]: `${dx}px`,
                ['--dy' as string]: `${dy}px`,
              }}
            />
          ))}
          <style>{`
            @keyframes confetti-fountain {
              0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
              55%  { opacity: 1; }
              100% { transform: translate(var(--dx), var(--dy)) rotate(200deg); opacity: 0; }
            }
          `}</style>
          <img src="/happyfrog.png" alt="" width={110} height={110} />
          <p style={{ fontWeight: 700, fontSize: '20px', color: '#1a3200' }}>
            Quak — ist im Teich!
          </p>
        </div>
      )}
    </form>
    
  );
  
}
