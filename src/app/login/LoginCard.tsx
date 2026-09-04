'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import LoginForm from './LoginForm';
import LanguageButton from '@/components/layout/LanguageButton';
import FrogFace from '@/components/FrogFace';
import { APP_NAME, CARD_SHADOW } from '@/constants';
import { useEffect, useRef, useState } from 'react';

/*
 * A frog that follows the pointer along the bottom of the login page, and
 * pulls a happy face while it is moving.
 *
 * Mouse movement fires dozens of times a second, so two things are kept out
 * of React. The position is written straight to the node through a ref inside
 * one requestAnimationFrame per frame — a setState per mousemove re-renders
 * the whole card on every pixel. And `hoppingRef` mirrors the hop flag so a
 * continuous gesture schedules one state update at the start instead of one
 * per event; only the two edges, hop start and hop end, reach React at all.
 *
 * A click holds the hop longer than a nudge does, so the frog reacts to being
 * clicked at rather than merely passed over.
 *
 * Purely decorative, so it is aria-hidden, ignores pointer events, and — for
 * anyone who asked for reduced motion — simply never starts following the
 * pointer instead of animating across the screen.
 */

/** How long the frog stays up after a nudge, and after a click. */
const HOP_MS = 180;
const CLICK_MS = 400;

function HoppingFrog() {
  const frogRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const hopTimer = useRef<number | null>(null);
  const hoppingRef = useRef(false);

  const [hop, setHop] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Up now, down `ms` from the last nudge — the countdown restarts on every
    // event, so one continuous movement is one hop rather than a stutter.
    const startHop = (ms: number) => {
      if (!hoppingRef.current) {
        hoppingRef.current = true;
        setHop(true);
      }

      if (hopTimer.current !== null) window.clearTimeout(hopTimer.current);
      hopTimer.current = window.setTimeout(() => {
        hoppingRef.current = false;
        setHop(false);
      }, ms);
    };

    const onMove = (event: MouseEvent) => {
      const x = event.clientX;

      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(() => {
          frameRef.current = null;
          if (frogRef.current) frogRef.current.style.left = `${x}px`;
        });
      }

      startHop(HOP_MS);
    };

    const onClick = () => startHop(CLICK_MS);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
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
      <FrogFace happy={hop} size={56} />
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
