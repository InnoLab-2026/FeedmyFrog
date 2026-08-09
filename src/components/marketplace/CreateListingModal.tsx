'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import CreateListingForm from '@/components/marketplace/CreateListingForm';

interface CreateListingModalProps {
  email: string;
}

export default function CreateListingModal({
  email,
}: CreateListingModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Button auf Meine Anzeigen */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center"
        style={{
          gap: '10px',
          minHeight: '54px',
          padding: '0 26px',
          background: '#8DC63F',
          color: '#1a3200',
          border: 'none',
          borderRadius: '9px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Plus
          style={{
            width: '22px',
            height: '22px',
          }}
        />

        {t('create_listing')}
      </button>

      {/* Popup */}
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            padding: '24px',
            background: 'rgba(0, 0, 0, 0.55)',
            zIndex: 100,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'white',
              border: '1px solid rgba(47,47,47,0.18)',
              borderRadius: '18px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            {/* Kopf */}
            <div
              className="flex items-center justify-between"
              style={{
                marginBottom: '30px',
              }}
            >
              <h1
                style={{
                  margin: 0,
                  color: '#2F2F2F',
                  fontSize: '30px',
                  lineHeight: 1.2,
                  fontWeight: 700,
                }}
              >
                {t('create_listing_title')}
              </h1>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('close')}
                className="flex items-center justify-center"
                style={{
                  width: '48px',
                  height: '48px',
                  flexShrink: 0,
                  background: 'white',
                  color: '#2F2F2F',
                  border: '1px solid rgba(47,47,47,0.2)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                <X
                  style={{
                    width: '26px',
                    height: '26px',
                  }}
                />
              </button>
            </div>

            <CreateListingForm email={email} />
          </div>
        </div>
      )}
    </>
  );
}