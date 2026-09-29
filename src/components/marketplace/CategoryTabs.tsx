'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CategoryTab from './CategoryTab';
import type { Category } from '@/types';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

/*
 * Estimated width of one tab: icon + gap + label + horizontal padding.
 */
const ICON_WIDTH = 20;
const LABEL_GAP = 8;
const CHAR_WIDTH = 9;
const TAB_PADDING = 80;

/** Room the "more categories" tab needs when there is anything to fold away. */
const OVERFLOW_TRIGGER_WIDTH = 150;

/** "All" plus at least one category on wider screens. */
const MIN_VISIBLE = 2;

export default function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(MIN_VISIBLE);
  const [isMobile, setIsMobile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculate = () => {
      const container = containerRef.current;
      if (!container) return;

      const mobile = window.matchMedia('(max-width: 767px)').matches;
      setIsMobile(mobile);

      if (mobile) {
        setVisibleCount(categories.length > 0 ? 1 : 0);
        return;
      }

      const containerWidth = container.offsetWidth;
      if (containerWidth === 0) return;

      const widths = categories.map(
        (category) =>
          ICON_WIDTH +
          LABEL_GAP +
          category.label.length * CHAR_WIDTH +
          TAB_PADDING,
      );

      const total = widths.reduce((sum, width) => sum + width, 0);

      // Everything fits: show every tab and skip the overflow menu entirely.
      // (The previous `count - 2` folded two tabs away even then.)
      if (total <= containerWidth) {
        setVisibleCount(categories.length);
        return;
      }

      // Something has to be folded away, so the trigger needs room as well.
      const budget = containerWidth - OVERFLOW_TRIGGER_WIDTH;

      let used = 0;
      let count = 0;
      for (const width of widths) {
        if (used + width > budget) break;
        used += width;
        count += 1;
      }

      setVisibleCount(
        Math.min(categories.length, Math.max(MIN_VISIBLE, count)),
      );
    };

    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [categories]);

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const visible = categories.slice(0, visibleCount);
  const overflow = categories.slice(visibleCount);

  return (
    <div className="relative mb-6" ref={containerRef}>
      <div className="flex" style={{ gap: isMobile ? '8px' : '0' }}>
        {visible.map((cat, i) => (
          <CategoryTab
            key={cat.id}
            isSelected={selectedCategory === cat.id}
            onClick={() => onSelectCategory(cat.id)}
            isFirst={i === 0}
            isLast={i === visible.length - 1 && overflow.length === 0}
            separated={isMobile}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </CategoryTab>
        ))}

        {overflow.length > 0 && (
          <CategoryTab
            isSelected={overflow.some((category) => category.id === selectedCategory)}
            onClick={() => setShowDropdown((v) => !v)}
            isFirst={false}
            isLast
            separated={isMobile}
            ariaHasPopup="menu"
            ariaExpanded={showDropdown}
          >
            <span style={{ fontSize: 'var(--fs-xs)', whiteSpace: 'nowrap' }}>
              {t('more_categories')}
            </span>
          </CategoryTab>
        )}
      </div>

      {showDropdown && overflow.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 overflow-hidden"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '10px',
            boxShadow: 'var(--elevation-lg)',
            zIndex: 10,
            maxHeight: '70vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
        >
          {overflow.map((cat, i) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onSelectCategory(cat.id);
                setShowDropdown(false);
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat.id) {
                  e.currentTarget.style.background = 'rgba(141, 198, 63, 0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat.id) {
                  e.currentTarget.style.background = 'var(--card-bg)';
                }
              }}
              className="flex items-center gap-2 py-3 px-4 w-full text-left transition-colors duration-150"
              style={{
                background: selectedCategory === cat.id ? '#8DC63F' : 'var(--card-bg)',
                color: selectedCategory === cat.id ? 'var(--on-accent)' : 'var(--page-fg)',
                borderBottom:
                  i < overflow.length - 1 ? '1px solid var(--divider)' : 'none',
                fontWeight: selectedCategory === cat.id ? 600 : 500,
                fontSize: 'var(--fs-sm)',
              }}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
