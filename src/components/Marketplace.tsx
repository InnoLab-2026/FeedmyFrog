'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Listing, Mode, Category } from '@/types';
import { iconMap } from '@/data/icons';
import Header from '@/components/layout/Header';
import ModeToggle from '@/components/marketplace/ModeToggle';
import CategoryTabs from '@/components/marketplace/CategoryTabs';
import PaginationControls from '@/components/marketplace/PaginationControls';
import ListingCard from '@/components/marketplace/ListingCard';

interface MarketplaceProps {
  listings: Listing[];
  logoutAction: () => Promise<void>;
}

export default function Marketplace({ listings, logoutAction }: MarketplaceProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('need');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Reset selectedCategory when mode flips. This is the
  // "adjust state during render" pattern — React applies the new
  // value before committing without firing an extra effect.
  const [lastMode, setLastMode] = useState(mode);
  if (mode !== lastMode) {
    setLastMode(mode);
    setSelectedCategory('All');
  }

  // Reset currentPage whenever any filter input changes.
  const filterKey = `${mode}|${selectedCategory}|${searchQuery}|${itemsPerPage}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setCurrentPage(1);
  }

  const categories = useMemo<Category[]>(() => {
    const counts: Record<string, number> = {};
    listings
      .filter((l) => l.type === mode)
      .forEach((l) =>
        l.tags.forEach((tag) => {
          counts[tag] = (counts[tag] || 0) + 1;
        }),
      );

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => ({
        id: tag,
        label: tag,
        icon: iconMap[tag] ?? <Search className="w-4 h-4" />,
      }));

    return [
      { id: 'All', label: 'All', icon: <Search className="w-4 h-4" /> },
      ...sorted,
    ];
  }, [listings, mode]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return listings.filter((l) => {
      if (l.type !== mode) return false;
      if (selectedCategory !== 'All' && !l.tags.includes(selectedCategory))
        return false;
      if (
        q &&
        !l.title.toLowerCase().includes(q) &&
        !l.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [listings, mode, selectedCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / itemsPerPage));
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const showPagination = filteredListings.length > 15;

  return (
    <>
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} logoutAction={logoutAction} />

      <main className="max-w-[1400px] w-full mx-auto px-5 flex-grow pb-8">
        <ModeToggle mode={mode} onChange={setMode} />
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        {showPagination && (
          <div className="mb-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
        <div className="space-y-4">
          {filteredListings.length === 0 ? (
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
            paginatedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          )}
        </div>
        {showPagination && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </main>
    </>
  );
}
