import type { Metadata } from 'next';
import { getRequestLanguage, serverT } from '@/i18n/server';
import { APP_NAME } from '@/constants';

import LoginCard from './LoginCard';

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return { title: `${serverT(language, 'page_title_login')} · ${APP_NAME}` };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <LoginCard initialErrorCode={error ?? null} />;
}
