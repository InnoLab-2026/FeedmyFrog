'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { getSession } from '@/lib/session';
import { ListingInput, Uuid } from '@/lib/validators';

export type CreateState =
  | { ok: true }
  | { ok: false; errors: Record<string, string[]> };

export type UpdateState =
  | { ok: true }
  | { ok: false; errors: Record<string, string[]> };

export async function createListing(
  _prev: CreateState | null,
  formData: FormData,
): Promise<CreateState> {
  const session = await getSession();
  if (!session) redirect('/login');

  const rawTags = formData.get('tags');
  const tags =
    typeof rawTags === 'string'
      ? rawTags.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const parsed = ListingInput.safeParse({
    type: formData.get('type'),
    title: formData.get('title'),
    description: formData.get('description'),
    tags,
    location: formData.get('location'),
  });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(listings).values({
    userId: session.userId,
    email: session.email,
    ...parsed.data,
  });

  revalidatePath('/');
  revalidatePath('/meine');
  redirect('/');
}

export async function updateListing(
  _prev: UpdateState | null,
  formData: FormData,
): Promise<UpdateState> {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = Uuid.safeParse(formData.get('id'));
  if (!id.success) return { ok: false, errors: { id: ['Invalid listing ID'] } };

  const rawTags = formData.get('tags');
  const tags =
    typeof rawTags === 'string'
      ? rawTags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const parsed = ListingInput.safeParse({
    type: formData.get('type'),
    title: formData.get('title'),
    description: formData.get('description'),
    tags,
    location: formData.get('location'),
  });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const updated = await db
    .update(listings)
    .set(parsed.data)
    .where(and(eq(listings.id, id.data), eq(listings.userId, session.userId)))
    .returning({ id: listings.id });

  if (updated.length === 0) {
    return { ok: false, errors: { id: ['Eintrag nicht gefunden'] } };
  }

  revalidatePath('/');
  revalidatePath('/meine');
  redirect('/meine');
}

export async function deleteListing(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = Uuid.safeParse(formData.get('id'));
  if (!id.success) return;

  await db
    .delete(listings)
    .where(and(eq(listings.id, id.data), eq(listings.userId, session.userId)));

  revalidatePath('/');
  revalidatePath('/meine');
}
