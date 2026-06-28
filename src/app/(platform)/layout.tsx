import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f5f5' }}>
      {children}
    </div>
  );
}
