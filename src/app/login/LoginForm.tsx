'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

// Maps the send-link route's error codes (and HTTP statuses) to German copy.
const MESSAGES: Record<string, string> = {
  forbidden_domain: 'Bitte verwenden Sie Ihre Hochschul-E-Mail-Adresse.',
  invalid_email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  too_many_requests: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
  unknown: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
};

export default function LoginForm({ initialError }: { initialError: string | null }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(initialError);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 202) {
        setStatus('sent');
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(MESSAGES[body?.error as string] ?? MESSAGES.unknown);
      setStatus('error');
    } catch {
      setError(MESSAGES.unknown);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div
        className="mt-6 p-4 rounded-xl"
        style={{ background: 'white', border: '2px solid black', fontSize: '14px' }}
      >
        <p style={{ fontWeight: 700 }}>E-Mail unterwegs ✉️</p>
        <p className="mt-1" style={{ fontWeight: 500 }}>
          Wenn ein Konto für <span style={{ fontWeight: 700 }}>{email}</span> möglich
          ist, finden Sie gleich einen Anmeldelink in Ihrem Postfach. Der Link ist
          nur kurze Zeit und einmalig gültig.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block" style={{ fontSize: '14px', fontWeight: 600, color: 'black' }}>
          E-Mail-Adresse
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="max.mustermann@reutlingen-university.de"
          className="mt-1 w-full px-4 py-2 rounded-xl outline-none focus:outline-none"
          style={{ background: 'white', border: '2px solid black', color: 'black', fontSize: '14px' }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '3px solid black';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="p-3 rounded-xl"
          style={{ border: '2px solid black', color: 'red', fontSize: '14px', fontWeight: 600, background: 'white' }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full py-3 rounded-xl transition disabled:opacity-60"
        style={{ background: 'black', color: 'white', fontWeight: 600 }}
      >
        {status === 'sending' ? 'Wird gesendet …' : 'Anmeldelink senden'}
      </button>
    </form>
  );
}
