/**
 * adminPageComponents.ts
 *
 * Shared styled-components used across ALL admin list pages.
 * These were previously copy-pasted in every page — now centralised here.
 *
 * Usage:
 *   import {
 *     PageSearchBar, PageSearchInp,
 *     BulkBar, BulkCount, BulkActionBtn,
 *     SortBadge,
 *     UploadBox, UploadInput, PreviewImg,
 *     ModalCloseBtn, ErrorBanner,
 *   } from '../styles/adminPageComponents';
 */

import styled, { css } from "styled-components";
import { adminTheme as t } from "./adminTheme";

// ─────────────────────────────────────────────────────────────────────────────
// 1.  Search bar  (inline flex variant used in DataTable searchArea prop)
// ─────────────────────────────────────────────────────────────────────────────
export const PageSearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${t.colors.border};
  border-radius: 10px;
  padding: 0 12px;
  background: white;
  height: 40px;
  min-width: 200px;
`;

export const PageSearchInp = styled.input`
  border: none;
  outline: none;
  font-size: 0.875rem;
  background: transparent;
  flex: 1;
  color: ${t.colors.textPrimary};
  &::placeholder {
    color: ${t.colors.textMuted};
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// 2.  Bulk-action bar + helpers
// ─────────────────────────────────────────────────────────────────────────────
export const BulkBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 4px 6px 4px 12px;
  border-radius: 10px;
  background: ${t.colors.primaryGhost};
  border: 1.5px solid ${t.colors.primary};
  box-shadow: 0 2px 8px ${t.colors.primaryGhost};
  animation: bulkSlideIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  @keyframes bulkSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-3px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

export const BulkCount = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${t.colors.primary};
  padding-right: 10px;
  border-right: 1.5px solid ${t.colors.border};
  white-space: nowrap;
  span {
    font-size: 0.9rem;
    font-weight: 800;
  }
`;

export const BulkActionBtn = styled.button<{
  $variant?: "success" | "warning" | "danger" | "ghost";
}>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  border-radius: 7px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  white-space: nowrap;
  font-family: ${t.fonts.body};

  ${({ $variant }) =>
    $variant === "success" &&
    css`
      background: ${t.colors.successBg};
      color: ${t.colors.success};
      border-color: ${t.colors.success};
      &:hover {
        filter: brightness(0.93);
      }
    `}
  ${({ $variant }) =>
    $variant === "warning" &&
    css`
      background: ${t.colors.warningBg};
      color: ${t.colors.warning};
      border-color: ${t.colors.warning};
      &:hover {
        filter: brightness(0.93);
      }
    `}
  ${({ $variant }) =>
    $variant === "danger" &&
    css`
      background: ${t.colors.dangerBg};
      color: ${t.colors.danger};
      border-color: ${t.colors.danger};
      &:hover {
        filter: brightness(0.93);
      }
    `}
  ${({ $variant }) =>
    (!$variant || $variant === "ghost") &&
    css`
      background: ${t.colors.surface};
      color: ${t.colors.textSecondary};
      border-color: ${t.colors.border};
      &:hover {
        background: ${t.colors.surfaceAlt};
        color: ${t.colors.textPrimary};
      }
    `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// 3.  Sort-order badge  (small square numeric badge shown in table rows)
// ─────────────────────────────────────────────────────────────────────────────
export const SortBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${t.colors.surfaceAlt};
  border: 1px solid ${t.colors.border};
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.colors.textSecondary};
`;

// ─────────────────────────────────────────────────────────────────────────────
// 4.  Image upload  (dashed upload box + hidden file input + preview image)
// ─────────────────────────────────────────────────────────────────────────────
export const UploadBox = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed ${t.colors.border};
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  gap: 8px;
  text-align: center;
  transition:
    border-color 0.15s,
    background 0.15s;
  &:hover {
    border-color: ${t.colors.primary};
    background: ${t.colors.primaryGhost};
  }
`;

export const UploadInput = styled.input`
  display: none;
`;

export const PreviewImg = styled.img`
  width: 100%;
  max-height: 180px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid ${t.colors.border};
`;

export const PreviewImgSquare = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid ${t.colors.border};
`;

// ─────────────────────────────────────────────────────────────────────────────
// 5.  Modal close button  (unified × button used in every modal header)
// ─────────────────────────────────────────────────────────────────────────────
export const ModalCloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${t.colors.textMuted};
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 2px 6px;
  transition:
    color 0.15s,
    background 0.15s;
  &:hover {
    color: ${t.colors.textPrimary};
    background: ${t.colors.surfaceAlt};
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// 6.  Error banner  (top-of-page API error display)
// ─────────────────────────────────────────────────────────────────────────────
export const ErrorBanner = styled.div`
  color: ${t.colors.danger};
  padding: 1rem 1.25rem;
  background: #fff5f5;
  border-radius: 8px;
  border: 1px solid ${t.colors.dangerBg};
  margin-bottom: 16px;
  font-size: 0.875rem;
`;

// ─────────────────────────────────────────────────────────────────────────────
// 7.  Modal title helpers
// ─────────────────────────────────────────────────────────────────────────────
export const ModalTitle = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: ${t.colors.textPrimary};
`;

export const ModalTitleDanger = styled(ModalTitle)`
  color: ${t.colors.danger};
`;

// ─────────────────────────────────────────────────────────────────────────────
// 8.  Confirm-modal body text  (shared across all delete / bulk-confirm modals)
// ─────────────────────────────────────────────────────────────────────────────
export const ConfirmText = styled.p`
  color: ${t.colors.textSecondary};
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
`;
