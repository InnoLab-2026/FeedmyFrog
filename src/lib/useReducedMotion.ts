'use client';

import { useEffect, useState } from 'react';

/**
 * Whether the reader has asked their system to reduce motion.
 *
 * Starts `false` so the server render and the first client render agree; the
 * effect corrects it before any of the animations that consult it can be
 * triggered by a user action. Subscribed rather than read once, because the
 * setting can be changed while the page is open.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}
