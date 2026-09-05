import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';

export async function GET() {
  await createSession({
    userId: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    email: 'meinhard.holzknecht@student.reutlingen-university.de',
  });
  return NextResponse.json({ success: true, message: 'Dev session active' });
}
