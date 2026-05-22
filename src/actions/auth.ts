'use server';
import { redirect } from 'next/navigation';
import { destroySession } from '@/lib/session';

export async function logout() {
  await destroySession();
  redirect('/login');
}
