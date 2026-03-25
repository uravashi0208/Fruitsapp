import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import AppSidebar from '../theme-layout/AppSidebar';
import AppHeader from '../theme-layout/AppHeader';
import Backdrop from '../theme-layout/Backdrop';
import '../styles/tailadmin.css';

// Toast manager — kept from existing system
import { AdminToastManager } from './AdminTopBar';

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered } = useSidebar();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const sidebarWidth = isExpanded || isHovered ? '290px' : '90px';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: isDark ? '#161b27' : 'var(--color-gray-50)', transition: 'background 0.2s ease' }}>
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        style={{
          flex: 1,
          transition: 'margin-left 0.3s ease, background 0.2s ease',
          marginLeft: window.innerWidth >= 1024 ? sidebarWidth : 0,
          minHeight: '100vh',
          background: isDark ? '#161b27' : 'var(--color-gray-50)',
        }}
      >
        <AppHeader />
        <div
          style={{
            paddingTop: 'calc(72px + 24px)',
            paddingLeft: 24,
            paddingRight: 24,
            paddingBottom: 24,
            maxWidth: 1600,
            margin: '0 auto',
            animation: 'adminFadeIn 0.25s ease',
          }}
        >
          <Outlet />
        </div>
      </div>
      <AdminToastManager />
    </div>
  );
};

const AdminRootWrapper: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div className={`admin-root${theme === 'dark' ? ' dark-admin' : ''}`}
         style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}>
      <LayoutContent />
    </div>
  );
};

export const AdminLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AdminRootWrapper />
      </SidebarProvider>
    </ThemeProvider>
  );
};
