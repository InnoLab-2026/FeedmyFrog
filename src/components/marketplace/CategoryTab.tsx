'use client';

interface CategoryTabProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  fullWidth?: boolean;
}

const CategoryTab = ({ isSelected, onClick, children, isFirst, isLast, fullWidth = false }: CategoryTabProps) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 py-3 whitespace-nowrap ${fullWidth ? 'w-full h-full' : 'flex-1'}`}
    style={{
      background: isSelected ? 'black' : 'white',
      color: isSelected ? 'white' : 'black',
      borderTop: '2px solid black',
      borderBottom: '2px solid black',
      borderLeft: isFirst ? '2px solid black' : '1px solid black',
      borderRight: isLast ? '2px solid black' : '1px solid black',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
      fontWeight: 600,
      fontSize: '14px',
      zIndex: isSelected ? 10 : 1,
    }}
  >
    {children}
  </button>
);

export default CategoryTab;
