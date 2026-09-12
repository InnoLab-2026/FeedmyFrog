import Link from 'next/link';

import { APP_NAME } from '@/constants';

export default function Footer() {
  return (
    <footer
      className="py-6 mt-auto"
      style={{
        background: 'var(--card-bg)',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
        minHeight: '120px',
      }}
    >
      <div
        className="max-w-[900px] mx-auto px-5 text-center flex flex-col items-center gap-2"
        style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--page-fg)' }}
      >
        <div className="inline-block px-6 py-2 rounded-full" style={{ background: 'var(--page-bg)' }}>
          <a
            href="https://github.com/InnoLab-2026/FeedmyFrog"
            className="hover:underline"
            style={{ fontWeight: 700, color: 'var(--page-fg)' }}
          >
            {APP_NAME}
          </a>
          {' '}
          2026
        </div>
        <div className="inline-block px-6 py-2 rounded-full" style={{ background: 'var(--page-bg)' }}>
          <a href="https://github.com/mklemmingen" className="hover:underline" style={{ color: 'var(--page-fg)' }}>
            Lauterbach
          </a>
          {' '}
          <a href="https://github.com/MeinhardH0815" className="hover:underline" style={{ color: 'var(--page-fg)' }}>
            Holzknecht
          </a>
          {' '}
          <a href="https://github.com/KathrinNeu" className="hover:underline" style={{ color: 'var(--page-fg)' }}>
            Neu
          </a>
          {' '}
          <a href="https://github.com/BusraSunanur" className="hover:underline" style={{ color: 'var(--page-fg)' }}>
            Arpa
          </a>
        </div>
        <div className="inline-block px-6 py-2 rounded-full" style={{ background: 'var(--page-bg)' }}>
          <Link href="/impressum" className="hover:underline" style={{ color: 'var(--page-fg)' }}>
            Impressum
          </Link>
          {' · '}
          <Link href="/datenschutz" className="hover:underline" style={{ color: 'var(--page-fg)' }}>
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
}