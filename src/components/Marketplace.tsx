'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ScrollToTop from '@/components/layout/ScrollToTop';

import type { Listing, Mode, Category } from '@/types';
import { iconMap } from '@/data/icons';
import {
  STANDARD_CATEGORY_TAGS,
  getCategoryTranslationKey,
  isStandardCategory,
} from '@/data/categories';

import Header from '@/components/layout/Header';
import type { LocationFilter } from '@/components/marketplace/LocationSearch';
import { CITY_COORDS, DEFAULT_RADIUS_KM, isPlace } from '@/lib/geo';
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
  email: string;

  /** Tags of the current mode, ordered by frequency (server-aggregated). */
  categoryTags: string[];

  /** Place the radius filter is centred on, or null when it is off. */
  place: string | null;
  radiusKm: number;
  /** The place came from a GPS fix, so the control says "Near X". */
  approximate: boolean;
}

const SEARCH_DEBOUNCE_MS = 300;

export default function Marketplace({
  listings,
  totalCount,
  page,
  perPage,
  mode,
  category,
  query,
  email,
  categoryTags,
  place,
  radiusKm,
  approximate,
}: MarketplaceProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lastQuery, setLastQuery] = useState(query);

  if (query !== lastQuery) {
    setLastQuery(query);

    setSearchInput((current) =>
      current === lastQuery ? query : current,
    );
  }

  function navigate(
    next: Partial<{
      mode: Mode;
      category: string;
      q: string;
      page: number;
      per: number;
      place: string | null;
      radiusKm: number;
      approximate: boolean;
    }>,
    replace = false,
  ) {
    const merged = {
      mode,
      category,
      q: query,
      page,
      per: perPage,
      place,
      radiusKm,
      approximate,
      ...next,
    };

    const params = new URLSearchParams();

    if (merged.mode !== 'need') {
      params.set('mode', merged.mode);
    }

    if (merged.category !== 'All') {
      params.set('cat', merged.category);
    }

    if (merged.q) {
      params.set('q', merged.q);
    }

    if (merged.page > 1) {
      params.set('page', String(merged.page));
    }

    if (merged.per !== 15) {
      params.set('per', String(merged.per));
    }

    /*
     * The place travels as a name and the server looks its coordinates up
     * again, so a shared link stays readable and cannot ask about an
     * arbitrary point on the map.
     */
    if (merged.place) {
      params.set('loc', merged.place);

      if (merged.radiusKm !== DEFAULT_RADIUS_KM) {
        params.set('r', String(merged.radiusKm));
      }

      if (merged.approximate) {
        params.set('near', '1');
      }
    }

    const qs = params.toString();
    const url = qs ? `/?${qs}` : '/';

    startTransition(() => {
      if (replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    });
  }

  function onSearchChange(value: string) {
    setSearchInput(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      navigate(
        {
          q: value.trim(),
          page: 1,
        },
        true,
      );
    }, SEARCH_DEBOUNCE_MS);
  }

  /*
   * "All" first, then the built-in categories in their fixed order so the
   * tab strip looks the same on every visit (and stays translated), then
   * every other tag actually in use — categoryTags comes from the server
   * already ranked by how many current listings carry each tag. Without
   * that tail, a free-form hashtag would render on the card but have no tab
   * that filters to it. CategoryTabs shows the ones that fit and folds the
   * rest under "more categories".
   */
  const categories = useMemo<Category[]>(() => {
    const extraTags = categoryTags.filter((tag) => !isStandardCategory(tag));

    return [
      {
        id: 'All',
        label: t('category_all'),
        icon: <Search className="w-4 h-4" />,
      },
      ...[...STANDARD_CATEGORY_TAGS, ...extraTags].map((tag) => ({
        id: tag,
        label: t(getCategoryTranslationKey(tag)),
        icon: iconMap[tag] ?? <Search className="w-4 h-4" />,
      })),
    ];
  }, [categoryTags, t]);

  // `isPlace` narrows the string from the URL to a member of PLACES before it
  // is used as a key, so an unknown `?loc=` yields no filter rather than an
  // undefined lookup.
  const locationFilter: LocationFilter | null = isPlace(place)
    ? {
        city: place,
        approximate,
        lat: CITY_COORDS[place].lat,
        lng: CITY_COORDS[place].lng,
        radius: radiusKm,
      }
    : null;

  function onLocationChange(value: LocationFilter | null) {
    navigate({
      place: value ? value.city : null,
      radiusKm: value?.radius ?? DEFAULT_RADIUS_KM,
      approximate: value?.approximate ?? false,
      page: 1,
    });
  }

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / perPage),
  );

  const showPagination = totalCount > perPage;

  return (
    <>
      <Header
        searchQuery={searchInput}
        onSearchChange={onSearchChange}
        email={email}
        locationFilter={locationFilter}
        onLocationChange={onLocationChange}
      />

      <main className="max-w-[1400px] w-full mx-auto px-5 flex-grow pb-8">
        <ModeToggle
          mode={mode}
          onChange={(m) =>
            navigate({
              mode: m,
              category: 'All',
              page: 1,
            })
          }
        />

        <CategoryTabs
          categories={categories}
          selectedCategory={category}
          onSelectCategory={(c) =>
            navigate({
              category: c,
              page: 1,
            })
          }
        />

        {showPagination && (
          <div className="mb-6">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              itemsPerPage={perPage}
              onPageChange={(p) =>
                navigate({ page: p })
              }
              onItemsPerPageChange={(n) =>
                navigate({
                  per: n,
                  page: 1,
                })
              }
            />
          </div>
        )}

        <div
          className="space-y-4"
          style={{
            opacity: isPending ? 0.6 : 1,
            transition: 'opacity 150ms',
          }}
        >
          {totalCount === 0 ? (
            <div className="text-center py-12">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{
                  background: 'white',
                  border: '2px solid black',
                }}
              >
                <Search className="w-7 h-7" />
              </div>

              <p
                style={{
                  fontSize: 'var(--fs-base)',
                  fontWeight: 500,
                }}
              >
                {t('no_results')}
              </p>

              <p
                style={{
                  fontSize: 'var(--fs-sm)',
                  marginTop: '8px',
                }}
              >
                {t('try_different')}
              </p>
            </div>
          ) : (
            listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
              />
            ))
          )}
        </div>

        {showPagination && (
          <div className="mt-6">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              itemsPerPage={perPage}
              onPageChange={(p) =>
                navigate({ page: p })
              }
              onItemsPerPageChange={(n) =>
                navigate({
                  per: n,
                  page: 1,
                })
              }
            />
          </div>
        )}
      </main>
      <ScrollToTop />
    </>
  );
}
