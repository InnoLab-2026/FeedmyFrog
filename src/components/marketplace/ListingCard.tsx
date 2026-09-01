'use client';

import { MapPin, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  ownerActions?: ReactNode;
  alternateBackground?: boolean;
}

export default function ListingCard({
  listing,
  ownerActions,
  alternateBackground = false,
}: ListingCardProps) {
  const { t } = useTranslation();

  const ariaLabel = [
    listing.title,
    listing.description,
    listing.tags
      .map((tag) => t('aria_tag', { tag }))
      .join(', '),
    t('aria_location', { location: listing.location }),
  ].join('. ');

  // The subject is one translated string with the title interpolated, not
  // `t('contact') + ': ' + title` — the separator and its spacing are part of
  // the sentence (French, for one, puts a space before the colon).
  const mailtoLink = `mailto:${listing.email}?subject=${encodeURIComponent(
    t('contact_subject', { title: listing.title }),
  )}`;

  return (
    <div
      className="p-7 cursor-pointer focus:outline-none"
      tabIndex={0}
      role="article"
      aria-label={ariaLabel}
      style={{
        background: alternateBackground ? 'white' : '#F7FBF9',
        border: '1px solid rgba(47, 47, 47, 0.15)',
        borderRadius: '10px',
        boxShadow:
          '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '3px solid #8DC63F';
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      <h3
        className="mb-3"
        style={{
          fontFamily: 'var(--font-family-display)',
          fontWeight: 600,
          fontSize: 'var(--fs-lg)',
          lineHeight: 1.3,
          color: '#2F2F2F',
        }}
      >
        {listing.title}
      </h3>

      <p
        className="mb-4"
        style={{
          fontSize: 'var(--fs-sm)',
          lineHeight: 1.6,
          color: '#5a5a5a',
        }}
      >
        {listing.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {listing.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 text-xs"
            style={{
              background: 'rgba(141, 198, 63, 0.08)',
              color: '#8DC63F',
              border: '1px solid rgba(141, 198, 63, 0.2)',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            #{tag}
          </span>
        ))}
      </div>

      <div
        className="flex items-center justify-between pt-3"
        style={{
          fontSize: 'var(--fs-xs)',
          fontWeight: 500,
          borderTop: '1px solid rgba(47, 47, 47, 0.08)',
        }}
      >
        <div
          className="flex items-center gap-1.5"
          style={{ color: '#6a6a6a' }}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{listing.location}</span>
        </div>

        <a
          href={mailtoLink}
          className="flex items-center gap-1.5 px-4 py-2 transition-all duration-200"
          style={{
            background: '#8DC63F',
            color: '#1a3200',
            border: '1px solid #8DC63F',
            borderRadius: '7px',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#72a830';
            e.currentTarget.style.borderColor = '#72a830';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#8DC63F';
            e.currentTarget.style.borderColor = '#8DC63F';
          }}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>{t('contact')}</span>
        </a>
      </div>

      {ownerActions && (
        <div className="mt-4">
          {ownerActions}
        </div>
      )}
    </div>
  );
}