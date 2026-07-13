'use client';
import { useActionState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { createListing, type CreateState } from '@/actions/listings';

export default function NewListingPage() {
  const { t } = useTranslation();
  const [state, action, pending] = useActionState<CreateState | null, FormData>(
    createListing,
    null,
  );

  return (
    <main className="max-w-[800px] mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontWeight: 700, fontSize: '24px' }}>Neuer Eintrag</h1>
        <Link
          href="/meine"
          className="py-2 px-4 rounded-xl"
          style={{ background: 'white', border: '2px solid black', fontWeight: 600 }}
        >
          ← Meine Einträge
        </Link>
      </div>

      <form
        action={action}
        className="flex flex-col gap-4 p-6 rounded-2xl"
        style={{ background: 'white', border: '2px solid black' }}
      >
        <fieldset>
          <legend style={{ fontWeight: 600, marginBottom: '8px' }}>Typ</legend>
          <label className="mr-4">
            <input type="radio" name="type" value="need" defaultChecked /> {t('mode_need')}
          </label>
          <label>
            <input type="radio" name="type" value="offer" /> {t('mode_offer')}
          </label>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span style={{ fontWeight: 500 }}>Titel</span>
          <input
            name="title"
            required
            maxLength={120}
            className="px-4 py-2 rounded-xl"
            style={{ border: '2px solid black' }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span style={{ fontWeight: 500 }}>Beschreibung</span>
          <textarea
            name="description"
            required
            maxLength={2000}
            rows={5}
            className="px-4 py-2 rounded-xl"
            style={{ border: '2px solid black' }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span style={{ fontWeight: 500 }}>Tags (kommagetrennt)</span>
          <input
            name="tags"
            placeholder="z. B. Familie, Mobilität"
            className="px-4 py-2 rounded-xl"
            style={{ border: '2px solid black' }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span style={{ fontWeight: 500 }}>Standort</span>
          <input
            name="location"
            required
            maxLength={80}
            className="px-4 py-2 rounded-xl"
            style={{ border: '2px solid black' }}
          />
        </label>

        {state && !state.ok && (
          <ul role="alert" style={{ color: 'red', fontSize: '14px' }}>
            {Object.entries(state.errors).flatMap(([k, vs]) =>
              vs.map((v, i) => (
                <li key={`${k}-${i}`}>
                  {k}: {v}
                </li>
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
          {pending ? 'Speichern…' : 'Speichern'}
        </button>
      </form>
    </main>
  );
}
