'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import LoginForm from './LoginForm';
import LanguageButton from '@/components/layout/LanguageButton';
import FrogFace from '@/components/FrogFace';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';
import { APP_NAME, CARD_SHADOW } from '@/constants';
import { useEffect, useRef, useState } from 'react';

/*
 * A frog that hops to wherever you click along the bottom of the login page,
 * and grins on the way.
 *
 * The horizontal travel is a CSS transition on `left`, written straight to
 * the node — the position never enters React, so a click costs one re-render
 * for the face and none for the movement.
 *
 * The arc is a separate element so the two do not fight: the outer node owns
 * `left` and the translateX that centres the frog on the click, the inner one
 * owns the vertical translateY. It is driven through the Web Animations API
 * rather than a CSS keyframe because a hop has to be able to interrupt itself
 * — clicking again mid-flight should start a fresh arc, and re-calling
 * `animate()` does that natively, where re-triggering a CSS animation needs a
 * forced reflow or a remount.
 *
 * Purely decorative, so it is aria-hidden and ignores pointer events. Under
 * prefers-reduced-motion the frog still answers the click and still grins, it
 * just arrives instantly instead of travelling.
 */

/** One hop: how long it takes, and how high it goes at the top of the arc. */
const HOP_MS = 520;
const HOP_HEIGHT = 46;

function HoppingFrog() {
  const frogRef = useRef<HTMLDivElement | null>(null);
  const arcRef = useRef<HTMLDivElement | null>(null);
  const restTimer = useRef<number | null>(null);

  const reducedMotion = usePrefersReducedMotion();
  const [hopping, setHopping] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Centred on the pointer by the translateX below, so the frog lands on
      // the click rather than beside it.
      if (frogRef.current) frogRef.current.style.left = `${event.clientX}px`;

      setHopping(true);
      if (restTimer.current !== null) window.clearTimeout(restTimer.current);
      restTimer.current = window.setTimeout(
        () => setHopping(false),
        reducedMotion ? 260 : HOP_MS,
      );

      if (reducedMotion) return;

      // Easing per keyframe, not across the whole animation: a single
      // `ease-out` compresses the timeline so the frog peaks a fifth of the
      // way in and lands while it is still travelling sideways. Decelerating
      // up and accelerating down puts the apex at the halfway mark and the
      // landing exactly when the horizontal transition ends.
      arcRef.current?.animate(
        [
          { transform: 'translateY(0)', easing: 'cubic-bezier(0.33, 0, 0.4, 1)' },
          {
            transform: `translateY(-${HOP_HEIGHT}px)`,
            offset: 0.5,
            easing: 'cubic-bezier(0.6, 0, 0.67, 1)',
          },
          { transform: 'translateY(0)' },
        ],
        { duration: HOP_MS },
      );
    };

    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('click', onClick);
      if (restTimer.current !== null) window.clearTimeout(restTimer.current);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={frogRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '40px',
        bottom: 8,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        transition: reducedMotion ? 'none' : `left ${HOP_MS}ms linear`,
      }}
    >
      <div ref={arcRef}>
        <FrogFace happy={hopping} size={56} />
      </div>
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
