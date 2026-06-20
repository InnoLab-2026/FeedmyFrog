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
        className="mt-6 rounded-[calc(var(--radius)-0.5rem)] p-4 text-sm"
        style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
      >
        <p className="font-medium">E-Mail unterwegs ✉️</p>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Wenn ein Konto für <span className="font-medium">{email}</span> möglich
          ist, finden Sie gleich einen Anmeldelink in Ihrem Postfach. Der Link ist
          nur kurze Zeit und einmalig gültig.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
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
          className="mt-1 w-full rounded-[calc(var(--radius)-0.5rem)] px-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            background: 'var(--input-background)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            // @ts-expect-error custom property for the focus ring color
            '--tw-ring-color': 'var(--ring)',
          }}
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--destructive)' }} role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-[calc(var(--radius)-0.5rem)] px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        {status === 'sending' ? 'Wird gesendet …' : 'Anmeldelink senden'}
      </button>
    </form>
  );
}
