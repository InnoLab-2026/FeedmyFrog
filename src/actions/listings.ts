'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { getSession } from '@/lib/session';
import { ListingInput, Uuid } from '@/lib/validators';

/*
 * No coordinates are written here, and none are read from the request.
 * `location` is one of the names in PLACES (src/lib/geo.ts), validated by
 * ListingInput, and that name is the whole of what this app stores about
 * where a listing is. The radius filter derives the rest at query time from
 * the same constant table, so there is nothing per-row to keep in sync and
 * nothing at rest more precise than a place name.
 */

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

  /*
   * Returns instead of redirecting, so the caller knows the insert actually
   * happened. The form shows its confirmation on this result and navigates
   * itself once it has been seen — pacing that belongs in the browser, not
   * in a server action holding a connection open while nothing happens.
   */
  return { ok: true };
}

export async function updateListing(
  _prev: UpdateState | null,
  formData: FormData,
): Promise<UpdateState> {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = Uuid.safeParse(formData.get('id'));
  if (!id.success) return { ok: false, errors: { id: ['invalid_id'] } };

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
    return { ok: false, errors: { id: ['not_found'] } };
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
