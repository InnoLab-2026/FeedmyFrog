'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import CreateListingForm from '@/components/marketplace/CreateListingForm';

interface CreateListingModalProps {
  email: string;
  /**
   * Text on the trigger. Defaults to `create_listing` ("Create listing"); the
   * header passes `manage_listings` ("Post a new listing") so the homepage CTA
   * keeps the wording it had as a link.
   */
  label?: string;
}

export default function CreateListingModal({
  email,
  label,
}: CreateListingModalProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Focus was moved into the dialog when it opened, so it has to be put
    // back; otherwise it falls to the top of the document and a keyboard user
    // tabs the whole header again to get back to where they were.
    triggerRef.current?.focus();
  }, []);

  /*
   * Escape closes it, and while it is open the page behind does not scroll.
   * Both are what a dialog is expected to do: without the first the only way
   * out is finding the X with a pointer, and without the second a wheel
   * gesture aimed at the form scrolls the marketplace underneath it once the
   * form itself is at its end.
   */
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  /*
   * Focus moves to the dialog itself rather than to the first field, so the
   * heading is what gets announced -- a two-step form whose first control is
   * a tag button reads as nothing useful. `tabIndex={-1}` on the container is
   * what makes it focusable at all.
   */
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  /*
   * Keeps Tab inside the dialog. Nothing behind the overlay can be clicked,
   * so nothing behind it should be reachable by keyboard either -- otherwise
   * Tab walks out of the form into a page the reader cannot see.
   */
  function onKeyDownTrap(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;

    const candidates = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]),' +
        ' select:not([disabled]), textarea:not([disabled]),' +
        ' [tabindex]:not([tabindex="-1"])',
    );

    if (!candidates) return;

    /*
     * `offsetParent` drops anything not actually laid out. The five hidden
     * inputs the form carries its values in would otherwise be the first
     * "focusable" elements in the dialog, and focusing one of them is a no-op
     * — so Shift+Tab off the first real control would go nowhere.
     */
    const focusable = [...candidates].filter((el) => el.offsetParent !== null);

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /*
   * What the form does when a listing is published: nothing on its own, it
   * calls this. Closing unmounts the form, which is also what clears its
   * fields for next time, and `router.refresh()` is what brings the new
   * listing into the list behind.
   *
   * The form used to navigate to '/' itself. In a modal nothing goes away on
   * a navigation -- `open` is this component's state and the celebration is
   * keyed on the action's result -- so that left a full-screen overlay with
   * no dismiss control on top of a modal that never closed.
   */
  /*
   * `useCallback`, because the form holds this in a `useEffect` dependency
   * list alongside the celebration timer: a fresh identity on every render
   * would clear and restart that timer, and a parent that re-rendered often
   * enough would keep pushing the handover back indefinitely.
   */
  const onPublished = useCallback(() => {
    close();
    router.refresh();
  }, [close, router]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center justify-center"
        style={{
          gap: '6px',
          height: '40px',
          padding: '0 14px',
          background: '#8DC63F',
          color: '#1a3200',
          border: 'none',
          borderRadius: '8px',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Plus style={{ width: '16px', height: '16px' }} />
        {label ?? t('create_listing')}
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
              close();
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={onKeyDownTrap}
            className="slim-scrollbar"
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
              outline: 'none',
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
                id={titleId}
                style={{
                  margin: 0,
                  color: '#2F2F2F',
                  fontSize: 'var(--fs-3xl)',
                  lineHeight: 1.2,
                  fontWeight: 700,
                }}
              >
                {t('create_listing_title')}
              </h1>

              <button
                type="button"
                onClick={close}
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

            <CreateListingForm email={email} onPublished={onPublished} />
          </div>
        </div>
      )}
    </>
  );
}
