import type { Metadata } from 'next';
import { getRequestLanguage, serverT } from '@/i18n/server';
import { APP_NAME } from '@/constants';
import VerifyPromptCard from './VerifyPromptCard';

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return { title: `${serverT(language, 'page_title_login')} · ${APP_NAME}` };
}

export default async function VerifyPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <VerifyPromptCard token={token ?? null} />;
}
