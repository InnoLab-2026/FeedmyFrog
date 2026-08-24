import type { Metadata } from 'next';
import VerifyPromptCard from './VerifyPromptCard';

export const metadata: Metadata = {
  title: 'Anmelden · Reutlingen University Connect',
};

export default async function VerifyPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <VerifyPromptCard token={token ?? null} />;
}
