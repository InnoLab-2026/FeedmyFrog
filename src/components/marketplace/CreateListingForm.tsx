'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  createListing,
  type CreateState,
} from '@/actions/listings';

import type { Mode } from '@/types';

interface CreateListingFormProps {
  email: string;
}

const STANDARD_TAGS = [
  'Familie',
  'Kinder',
  'Wochenende',
  'Mobilität',
  'Pendeln',
  'Verkauf',
  'Dienstleistungen',
  'Transport',
  'Bildung',
];

function getTagTranslationKey(tag: string) {
  const keys: Record<string, string> = {
    Familie: 'category_family',
    Kinder: 'category_children',
    Wochenende: 'category_weekend',
    Mobilität: 'category_mobility',
    Pendeln: 'category_commuting',
    Verkauf: 'category_sale',
    Dienstleistungen: 'category_services',
    Transport: 'category_transport',
    Bildung: 'category_education',
  };

  return keys[tag] ?? tag;
}

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
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  };

  const customTagList = customTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const allTags = [
    ...selectedTags,
    ...customTagList,
  ];

  const step1Valid = allTags.length > 0;

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
      {/* Werte für bestehende Backend-Action */}
      <input
        type="hidden"
        name="type"
        value={type}
      />

      <input
        type="hidden"
        name="tags"
        value={allTags.join(',')}
      />

      <input
        type="hidden"
        name="title"
        value={title}
      />

      <input
        type="hidden"
        name="description"
        value={description}
      />

      <input
        type="hidden"
        name="location"
        value={location}
      />

      {/* Fortschritt */}
      <div
        className="flex"
        style={{
          gap: '12px',
          marginBottom: '34px',
        }}
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            style={{
              height: '8px',
              flex: 1,
              borderRadius: '999px',
              background:
                item <= step
                  ? '#8DC63F'
                  : '#dedede',
            }}
          />
        ))}
      </div>

      {/* STEP 1 */}
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

          <div
            style={{
              marginBottom: '30px',
            }}
          >
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

            <div
              className="grid grid-cols-2"
              style={{
                gap: '12px',
              }}
            >
              {(['need', 'offer'] as Mode[]).map(
                (item) => {
                  const active = type === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setType(item)
                      }
                      style={{
                        minHeight: '62px',

                        background: active
                          ? '#8DC63F'
                          : 'white',

                        color: active
                          ? 'white'
                          : '#2F2F2F',

                        border: active
                          ? '1px solid #8DC63F'
                          : '1px solid rgba(47,47,47,0.2)',

                        borderRadius: '9px',
                        fontSize: 'var(--fs-lg)',
                        fontWeight: 600,
                        cursor: 'pointer',

                        boxShadow:
                          '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                    >
                      {item === 'need'
                        ? t('mode_need')
                        : t('mode_offer')}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div
            style={{
              marginBottom: '30px',
            }}
          >
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

            <div
              className="grid grid-cols-2"
              style={{
                gap: '10px',
              }}
            >
              {STANDARD_TAGS.map((tag) => {
                const selected =
                  selectedTags.includes(tag);

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      toggleTag(tag)
                    }
                    style={{
                      minHeight: '50px',
                      padding: '0 16px',

                      textAlign: 'left',

                      background: selected
                        ? '#8DC63F'
                        : 'white',

                      color: selected
                        ? '#1a3200'
                        : '#2F2F2F',

                      border: selected
                        ? '1px solid #8DC63F'
                        : '1px solid rgba(47,47,47,0.2)',

                      borderRadius: '8px',

                      fontSize: 'var(--fs-md)',
                      fontWeight: 500,

                      cursor: 'pointer',

                      boxShadow:
                        '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    {selected ? '✓ ' : ''}

                    {t(
                      getTagTranslationKey(tag),
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: 'var(--fs-base)',
                fontWeight: 600,
              }}
            >
              {t('custom_tags_optional')}
            </label>

            <input
              type="text"
              value={customTags}
              onChange={(e) =>
                setCustomTags(e.target.value)
              }
              placeholder={t(
                'custom_tags_placeholder',
              )}
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

              cursor: step1Valid
                ? 'pointer'
                : 'not-allowed',

              opacity: step1Valid
                ? 1
                : 0.5,
            }}
          >
            {t('next')}
          </button>
        </div>
      )}

      {/* STEP 2 */}
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

          <div
            style={{
              marginBottom: '20px',
            }}
          >
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
              onChange={(e) =>
                setTitle(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div
            style={{
              marginBottom: '20px',
            }}
          >
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
              onChange={(e) =>
                setDescription(e.target.value)
              }
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
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
              onChange={(e) =>
                setLocation(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div
            className="grid grid-cols-2"
            style={{
              gap: '12px',
              marginTop: '28px',
            }}
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                minHeight: '52px',

                background: 'white',

                border:
                  '1px solid rgba(47,47,47,0.2)',

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

                cursor: step2Valid
                  ? 'pointer'
                  : 'not-allowed',

                opacity: step2Valid
                  ? 1
                  : 0.5,
              }}
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
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

          <div
            style={{
              marginBottom: '24px',
            }}
          >
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

              border:
                '1px solid rgba(47,47,47,0.15)',

              borderRadius: '10px',
            }}
          >
            <p
              style={{
                margin: '0 0 10px',
                fontWeight: 600,
              }}
            >
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
              style={{
                gap: '7px',
                marginBottom: '12px',
              }}
            >
              {allTags.map((tag) => {
                const translatedTag =
                  STANDARD_TAGS.includes(tag)
                    ? t(
                        getTagTranslationKey(tag),
                      )
                    : tag;

                return (
                  <span
                    key={tag}
                    style={{
                      padding: '5px 9px',

                      background:
                        'rgba(141,198,63,0.08)',

                      color: '#8DC63F',

                      border:
                        '1px solid rgba(141,198,63,0.2)',

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
              {Object.entries(
                state.errors,
              ).flatMap(
                ([key, codes]) =>
                  codes.map(
                    (code, index) => (
                      <li
                        key={`${key}-${index}`}
                      >
                        {t(`error_${code}`)}
                      </li>
                    ),
                  ),
              )}
            </ul>
          )}

          <div
            className="grid grid-cols-2"
            style={{
              gap: '12px',
              marginTop: '28px',
            }}
          >
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                minHeight: '52px',

                background: 'white',

                border:
                  '1px solid rgba(47,47,47,0.2)',

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

                cursor: pending
                  ? 'not-allowed'
                  : 'pointer',

                opacity: pending
                  ? 0.6
                  : 1,
              }}
            >
              <Plus className="w-4 h-4" />

              {pending
                ? t('saving')
                : t('publish')}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}