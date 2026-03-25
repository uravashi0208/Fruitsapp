import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { dismissToast } from '../../store/uiSlice';
import { theme } from '../../styles/theme';

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(110%); }
  to   { opacity: 1; transform: translateX(0); }
`;

const ToastContainer = styled.aside`
  position: fixed;
  bottom: ${theme.spacing.xl};
  right: ${theme.spacing.xl};
  z-index: ${theme.zIndex.toast};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  pointer-events: none;

  @media (max-width: ${theme.breakpoints.sm}) {
    bottom: ${theme.spacing.md};
    right: ${theme.spacing.md};
    left: ${theme.spacing.md};
  }
`;

const ToastItem = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: 14px 16px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.15);
  border-left: 4px solid ${({ $type }) =>
    $type === 'success' ? theme.colors.primary :
    $type === 'error'   ? theme.colors.danger  :
                          theme.colors.primary};
  animation: ${slideIn} 0.35s ease both;
  pointer-events: all;
  min-width: 260px;
  max-width: 360px;

  @media (max-width: ${theme.breakpoints.sm}) {
    min-width: unset;
    max-width: unset;
    width: 100%;
  }
`;

const ToastIcon = styled.span<{ $type: 'success' | 'error' | 'info' }>`
  color: ${({ $type }) =>
    $type === 'success' ? theme.colors.primary :
    $type === 'error'   ? theme.colors.danger  :
                          theme.colors.primary};
  flex-shrink: 0;
`;

const ToastMsg = styled.p`
  font-size: 14px;
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textDark};
  flex: 1;
  margin: 0;
  font-family: ${theme.fonts.body};
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px; height: 22px;
  border: none;
  background: none;
  color: ${theme.colors.text};
  cursor: pointer;
  border-radius: 50%;
  flex-shrink: 0;
  padding: 0;
  transition: ${theme.transitions.base};
  &:hover { background: #f0f0f0; color: ${theme.colors.textDark}; }
`;

const iconMap = {
  success: <CheckCircle size={17} />,
  error:   <XCircle size={17} />,
  info:    <Info size={17} />,
};

export const ToastManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((s) => s.ui.toasts);

  useEffect(() => {
    if (!toasts.length) return;
    const id = toasts[toasts.length - 1].id;
    const timer = setTimeout(() => dispatch(dismissToast(id)), 3000);
    return () => clearTimeout(timer);
  }, [toasts, dispatch]);

  return (
    <ToastContainer role="status" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} $type={t.type}>
          <ToastIcon $type={t.type}>{iconMap[t.type]}</ToastIcon>
          <ToastMsg>{t.message}</ToastMsg>
          <CloseBtn onClick={() => dispatch(dismissToast(t.id))} aria-label="Dismiss notification">
            <X size={13} />
          </CloseBtn>
        </ToastItem>
      ))}
    </ToastContainer>
  );
};
