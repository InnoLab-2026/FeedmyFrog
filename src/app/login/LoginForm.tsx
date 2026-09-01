'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginForm({
  initialErrorCode,
}: {
  initialErrorCode: string | null;
}) {
  const { t, i18n } = useTranslation();

  const MESSAGES: Record<string, string> = {
    forbidden_domain: t('error_forbidden_domain'),
    invalid_email: t('error_invalid_email'),
    too_many_requests: t('error_too_many_requests'),
    unknown: t('error_unknown'),
    missing_token: t('login_error_missing_token'),
    invalid_or_expired: t('login_error_invalid_or_expired'),
  };

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(
    initialErrorCode ? (MESSAGES[initialErrorCode] ?? null) : null,
  );

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
        body: JSON.stringify({ email, lang: i18n.language }),
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
          fontSize: 'var(--fs-sm)',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#2F2F2F',
            fontWeight: 700,
            fontSize: 'var(--fs-base)',
          }}
        >
          {t('email_sent_title')}
        </p>

        <p
          style={{
            margin: '10px 0 0',
            color: '#5f5f5f',
            fontWeight: 500,
            lineHeight: 1.6,
            overflowWrap: 'anywhere',
          }}
        >
          {t('email_sent_intro')}
        </p>

        <p
          style={{
            margin: '8px 0 0',
            color: '#2F2F2F',
            fontWeight: 700,
            lineHeight: 1.5,
            overflowWrap: 'anywhere',
          }}
        >
          {email.trim().toLowerCase()}
        </p>

        <p
          style={{
            margin: '8px 0 0',
            color: '#5f5f5f',
            fontWeight: 500,
            lineHeight: 1.6,
          }}
        >
          {t('email_sent_note')}
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
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          color: '#2F2F2F',
        }}
      >
        {t('email_address_label')}

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
            fontSize: 'var(--fs-control-input)',
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
            fontSize: 'var(--fs-xs)',
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
          fontSize: 'var(--fs-control-button)',
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
          ? t('sending_link')
          : t('send_login_link')}
      </button>
    </form>
  );
}
