'use client';
import { useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Listing, Mode, Category } from '@/types';
import { iconMap } from '@/data/icons';
import { logout } from '@/actions/auth';
import Header from '@/components/layout/Header';
import ModeToggle from '@/components/marketplace/ModeToggle';
import CategoryTabs from '@/components/marketplace/CategoryTabs';
import PaginationControls from '@/components/marketplace/PaginationControls';
import ListingCard from '@/components/marketplace/ListingCard';

interface MarketplaceProps {
  /** The current page slice — filtering and pagination happen in SQL. */
  listings: Listing[];
  totalCount: number;
  page: number;
  perPage: number;
  mode: Mode;
  category: string;
  query: string;
  /** Tags of the current mode, ordered by frequency (server-aggregated). */
  categoryTags: string[];
}

const SEARCH_DEBOUNCE_MS = 300;

// Filter and pagination state lives in the URL; this wrapper only translates
// the designer-owned components' callbacks into router navigations, so the
// server component re-queries the database with the new parameters.
export default function Marketplace({
  listings,
  totalCount,
  page,
  perPage,
  mode,
  category,
  query,
  categoryTags,
}: MarketplaceProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local echo of the search box so typing stays responsive while the
  // debounced URL update (and server round-trip) catches up.
  const [searchInput, setSearchInput] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adopt an externally-changed query (back/forward navigation) unless the
  // user has typed past the last URL state — adjust-during-render pattern.
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setSearchInput((current) => (current === lastQuery ? query : current));
  }

  function navigate(
    next: Partial<{ mode: Mode; category: string; q: string; page: number; per: number }>,
    replace = false,
  ) {
    const merged = { mode, category, q: query, page, per: perPage, ...next };
    const params = new URLSearchParams();
    if (merged.mode !== 'need') params.set('mode', merged.mode);
    if (merged.category !== 'All') params.set('cat', merged.category);
    if (merged.q) params.set('q', merged.q);
    if (merged.page > 1) params.set('page', String(merged.page));
    if (merged.per !== 15) params.set('per', String(merged.per));
    const qs = params.toString();
    const url = qs ? `/?${qs}` : '/';
    startTransition(() => {
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    });
  }

  function onSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ q: value.trim(), page: 1 }, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  const categories = useMemo<Category[]>(
    () => [
      { id: 'All', label: 'All', icon: <Search className="w-4 h-4" /> },
      ...categoryTags.map((tag) => ({
        id: tag,
        label: tag,
        icon: iconMap[tag] ?? <Search className="w-4 h-4" />,
      })),
    ],
    [categoryTags],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const showPagination = totalCount > 15;

  return (
    <>
      {/* Application-owned nav strip — not part of the designer-owned Header */}
      <div
        className="flex items-center justify-end gap-2 px-5 py-2"
        style={{ background: 'white', borderBottom: '1px solid #e5e5e5' }}
      >
        <Link
          href="/meine"
          className="rounded-xl px-3 py-1.5 text-sm font-medium"
          style={{ background: 'white', border: '2px solid black' }}
        >
          Meine Einträge
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-xl px-3 py-1.5 text-sm font-medium"
            style={{ background: 'white', border: '2px solid black' }}
          >
            Abmelden
          </button>
        </form>
      </div>
      <Header searchQuery={searchInput} onSearchChange={onSearchChange} />

      <main className="max-w-[1400px] w-full mx-auto px-5 flex-grow pb-8">
        <ModeToggle
          mode={mode}
          onChange={(m) => navigate({ mode: m, category: 'All', page: 1 })}
        />
        <CategoryTabs
          categories={categories}
          selectedCategory={category}
          onSelectCategory={(c) => navigate({ category: c, page: 1 })}
        />
        {showPagination && (
          <div className="mb-6">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              itemsPerPage={perPage}
              onPageChange={(p) => navigate({ page: p })}
              onItemsPerPageChange={(n) => navigate({ per: n, page: 1 })}
            />
          </div>
        )}
        <div className="space-y-4" style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 150ms' }}>
          {totalCount === 0 ? (
            <div className="text-center py-12">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ background: 'white', border: '2px solid black' }}
              >
                <Search className="w-7 h-7" />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 500 }}>{t('no_results')}</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                {t('try_different')}
              </p>
            </div>
          ) : (
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          )}
        </div>
        {showPagination && (
          <div className="mt-6">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              itemsPerPage={perPage}
              onPageChange={(p) => navigate({ page: p })}
              onItemsPerPageChange={(n) => navigate({ per: n, page: 1 })}
            />
          </div>
        )}
      </main>
    </>
  );
}
