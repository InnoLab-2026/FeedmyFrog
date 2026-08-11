'use client';

interface CategoryTabProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  fullWidth?: boolean;
}

const CategoryTab = ({
  isSelected,
  onClick,
  children,
  isFirst,
  isLast,
  fullWidth = false,
}: CategoryTabProps) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 ${
      fullWidth ? 'w-full h-full' : 'flex-1'
    }`}
    style={{
      minHeight: '68px',
      background: isSelected ? '#8DC63F' : 'white',
      color: '#2f2f2f',
      borderTop: '1px solid rgba(47,47,47,0.15)',
      borderBottom: '1px solid rgba(47,47,47,0.15)',
      borderLeft: isFirst
        ? '1px solid rgba(47,47,47,0.15)'
        : 'none',
      borderRight: '1px solid rgba(47,47,47,0.15)',
      borderTopLeftRadius: isFirst ? '8px' : '0',
      borderTopRightRadius: isLast ? '8px' : '0',
      fontWeight: 600,
      fontSize: '15px',
      cursor: 'pointer',
      zIndex: isSelected ? 2 : 1,
    }}
  >
    {children}
  </button>
);

export default CategoryTab;