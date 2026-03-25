import React from 'react';
import { useSidebar } from '../context/SidebarContext';

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  if (!isMobileOpen) return null;

  return (
    <div
      onClick={toggleMobileSidebar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(17, 24, 39, 0.5)',
      }}
    />
  );
};

export default Backdrop;
