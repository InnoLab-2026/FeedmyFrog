'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const MESSAGES: Record<string, string> = {
  forbidden_domain:
    'Bitte verwenden Sie Ihre Hochschul-E-Mail-Adresse.',
  invalid_email:
    'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  too_many_requests:
    'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
  unknown:
    'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
};

export default function LoginForm({
  initialError,
}: {
  initialError: string | null;
}) {
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
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (res.status === 202) {
        setStatus('sent');
        return;
      }

      const body = await res.json().catch(() => ({}));

      setError(
        MESSAGES[body?.error as string] ??
          MESSAGES.unknown,
      );

      setStatus('error');
    } catch {
      setError(MESSAGES.unknown);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div
        style={{
          padding: '20px',
          background: '#F7FBF9',
          border: '1px solid rgba(141,198,63,0.35)',
          borderRadius: '12px',
          fontSize: '14px',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#2F2F2F',
            fontWeight: 700,
            fontSize: '16px',
          }}
        >
          E-Mail unterwegs ✉️
        </p>

        <p
          style={{
            margin: '8px 0 0',
            color: '#5f5f5f',
            fontWeight: 500,
            lineHeight: 1.6,
          }}
        >
          Wenn ein Konto für{' '}
          <span
            style={{
              color: '#2F2F2F',
              fontWeight: 700,
            }}
          >
            {email}
          </span>{' '}
          möglich ist, finden Sie gleich einen Anmeldelink in Ihrem
          Postfach. Der Link ist nur kurze Zeit und einmalig gültig.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col"
      style={{
        gap: '18px',
      }}
    >
      <label
        htmlFor="email"
        className="block"
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#2F2F2F',
        }}
      >
        E-Mail-Adresse

        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="max.mustermann@reutlingen-university.de"
          className="mt-2 w-full outline-none"
          style={{
            height: '54px',
            padding: '0 16px',
            background: '#F7FBF9',
            border: '1px solid rgba(47,47,47,0.18)',
            borderRadius: '10px',
            color: '#2F2F2F',
            fontSize: '14px',
            transition:
              'border-color 150ms ease, box-shadow 150ms ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#8DC63F';
            e.currentTarget.style.boxShadow =
              '0 0 0 3px rgba(141,198,63,0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor =
              'rgba(47,47,47,0.18)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </label>

      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: '12px 14px',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: '10px',
            color: '#dc2626',
            fontSize: '13px',
            fontWeight: 600,
            background: '#fff7f7',
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          minHeight: '54px',
          width: '100%',
          background: '#8DC63F',
          color: '#1a3200',
          border: '1px solid #8DC63F',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: 700,
          cursor:
            status === 'sending'
              ? 'not-allowed'
              : 'pointer',
          opacity:
            status === 'sending'
              ? 0.65
              : 1,
          transition:
            'background 150ms ease, border-color 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (status !== 'sending') {
            e.currentTarget.style.background = '#7DB436';
            e.currentTarget.style.borderColor = '#7DB436';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#8DC63F';
          e.currentTarget.style.borderColor = '#8DC63F';
        }}
      >
        {status === 'sending'
          ? 'Wird gesendet …'
          : 'Anmeldelink senden'}
      </button>
    </form>
  );
}