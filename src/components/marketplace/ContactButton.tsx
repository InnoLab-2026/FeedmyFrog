'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContactButtonProps {
  email: string;
  /** The prepared mailto: link, subject included. */
  href: string;
}

const STATUS_MS = 2500;

type CopyStatus = 'copied' | 'failed';

/*
 * The listing's Contact control, a split button: `[ Contact | copy ]`.
 *
 * The left part is the mailto: link, filled like every primary action. The
 * right part is outlined instead, so the two read as two buttons with two
 * different results rather than one wide one. It copies the address, for
 * everyone whose mail client is not wired up to mailto: -- and it is a visible
 * button on purpose. A right-click menu was tried first: nobody finds it, iOS
 * never fires `contextmenu`, and it hid the browser's own menu, which already
 * offers "Copy email address" on a mailto: link. That native menu is left
 * alone now.
 *
 * Two sibling controls rather than one nested in the other: a button inside a
 * link is invalid HTML and would fire both.
 */
export default function ContactButton({ email, href }: ContactButtonProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<CopyStatus | null>(null);

  useEffect(() => {
    if (!status) return;

    const timer = window.setTimeout(() => setStatus(null), STATUS_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copyEmail(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    // navigator.clipboard exists only in secure contexts (HTTPS, localhost)
    // and can be refused by permissions; both land in the catch.
    try {
      await navigator.clipboard.writeText(email);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  const statusText =
    status === 'copied' ? t('email_copied') : status === 'failed' ? t('copy_failed') : '';

  const copied = status === 'copied';

  const focusRing =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-fg)]';

  // Backgrounds live in className, not style: an inline background would
  // outrank the hover: variant and the halves would not react to the pointer.

  return (
    <>
      {/* Full width on its own row on phones -- a 44px-tall target that
          does not squeeze the location beside it -- and content-sized from
          sm up. */}
      <div
        className="flex w-full min-h-11 items-stretch sm:w-auto sm:min-h-0 sm:shrink-0"
        style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}
      >
        <a
          href={href}
          className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-2 transition-colors duration-200 bg-[#8DC63F] hover:bg-[#72a830] sm:flex-none ${focusRing}`}
          style={{
            color: 'var(--on-accent)',
            border: '1px solid #8DC63F',
            borderRadius: '7px 0 0 7px',
            textDecoration: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Mail aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{t('contact')}</span>
        </a>

        <button
          type="button"
          aria-label={t('copy_email')}
          title={t('copy_email')}
          onClick={copyEmail}
          // Stays outlined when copied -- a filled check would merge with
          // Contact and the split would vanish just as it was used.
          className={`flex items-center justify-center transition-colors duration-200 ${
            copied
              ? 'bg-[rgba(141,198,63,0.28)]'
              : 'bg-[var(--accent-tint)] hover:bg-[rgba(141,198,63,0.18)]'
          } ${focusRing}`}
          style={{
            // 44px wide for touch; the row sets the height.
            minWidth: '44px',
            padding: '0 12px',
            color: 'var(--accent-fg)',
            border: '1px solid var(--accent-fg)',
            borderRadius: '0 7px 7px 0',
            cursor: 'pointer',
          }}
        >
          {copied ? (
            <Check aria-hidden="true" className="w-4 h-4" />
          ) : (
            <Copy aria-hidden="true" className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Always mounted, so screen readers hear the change. The visible
          confirmation below is the same text and hidden from them. */}
      <span role="status" className="sr-only">
        {statusText}
      </span>

      {status &&
        createPortal(
          <div
            aria-hidden="true"
            className="flex items-center"
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 'calc(24px + env(safe-area-inset-bottom))',
              transform: 'translateX(-50%)',
              zIndex: 60,
              maxWidth: 'calc(100vw - 32px)',
              gap: '8px',
              padding: '12px 18px',
              background: 'var(--card-bg)',
              color: status === 'copied' ? 'var(--page-fg)' : 'var(--danger-fg)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              boxShadow: 'var(--elevation-lg)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
            }}
          >
            {status === 'copied' && (
              <Check style={{ width: '16px', height: '16px', color: '#8DC63F', flexShrink: 0 }} />
            )}
            {statusText}
          </div>,
          document.body,
        )}
    </>
  );
}
