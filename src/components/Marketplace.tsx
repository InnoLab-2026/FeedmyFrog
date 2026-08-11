'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
}

const SEARCH_DEBOUNCE_MS = 300;

/*
 * Maps the 9 built-in categories (also offered as quick-pick tags when
 * creating a listing) to their translation key. Any other tag is a free-form
 * one a user typed in — falls through to the tag string itself, which is
 * exactly right since there's no translation for made-up text.
 */
function getCategoryTranslationKey(tag: string) {
  const keys: Record<string, string> = {
    Familie: 'category_family',
    Kinder: 'category_children',
    Wochenende: 'category_weekend',
    Mobilität: 'category_mobility',
    Pendeln: 'category_commuting',
    Verkauf: 'category_sale',
    Dienstleistungen: 'category_services',
    Transport: 'category_transport',
    Bildung: 'category_education',
  };

  return keys[tag] ?? tag;
}

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
    }>,
    replace = false,
  ) {
    const merged = {
      mode,
      category,
      q: query,
      page,
      per: perPage,
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
   * categoryTags comes from the server already ranked by how many current
   * listings use each tag (most-used first) — every tag actually in use
   * becomes a tab, not just the 9 built-in categories. CategoryTabs takes
   * care of only showing the top few and folding the rest under "...".
   */
  const categories = useMemo<Category[]>(
    () => [
      {
        id: 'All',
        label: t('category_all'),
        icon: <Search className="w-4 h-4" />,
      },

      ...categoryTags.map((tag) => ({
        id: tag,
        label: t(getCategoryTranslationKey(tag)),
        icon:
          iconMap[tag] ?? (
            <Search className="w-4 h-4" />
          ),
      })),
    ],
    [categoryTags, t],
  );

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
    </>
  );
}