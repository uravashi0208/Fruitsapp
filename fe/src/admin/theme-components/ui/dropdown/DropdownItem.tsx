import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const itemBase = `
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
  text-decoration: none;
  color: #475467;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  font-family: var(--font-outfit, 'Outfit', sans-serif);
  letter-spacing: -0.01em;

  &:hover {
    background: #f5f7ff;
    color: #465fff;
  }

  svg {
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.12s;
  }

  &:hover svg {
    opacity: 1;
  }
`;

const StyledButton = styled.button`${itemBase}`;
const StyledLink = styled(Link)`${itemBase}`;

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

  if (tag === 'a' && to) {
    return (
      <StyledLink to={to} className={className} onClick={handleClick}>
        {children}
      </StyledLink>
    );
  }

  return (
    <StyledButton onClick={handleClick} className={className}>
      {children}
    </StyledButton>
  );
};