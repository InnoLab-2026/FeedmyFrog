'use client';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { Listing } from '@/types';
import { CARD_SHADOW } from '@/constants';

interface ListingCardProps {
  listing: Listing;
  /** Owner-only affordance (e.g. delete button) rendered below the card body. */
  ownerActions?: ReactNode;
}

export default function ListingCard({ listing, ownerActions }: ListingCardProps) {
  const { t } = useTranslation();

  const ariaLabel = [
    listing.title,
    listing.description,
    listing.tags.map((tag) => t('aria_tag', { tag })).join(', '),
    t('aria_location', { location: listing.location }),
    `Email: ${listing.email}`,
  ].join('. ');

  return (
    <div
      className="p-6 cursor-pointer focus:outline-none"
      tabIndex={0}
      role="article"
      aria-label={ariaLabel}
      style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '3px solid black';
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      <h3
        className="mb-2"
        style={{
          fontFamily: 'var(--font-family-display)',
          fontWeight: 600,
          fontSize: '17px',
          lineHeight: 1.3,
        }}
      >
        {listing.title}
      </h3>
      <p className="mb-3" style={{ fontSize: '14px', lineHeight: 1.5 }}>
        {listing.description}
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {listing.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full text-xs"
            style={{
              background: 'white',
              color: 'black',
              border: '2px solid black',
              fontWeight: 600,
            }}
          >
            #{tag}
          </span>
        ))}
      </div>
      <div
        className="flex items-center justify-between"
        style={{ fontSize: '13px', fontWeight: 500 }}
      >
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>{listing.location}</span>
        </div>
        <a
          href={`mailto:${listing.email}`}
          className="hover:underline focus:outline-none"
          style={{ color: 'black' }}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid black';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          {listing.email}
        </a>
      </div>
      {ownerActions && <div className="mt-4">{ownerActions}</div>}
    </div>
  );
}
