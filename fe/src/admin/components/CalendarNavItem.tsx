/**
 * SIDEBAR ADDITION
 * ─────────────────────────────────────────────────────────────
 * In AdminSidebar.tsx (or AppSidebar.tsx / data/index.ts),
 * find where the nav items are defined and add a Calendar entry.
 *
 * ── If your sidebar uses a data array (common pattern) ────────
 * Add this object to your nav items array:
 *
 * {
 *   icon: 'calendar',          // or the CalendarIcon component
 *   label: 'Calendar',
 *   path: '/admin/calendar',
 * }
 *
 * ── If your sidebar renders JSX directly ──────────────────────
 * Find a NavLink entry like:
 *   <NavLink to="/admin/newsletter">Newsletter</NavLink>
 *
 * And add right after it:
 *   <NavLink to="/admin/calendar">
 *     <CalendarIcon /> Calendar
 *   </NavLink>
 *
 * ─────────────────────────────────────────────────────────────
 * Below is a ready-made sidebar nav item component you can drop in:
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar } from 'lucide-react';

// Drop-in NavLink item — styled to match your existing sidebar items
export const CalendarNavItem: React.FC = () => (
  <NavLink
    to="/admin/calendar"
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      borderRadius: 8,
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: 500,
      color: isActive ? '#4caf50' : '#64748b',
      background: isActive ? '#f0fdf4' : 'transparent',
      transition: 'all 0.15s',
    })}
  >
    <Calendar size={18} />
    Calendar
  </NavLink>
);