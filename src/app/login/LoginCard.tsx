'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import LoginForm from './LoginForm';
import LanguageButton from '@/components/layout/LanguageButton';
import { APP_NAME, CARD_SHADOW } from '@/constants';
import { useEffect, useRef, useState } from 'react';

/*
 * A frog that follows the pointer along the bottom of the login page.
 *
 * Mouse movement fires dozens of times a second, so the position is written
 * straight to the node through a ref inside one requestAnimationFrame per
 * frame instead of through React state — a setState per mousemove re-renders
 * the whole card on every pixel. The hop timer is held in a ref and cleared on
 * unmount so a late callback cannot fire against an unmounted component.
 *
 * Purely decorative, so it is aria-hidden, ignores pointer events, and — for
 * anyone who asked for reduced motion — simply never starts following the
 * pointer instead of animating across the screen.
 */
function HoppingFrog() {
  const frogRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const hopTimer = useRef<number | null>(null);

  const [hop, setHop] = useState(false);

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

    window.addEventListener('mousemove', onMove);

    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      if (hopTimer.current !== null) window.clearTimeout(hopTimer.current);
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
      {/* `unoptimized` for the same reason as the flags in LanguageButton: the
          image optimizer refuses SVG unless next.config sets
          dangerouslyAllowSVG, which would let any /_next/image URL serve
          attacker-controlled markup from our origin. This is the same file the
          browser tab already has cached. */}
      <Image
        src="/icon.svg"
        alt=""
        width={56}
        height={56}
        unoptimized
        style={{ display: 'block' }}
      />
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
          {/* Same 1024x1024 source as the header, painted at 220px here.
              `priority` because this logo is the login page's LCP element:
              it sits at the top of the only card on the page. */}
          <Image
            src="/feedmyfrog.jpg"
            alt="feedmyfrog"
            width={220}
            height={220}
            priority
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
            {APP_NAME}
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
