'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContactButtonProps {
  email: string;
  /** The prepared mailto: link, subject included. */
  href: string;
}

/** Room the menu needs, used to keep it on screen near the pointer. */
const MENU_WIDTH = 180;
const MENU_HEIGHT = 56;
const EDGE = 8;

const STATUS_MS = 2500;

type CopyStatus = 'copied' | 'failed';

/*
 * The listing's Contact button: a plain mailto: link on click, and on right
 * click (or the context-menu key, or a long press on Android) a one-item menu
 * that copies the address instead. Not everyone has a mail client wired up to
 * mailto:, and selecting an address out of a link is not possible.
 *
 * The menu and the confirmation are portalled to <body> and positioned
 * fixed, so neither is clipped by the card or stacked under its neighbours.
 */
export default function ContactButton({ email, href }: ContactButtonProps) {
  const { t } = useTranslation();
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState<CopyStatus | null>(null);

  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLButtonElement | null>(null);

  function openMenu(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    event.stopPropagation();

    let { clientX: x, clientY: y } = event;

    // Opened from the keyboard: there is no pointer, so browsers report 0,0.
    // Anchor the menu under the button instead.
    if (x === 0 && y === 0 && linkRef.current) {
      const box = linkRef.current.getBoundingClientRect();
      x = box.left;
      y = box.bottom + 4;
    }

    setMenuAt({
      x: Math.max(EDGE, Math.min(x, window.innerWidth - MENU_WIDTH - EDGE)),
      y: Math.max(EDGE, Math.min(y, window.innerHeight - MENU_HEIGHT - EDGE)),
    });
  }

  function closeMenu(returnFocus: boolean) {
    setMenuAt(null);
    if (returnFocus) linkRef.current?.focus();
  }

  useEffect(() => {
    if (!menuAt) return;

    copyRef.current?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuAt(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuAt(null);
        linkRef.current?.focus();
      }
    };
    // Fixed to where the pointer was; once the page moves it would point at
    // nothing, so it closes like a native context menu does.
    const onMove = () => setMenuAt(null);

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onMove);
      window.removeEventListener('resize', onMove);
    };
  }, [menuAt]);

  useEffect(() => {
    if (!status) return;

    const timer = window.setTimeout(() => setStatus(null), STATUS_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copyEmail() {
    closeMenu(true);

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

  return (
    <>
      <a
        ref={linkRef}
        href={href}
        className="flex shrink-0 items-center gap-1.5 px-4 py-2 transition-all duration-200"
        style={{
          background: '#8DC63F',
          color: 'var(--on-accent)',
          border: '1px solid #8DC63F',
          borderRadius: '7px',
          fontSize: 'var(--fs-xs)',
          fontWeight: 600,
          textDecoration: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={openMenu}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#72a830';
          e.currentTarget.style.borderColor = '#72a830';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#8DC63F';
          e.currentTarget.style.borderColor = '#8DC63F';
        }}
      >
        <Mail className="w-3.5 h-3.5" />
        <span>{t('contact')}</span>
      </a>

      {/* Always mounted, so screen readers hear the change. The visible
          confirmation below is the same text and hidden from them. */}
      <span role="status" className="sr-only">
        {statusText}
      </span>

      {menuAt &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={t('contact')}
            style={{
              position: 'fixed',
              left: menuAt.x,
              top: menuAt.y,
              zIndex: 60,
              minWidth: '160px',
              padding: '4px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              boxShadow: 'var(--elevation-lg)',
            }}
          >
            <button
              ref={copyRef}
              type="button"
              role="menuitem"
              onClick={copyEmail}
              onKeyDown={(e) => {
                if (e.key === 'Tab') closeMenu(false);
              }}
              className="flex w-full items-center rounded-lg outline-none hover:bg-[var(--accent-tint)] focus-visible:bg-[var(--accent-tint)]"
              style={{
                gap: '10px',
                minHeight: '44px',
                padding: '0 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--page-fg)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Copy aria-hidden="true" style={{ width: '16px', height: '16px' }} />
              {t('copy')}
            </button>
          </div>,
          document.body,
        )}

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
