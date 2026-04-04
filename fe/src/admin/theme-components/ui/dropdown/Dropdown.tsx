import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const popIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const DropdownPanel = styled.div`
  position: absolute;
  z-index: 40;
  right: 0;
  margin-top: 6px;
  border-radius: 14px;
  border: 1px solid #e4e7ec;
  background: #ffffff;
  box-shadow:
    0 4px 6px -2px rgba(16, 24, 40, 0.03),
    0 12px 30px -4px rgba(16, 24, 40, 0.10),
    0 0 0 1px rgba(70, 95, 255, 0.04);
  animation: ${popIn} 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  overflow: hidden;
`;

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ isOpen, onClose, children, className = '' }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.dropdown-toggle')
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <DropdownPanel ref={dropdownRef} className={className}>
      {children}
    </DropdownPanel>
  );
};