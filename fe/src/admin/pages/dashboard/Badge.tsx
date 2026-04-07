/**
 * src/admin/pages/dashboard/Badge.tsx
 * Thin re-export wrapper so existing callers keep their import path.
 * All styling lives in dashboardStyles.ts → DashBadge / BADGE_COLORS.
 *
 * Component structure:
 *   1. Props interface
 *   2. Component (delegates to DashBadge)
 */

import React from 'react';
import { DashBadge, type BadgeColor } from './dashboardStyles';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface BadgeProps {
  color?:   BadgeColor;
  size?:    'sm' | 'md';
  children: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const Badge: React.FC<BadgeProps> = ({ color = 'primary', size = 'md', children }) => (
  <DashBadge $color={color} $sm={size === 'sm'}>
    {children}
  </DashBadge>
);

export default Badge;
