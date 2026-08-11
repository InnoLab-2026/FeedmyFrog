import type { Metadata } from 'next';

import LoginCard from './LoginCard';

export const metadata: Metadata = {
  title: 'Anmelden · Reutlingen University Connect',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <LoginCard initialErrorCode={error ?? null} />;
}
