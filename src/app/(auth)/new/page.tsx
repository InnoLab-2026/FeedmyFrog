import { requireSession } from '@/lib/session';
import CreateListingForm from '@/components/marketplace/CreateListingForm';

export default async function NewListingPage() {
  const session = await requireSession();

  return (
    <CreateListingForm
      email={session.email}
    />
  );
}