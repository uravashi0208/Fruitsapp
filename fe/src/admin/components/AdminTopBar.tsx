import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  Bell, Search, ExternalLink, Sun, Moon,
  CheckCircle, AlertCircle, AlertTriangle, Info, X,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import { useAdminDispatch, useAdminSelector, dismissAdminToast } from '../store';

// ── Theme toggle ──────────────────────────────────────────────
const useTheme = () => {
  const [dark, setDark] = useState(() => localStorage.getItem('vf_admin_theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('admin-dark', dark);
    localStorage.setItem('vf_admin_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark(d => !d) };
};

// ── Styled ────────────────────────────────────────────────────
const TopBar = styled.header<{ $ml: string }>`
  position: fixed; top: 0; left: ${({ $ml }) => $ml}; right: 0;
  height: 72px;
  background: white;
  border-bottom: 1px solid ${t.colors.border};
  display: flex; align-items: center; gap: ${t.spacing.md};
  padding: 0 1.5rem;
  z-index: ${t.zIndex.topbar};
  transition: left 0.25s cubic-bezier(0.25,0.46,0.45,0.94);
  box-shadow: ${t.shadows.xs};
`;

const Breadcrumb = styled.div`
  display: flex; flex-direction: column; margin-right: auto;
`;

const BreadTitle = styled.h1`
  font-size: 1.0625rem; font-weight: 700;
  color: ${t.colors.textPrimary}; line-height: 1.2;
`;

const BreadSub = styled.span`
  font-size: 0.75rem; color: ${t.colors.textMuted};
`;

const SearchWrap = styled.div`
  position: relative;
  display: none;
  @media (min-width: 768px) { display: flex; align-items: center; }
  svg { position: absolute; left: 12px; color: ${t.colors.textMuted}; pointer-events: none; }
`;

const TopSearch = styled.input`
  padding: 0.5rem 0.875rem 0.5rem 2.5rem;
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.full};
  font-family: ${t.fonts.body};
  font-size: 0.8125rem;
  width: 260px;
  outline: none;
  background: ${t.colors.surfaceAlt};
  color: ${t.colors.textPrimary};
  transition: all 0.15s ease;
  box-shadow: ${t.shadows.xs};
  &::placeholder { color: ${t.colors.textMuted}; }
  &:focus { border-color: ${t.colors.primary}; background: white; box-shadow: ${t.shadows.focus}; }
`;

const ActionGroup = styled.div`display: flex; align-items: center; gap: 8px;`;

const RoundBtn = styled.button`
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 1px solid ${t.colors.border};
  background: white;
  color: ${t.colors.textSecondary};
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
  box-shadow: ${t.shadows.xs};
  &:hover { border-color: ${t.colors.primary}; color: ${t.colors.primary}; background: rgba(70,95,255,0.04); }
`;

const NotifDot = styled.span`
  position: absolute; top: -2px; right: -2px;
  width: 10px; height: 10px;
  background: #fb6514;
  border-radius: 50%;
  border: 2px solid white;
  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: rgba(251,101,20,0.4);
    animation: adminPing 1.2s ease-in-out infinite;
  }
`;

const ViewSiteBtn = styled(Link)`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.45rem 0.875rem;
  border-radius: ${t.radii.lg};
  border: 1px solid ${t.colors.border};
  background: white;
  color: ${t.colors.textSecondary};
  font-size: 0.8rem; font-weight: 500;
  text-decoration: none;
  box-shadow: ${t.shadows.xs};
  transition: all 0.15s ease;
  &:hover { border-color: ${t.colors.primary}; color: ${t.colors.primary}; background: rgba(70,95,255,0.04); }
`;

const TopAvatar = styled.div<{ $name: string }>`
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg,${t.colors.primary},${t.colors.primaryDark});
  color: white; font-size: 0.75rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  border: 2px solid rgba(70,95,255,0.2);
  box-shadow: ${t.shadows.xs};
`;

interface TopBarProps { title: string; subtitle?: string; }

export const AdminTopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  const collapsed = useAdminSelector(s => s.adminUI.sidebarCollapsed);
  const user      = useAdminSelector(s => s.adminAuth.user);
  const ml        = collapsed ? t.sidebar.collapsedWidth : t.sidebar.width;
  const { dark, toggle } = useTheme();

  return (
    <TopBar $ml={ml}>
      <Breadcrumb>
        <BreadTitle>{title}</BreadTitle>
        {subtitle && <BreadSub>{subtitle}</BreadSub>}
      </Breadcrumb>

      <SearchWrap>
        <Search size={15} />
        <TopSearch placeholder="Search anything…" />
      </SearchWrap>

      <ActionGroup>
        <RoundBtn title="Toggle theme" onClick={toggle}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </RoundBtn>

        <RoundBtn title="Notifications">
          <Bell size={16} />
          <NotifDot />
        </RoundBtn>

        <ViewSiteBtn to="/" target="_blank">
          <ExternalLink size={13} /> View Site
        </ViewSiteBtn>

        <TopAvatar $name={user?.name ?? 'A'} title={user?.name}>
          {user?.name?.split(' ').map(n => n[0]).join('').slice(0,2) ?? 'AD'}
        </TopAvatar>
      </ActionGroup>
    </TopBar>
  );
};

// ── Toast Manager ─────────────────────────────────────────────
const slideIn = keyframes`
  from { opacity:0; transform:translateX(20px); }
  to   { opacity:1; transform:translateX(0); }
`;

const ToastStack = styled.div`
  position: fixed; bottom: 1.5rem; right: 1.5rem;
  z-index: ${t.zIndex.toast};
  display: flex; flex-direction: column; gap: 8px;
  pointer-events: none;
`;

const ToastItem = styled.div<{ $type: string }>`
  display: flex; align-items: flex-start; gap: 10px;
  padding: 0.875rem 1rem;
  background: white;
  border-radius: ${t.radii.xl};
  box-shadow: ${t.shadows.lg};
  border: 1px solid ${t.colors.border};
  border-left: 4px solid ${({ $type }) =>
    $type === 'success' ? t.colors.success :
    $type === 'error'   ? t.colors.danger  :
    $type === 'warning' ? t.colors.warning :
                          t.colors.info};
  min-width: 280px; max-width: 380px;
  pointer-events: all;
  animation: ${slideIn} 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
`;

const ToastIcon = styled.span<{ $type: string }>`
  color: ${({ $type }) =>
    $type === 'success' ? t.colors.success :
    $type === 'error'   ? t.colors.danger  :
    $type === 'warning' ? t.colors.warning :
                          t.colors.info};
  flex-shrink: 0; margin-top: 1px;
`;

const ToastMsg = styled.div`
  flex: 1; font-size: 0.875rem; font-weight: 500;
  color: ${t.colors.textPrimary}; line-height: 1.4;
`;

const ToastClose = styled.button`
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none; background: none;
  color: ${t.colors.textMuted}; cursor: pointer; border-radius: 4px; flex-shrink: 0; padding: 0;
  &:hover { background: ${t.colors.border}; color: ${t.colors.textPrimary}; }
`;

const iconMap: Record<string, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error:   <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info size={16} />,
};

export const AdminToastManager: React.FC = () => {
  const dispatch = useAdminDispatch();
  const toasts   = useAdminSelector(s => s.adminUI.toasts);

  useEffect(() => {
    if (!toasts.length) return;
    const latest = toasts[toasts.length - 1];
    const timer  = setTimeout(() => dispatch(dismissAdminToast(latest.id)), 4000);
    return () => clearTimeout(timer);
  }, [toasts, dispatch]);

  return (
    <ToastStack>
      {toasts.map(toast => (
        <ToastItem key={toast.id} $type={toast.type}>
          <ToastIcon $type={toast.type}>{iconMap[toast.type]}</ToastIcon>
          <ToastMsg>{toast.message}</ToastMsg>
          <ToastClose onClick={() => dispatch(dismissAdminToast(toast.id))}><X size={12} /></ToastClose>
        </ToastItem>
      ))}
    </ToastStack>
  );
};
