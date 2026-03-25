import React from 'react';
import { Link } from 'react-router-dom';

interface DropdownItemProps {
  tag?: 'a' | 'button';
  to?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  baseClassName?: string;
  className?: string;
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = 'button',
  to,
  onClick,
  onItemClick,
  className = '',
  children,
}) => {
  const handleClick = (event: React.MouseEvent) => {
    if (tag === 'button') event.preventDefault();
    if (onClick) onClick();
    if (onItemClick) onItemClick();
  };

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    textDecoration: 'none',
    color: 'var(--color-gray-700)',
    width: '100%',
    border: 'none',
    background: 'transparent',
    textAlign: 'left' as const,
    fontFamily: 'var(--font-outfit)',
  };

  if (tag === 'a' && to) {
    return (
      <Link to={to} style={baseStyle} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} style={baseStyle} className={className}>
      {children}
    </button>
  );
};
