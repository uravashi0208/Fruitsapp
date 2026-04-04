/**
 * PortalDropdown.tsx
 * Renders a dropdown menu using a React Portal so it escapes
 * overflow:hidden parent containers (like TableWrap).
 *
 * Uses a global custom event so only ONE dropdown is open at a time.
 */
import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { adminTheme as t } from '../styles/adminTheme';
import { MoreHorizontal } from 'lucide-react';

/* ── Global singleton event ──────────────────────────────────
   When any dropdown opens, it fires 'dropdown:open' with its id.
   All other dropdowns listen and close themselves.              */
const OPEN_EVENT  = 'vf:dropdown:open';
const CLOSE_EVENT = 'vf:dropdown:closeall';

const broadcastOpen = (id: string) =>
  document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));

/** Call this whenever a modal opens so every open dropdown closes. */
export const closeAllDropdowns = () =>
  document.dispatchEvent(new CustomEvent(CLOSE_EVENT));

/* ── Styled ─────────────────────────────────────────────────── */
const TriggerBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: ${t.colors.textMuted}; padding: 6px; border-radius: 8px;
  display: flex; align-items: center;
  transition: background 0.12s ease, color 0.12s ease;
  &:hover { background: #f0f2f5; color: ${t.colors.textPrimary}; }
  &:active { background: #e8eaee; }
`;

const Menu = styled.div<{ $top: number; $right: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  background: white;
  border: 1.5px solid #e4e7ec;
  border-radius: 14px;
  box-shadow:
    0 4px 6px -2px rgba(16, 24, 40, 0.03),
    0 12px 30px -4px rgba(16, 24, 40, 0.10),
    0 0 0 1px rgba(70, 95, 255, 0.04);
  min-width: 155px;
  z-index: 99999;
  overflow: hidden;
  animation: portalFadeIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both;

  @keyframes portalFadeIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
`;

export const MenuItem = styled.button<{ $danger?: boolean }>`
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 10px 14px;
  background: none; border: none; cursor: pointer;
  font-size: 0.8125rem; font-weight: 500;
  letter-spacing: -0.01em;
  color: ${({ $danger }) => $danger ? t.colors.danger : t.colors.textSecondary};
  transition: background 0.12s ease, color 0.12s ease, padding-left 0.12s ease;
  &:hover {
    background: ${({ $danger }) => $danger ? '#fef3f2' : '#f5f7ff'};
    color: ${({ $danger }) => $danger ? t.colors.danger : '#465fff'};
    padding-left: 18px;
  }
`;

/* ── Component ───────────────────────────────────────────────── */
interface PortalDropdownProps { children: React.ReactNode; }

export const PortalDropdown: React.FC<PortalDropdownProps> = ({ children }) => {
  const id     = useId();                          // unique id per instance
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  /* Close when another dropdown broadcasts its open event OR a global close-all fires */
  useEffect(() => {
    const onOtherOpen = (e: Event) => {
      if ((e as CustomEvent).detail !== id) setOpen(false);
    };
    const onCloseAll = () => setOpen(false);
    document.addEventListener(OPEN_EVENT, onOtherOpen);
    document.addEventListener(CLOSE_EVENT, onCloseAll);
    return () => {
      document.removeEventListener(OPEN_EVENT, onOtherOpen);
      document.removeEventListener(CLOSE_EVENT, onCloseAll);
    };
  }, [id]);

  /* Close on outside click or scroll */
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top:   rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    const next = !open;
    setOpen(next);
    if (next) broadcastOpen(id);   // tell all others to close
  }, [open, id]);

  return (
    <>
      <TriggerBtn ref={btnRef} onClick={handleOpen}>
        <MoreHorizontal size={16} />
      </TriggerBtn>

      {open && ReactDOM.createPortal(
        <Menu $top={pos.top} $right={pos.right} onClick={e => e.stopPropagation()}>
          {children}
        </Menu>,
        document.body
      )}
    </>
  );
};