'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export default function PaginationControls({
  currentPage, totalPages, itemsPerPage, onPageChange, onItemsPerPageChange,
}: PaginationControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-3">
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{t('items_per_page')}</span>
      <select
        value={itemsPerPage}
        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        className="px-4 py-2 cursor-pointer appearance-none rounded-xl"
        style={{ background: 'white', color: 'black', border: '2px solid black', fontSize: '14px', fontWeight: 500 }}
      >
        <option value={15}>15</option>
        <option value={30}>30</option>
        <option value={50}>50</option>
      </select>

      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-xl"
        style={{ background: 'white', border: '2px solid black', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '100px', textAlign: 'center' }}>
        {t('page_of', { current: currentPage, total: totalPages })}
      </span>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl"
        style={{ background: 'white', border: '2px solid black', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
