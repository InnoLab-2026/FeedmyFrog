'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import LoginForm from './LoginForm';
import LanguageButton from '@/components/layout/LanguageButton';
import { CARD_SHADOW } from '@/constants';
import { useEffect, useRef, useState } from 'react';

/*
 * A frog that follows the pointer along the bottom of the login page.
 *
 * Mouse movement fires dozens of times a second, so the position is written
 * straight to the node through a ref inside one requestAnimationFrame per
 * frame instead of through React state — a setState per mousemove re-renders
 * the whole card on every pixel. The two timers are held in refs and cleared
 * on unmount so a late callback cannot fire against an unmounted component.
 *
 * Purely decorative, so it is aria-hidden, ignores pointer events, and — for
 * anyone who asked for reduced motion — simply never starts following the
 * pointer instead of animating across the screen.
 */
function HoppingFrog() {
  const frogRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const hopTimer = useRef<number | null>(null);
  const mouthTimer = useRef<number | null>(null);

  const [hop, setHop] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (event: MouseEvent) => {
      const x = event.clientX;

      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(() => {
          frameRef.current = null;
          if (frogRef.current) frogRef.current.style.left = `${x}px`;
        });
      }

      setHop(true);
      if (hopTimer.current !== null) window.clearTimeout(hopTimer.current);
      hopTimer.current = window.setTimeout(() => setHop(false), 180);
    };

    const onClick = () => {
      setMouthOpen(true);
      if (mouthTimer.current !== null) window.clearTimeout(mouthTimer.current);
      mouthTimer.current = window.setTimeout(() => setMouthOpen(false), 350);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      if (hopTimer.current !== null) window.clearTimeout(hopTimer.current);
      if (mouthTimer.current !== null) window.clearTimeout(mouthTimer.current);
    };
  }, []);

  return (
    <div
      ref={frogRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '40px',
        bottom: hop ? 28 : 8,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        transition: 'left 0.12s linear, bottom 0.18s ease',
      }}
    >
      <svg width="54" height="48" viewBox="0 0 54 48" fill="none">
        <ellipse cx="27" cy="28" rx="20" ry="16" fill="#7CB342" />
        <circle cx="16" cy="16" r="8" fill="#7CB342" />
        <circle cx="38" cy="16" r="8" fill="#7CB342" />
        <circle cx="16" cy="16" r="4.5" fill="white" />
        <circle cx="38" cy="16" r="4.5" fill="white" />
        <circle cx="17" cy="17" r="2.2" fill="#1a1a1a" />
        <circle cx="39" cy="17" r="2.2" fill="#1a1a1a" />
        {mouthOpen ? (
          <ellipse cx="27" cy="34" rx="6" ry="4.5" fill="#1a1a1a" />
        ) : (
          <path
            d="M22 33 Q27 36 32 33"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}

export default function LoginCard({
  initialErrorCode,
}: {
  initialErrorCode: string | null;
}) {
  const { t } = useTranslation();

  return (
    <main
      className="relative flex min-h-screen items-center justify-center p-6"
      style={{
        background: '#FFFFFF',
      }}
    >
      <div
        className="absolute"
        style={{ top: '20px', right: '20px' }}
      >
        <LanguageButton />
      </div>

      <div
        className="w-full"
        style={{
          maxWidth: '520px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '26px',
          }}
        >
          <img
            src="/feedmyfrog.jpg"
            alt="feedmyfrog"
            style={{
              width: '220px',
              height: 'auto',
              display: 'block',
            }}
          />
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'white',
            border: '1px solid rgba(47,47,47,0.15)',
            borderRadius: '18px',
            padding: '34px',
            boxShadow: CARD_SHADOW,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-family-display)',
              fontWeight: 700,
              fontSize: 'var(--fs-3xl)',
              lineHeight: 1.2,
              color: '#2F2F2F',
            }}
          >
            Reutlingen University Connect
          </h1>

          <p
            style={{
              marginTop: '12px',
              marginBottom: 0,
              fontSize: 'var(--fs-md)',
              lineHeight: 1.6,
              fontWeight: 500,
              color: '#666',
            }}
          >
            {t('login_subtitle')}
          </p>

          <div
            style={{
              marginTop: '28px',
            }}
          >
            <LoginForm initialErrorCode={initialErrorCode} />
          </div>

          <div
            style={{
              height: '1px',
              background: 'rgba(47,47,47,0.08)',
              margin: '28px 0 20px',
            }}
          />

          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-2xs)',
              lineHeight: 1.6,
              fontWeight: 500,
              color: '#666',
            }}
          >
            {t('login_privacy_notice')}{' '}
            <Link
              href="/datenschutz"
              className="hover:underline"
              style={{
                color: '#659629',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              {t('privacy_policy_link')}
            </Link>

            {' · '}

            <Link
              href="/impressum"
              className="hover:underline"
              style={{
                color: '#659629',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              {t('imprint_link')}
            </Link>
          </p>
        </div>
      </div>

      <HoppingFrog />
    </main>
  );
}
