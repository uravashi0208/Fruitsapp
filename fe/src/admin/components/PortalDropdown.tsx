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
const OPEN_EVENT = 'vf:dropdown:open';

const broadcastOpen = (id: string) =>
  document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));

/* ── Styled ─────────────────────────────────────────────────── */
const TriggerBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: ${t.colors.textMuted}; padding: 4px; border-radius: 6px;
  display: flex; align-items: center;
  &:hover { background: ${t.colors.border}; color: ${t.colors.textPrimary}; }
`;

const Menu = styled.div<{ $top: number; $right: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  background: white;
  border: 1px solid ${t.colors.border};
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  min-width: 150px;
  z-index: 99999;
  overflow: hidden;
`;

export const MenuItem = styled.button<{ $danger?: boolean }>`
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 10px 14px;
  background: none; border: none; cursor: pointer;
  font-size: 0.8125rem; font-weight: 500;
  color: ${({ $danger }) => $danger ? t.colors.danger : t.colors.textSecondary};
  &:hover { background: ${({ $danger }) => $danger ? '#fef3f2' : t.colors.surfaceAlt}; }
`;

/* ── Component ───────────────────────────────────────────────── */
interface PortalDropdownProps { children: React.ReactNode; }

export const PortalDropdown: React.FC<PortalDropdownProps> = ({ children }) => {
  const id     = useId();                          // unique id per instance
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  /* Close when another dropdown broadcasts its open event */
  useEffect(() => {
    const onOtherOpen = (e: Event) => {
      if ((e as CustomEvent).detail !== id) setOpen(false);
    };
    document.addEventListener(OPEN_EVENT, onOtherOpen);
    return () => document.removeEventListener(OPEN_EVENT, onOtherOpen);
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
