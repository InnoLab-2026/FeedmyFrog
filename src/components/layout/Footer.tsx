import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      className="py-6 mt-auto"
      style={{ background: 'white', boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)', minHeight: '120px' }}
    >
      <div
        className="max-w-[900px] mx-auto px-5 text-center flex flex-col items-center gap-2"
        style={{ fontSize: '14px', fontWeight: 500 }}
      >
        <div className="inline-block px-6 py-2 rounded-full" style={{ background: 'white' }}>
          <a href="https://github.com/InnoLab-2026/relay-zero-host/tree/main" className="hover:underline" style={{ fontWeight: 700, color: 'black' }}>
            WayMakr
          </a>{' '}2026
        </div>
        <div className="inline-block px-6 py-2 rounded-full" style={{ background: 'white' }}>
          <a href="https://github.com/mklemmingen"  className="hover:underline" style={{ color: 'black' }}>Lauterbach</a>,{' '}
          <a href="https://github.com/MeinhardH0815" className="hover:underline" style={{ color: 'black' }}>Holzknecht</a>, Neu, Arpa
        </div>
        <div className="inline-block px-6 py-2 rounded-full" style={{ background: 'white' }}>
          <Link href="/impressum" className="hover:underline" style={{ color: 'black' }}>Impressum</Link>
          {' · '}
          <Link href="/datenschutz" className="hover:underline" style={{ color: 'black' }}>Datenschutz</Link>
        </div>
      </div>
    </footer>
  );
}
