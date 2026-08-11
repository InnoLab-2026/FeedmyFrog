import { requireSession } from '@/lib/session';
import CreateListingForm from '@/components/marketplace/CreateListingForm';
import NewListingPageHeader from './NewListingPageHeader';

export default async function NewListingPage() {
  const session = await requireSession();

  return (
    <main className="max-w-[800px] mx-auto px-5 py-8">
      <NewListingPageHeader />
      <CreateListingForm
        email={session.email}
      />
    </main>
  );
}