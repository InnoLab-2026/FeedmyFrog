import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Footer from '@/components/layout/Footer';
import { SavedListingsProvider } from '@/components/marketplace/SavedListingsProvider';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <SavedListingsProvider>{children}</SavedListingsProvider>
      <Footer />
    </div>
  );
}
