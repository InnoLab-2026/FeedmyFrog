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

export default function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(5);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculate = () => {
      if (!containerRef.current) return;

      if (window.innerWidth < 768) {
        setVisibleCount(1);
        return;
      }

      const containerWidth = containerRef.current.offsetWidth;
      let totalWidth = 0;
      let count = 0;

      for (let i = 0; i < categories.length; i++) {
        const tabWidth = 20 + 8 + categories[i].label.length * 9 + 80;
        const withOverflow = totalWidth + tabWidth + (i < categories.length - 1 ? 60 : 0);
        if (withOverflow <= containerWidth) {
          totalWidth += tabWidth;
          count = i + 1;
        } else break;
      }

      setVisibleCount(Math.max(2, Math.min(count - 2, categories.length)));
    };

    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [categories]);

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const visible = categories.slice(0, visibleCount);
  const overflow = categories.slice(visibleCount);

  return (
    <div className="pb-6 relative" ref={containerRef}>
      <div className="flex gap-0">
        {visible.map((cat, i) => (
          <CategoryTab
            key={cat.id}
            isSelected={selectedCategory === cat.id}
            onClick={() => onSelectCategory(cat.id)}
            isFirst={i === 0}
            isLast={i === visible.length - 1 && overflow.length === 0}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </CategoryTab>
        ))}

        {overflow.length > 0 && (
          <div className="flex-1 relative flex items-stretch" ref={dropdownRef}>
            <CategoryTab
              isSelected={false}
              onClick={() => setShowDropdown((v) => !v)}
              isFirst={false}
              isLast
              fullWidth
            >
              <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                {t('more_categories')}
              </span>
            </CategoryTab>

            {showDropdown && (
              <div
                className="absolute top-full left-0 mt-2 w-48 bg-white overflow-hidden"
                style={{
                  border: '1px solid rgba(47, 47, 47, 0.15)',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                  zIndex: 20,
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
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                    className="flex items-center gap-2 py-3 px-4 w-full text-left transition-colors duration-150"
                    style={{
                      background: selectedCategory === cat.id ? '#8DC63F' : 'white',
                      color: selectedCategory === cat.id ? '#1a3200' : '#2F2F2F',
                      borderBottom:
                        i < overflow.length - 1 ? '1px solid rgba(47, 47, 47, 0.06)' : 'none',
                      fontWeight: selectedCategory === cat.id ? 600 : 500,
                      fontSize: '14px',
                    }}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}