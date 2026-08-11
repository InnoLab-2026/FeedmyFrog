'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
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

  // Desktop:
  // Alle + 2 häufigste Kategorien
  const [visibleCount, setVisibleCount] = useState(3);

  const [showDropdown, setShowDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Auf kleineren Bildschirmen nur:
  // Alle + häufigste Kategorie
  useEffect(() => {
    const calculate = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.offsetWidth;

      if (width < 700) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    calculate();

    window.addEventListener('resize', calculate);

    return () => {
      window.removeEventListener('resize', calculate);
    };
  }, []);

  // Dropdown schließen, wenn außerhalb geklickt wird
  useEffect(() => {
    if (!showDropdown) return;

    const handler = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [showDropdown]);

  const visible = categories.slice(0, visibleCount);
  const overflow = categories.slice(visibleCount);

  return (
    <div
      ref={containerRef}
      className="flex w-full"
      style={{
        marginBottom: '16px',
        overflow: 'visible',
      }}
    >
      {/* Sichtbare Kategorien */}
      {visible.map((category, index) => (
        <CategoryTab
          key={category.id}
          isSelected={selectedCategory === category.id}
          onClick={() => onSelectCategory(category.id)}
          isFirst={index === 0}
          isLast={
            index === visible.length - 1 &&
            overflow.length === 0
          }
          fullWidth
        >
          {category.icon}
          {category.label}
        </CategoryTab>
      ))}

      {/* Restliche Kategorien unter ... */}
      {overflow.length > 0 && (
        <div
          ref={dropdownRef}
          className="flex-1 relative flex items-stretch"
        >
          {/* ... Button */}
          <button
            type="button"
            onClick={() =>
              setShowDropdown((current) => !current)
            }
            className="w-full flex items-center justify-center"
            style={{
              minHeight: '44px',
              background: 'white',
              color: '#2f2f2f',

              borderTop:
                '1px solid rgba(47,47,47,0.15)',
              borderBottom:
                '1px solid rgba(47,47,47,0.15)',
              borderRight:
                '1px solid rgba(47,47,47,0.15)',
              borderLeft: 'none',

              borderTopRightRadius: '12px',
              borderBottomRightRadius: '12px',

              cursor: 'pointer',
            }}
            aria-label={t('more_categories')}
            aria-expanded={showDropdown}
          >
            <MoreHorizontal
              style={{
                width: '22px',
                height: '22px',
              }}
            />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute top-full right-0"
              style={{
                marginTop: '8px',
                width: '250px',

                background: 'white',

                border:
                  '1px solid rgba(47,47,47,0.15)',

                borderRadius: '10px',

                boxShadow:
                  '0 8px 24px rgba(0,0,0,0.12)',

                overflow: 'hidden',
                zIndex: 50,
              }}
            >
              {overflow.map((category, index) => {
                const active =
                  selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(category.id);
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-3 w-full text-left"
                    style={{
                      padding: '15px 18px',

                      background: active
                        ? 'rgba(141,198,63,0.12)'
                        : 'white',

                      color: '#2f2f2f',

                      border: 'none',

                      borderBottom:
                        index <
                        overflow.length - 1
                          ? '1px solid rgba(47,47,47,0.08)'
                          : 'none',

                      fontSize: 'var(--fs-md)',
                      fontWeight: 500,

                      cursor: 'pointer',
                    }}
                  >
                    {category.icon}

                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}