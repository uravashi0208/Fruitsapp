/**
 * AdminDropdown.tsx
 * Custom styleable dropdown — replaces native <select> when you need
 * full CSS control over the open list (colors, hover, selected state, etc.)
 *
 * Usage:
 *   <AdminDropdown
 *     value={statusFilter}
 *     onChange={val => { setStatusFilter(val); setPage(1); }}
 *     options={[
 *       { value: '', label: 'All Status' },
 *       { value: 'active', label: 'Active' },
 *       { value: 'inactive', label: 'Inactive' },
 *     ]}
 *     style={{ minWidth: 140 }}
 *   />
 */
import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { ChevronDown } from "lucide-react";
import { adminTheme as t } from "../styles/adminTheme";

// ── Singleton: only one dropdown open at a time ────────────────
const OPEN_EVENT = "vf:admindropdown:open";
const broadcastOpen = (id: string) =>
  document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));

// ── Types ──────────────────────────────────────────────────────
export interface DropdownOption {
  value: string;
  label: string;
  /** Optional: render a colored dot before the label */
  color?: string;
}

export interface AdminDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  /** Height of the trigger button (default 40) */
  height?: number;
}

// ── Trigger button ─────────────────────────────────────────────
const Trigger = styled.button<{
  $open: boolean;
  $disabled?: boolean;
  $height: number;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: ${({ $height }) => $height}px;
  padding: 0 12px 0 14px;
  background: #ffffff;
  border: 1.5px solid ${t.colors.border};
  border-radius: 10px;
  font-family: ${t.fonts.body};
  font-size: 0.875rem;
  font-weight: 500;
  color: ${t.colors.textPrimary};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  outline: none;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  user-select: none;
  white-space: nowrap;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  &:hover:not(:disabled) {
    border-color: #c8cdd6;
    background: #fafafa;
  }

  html.dark & {
    background: #1e293b;
    border-color: #334155;
    color: #f0f4fa;
  }
`;

const TriggerLabel = styled.span`
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChevronIcon = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: ${t.colors.textMuted};
  transition: transform 0.18s ease;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
`;

const ColorDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
  display: inline-block;
`;

// ── Dropdown menu (portal) ─────────────────────────────────────
const Menu = styled.div<{ $top: number; $left: number; $width: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  width: ${({ $width }) => $width}px;
  background: #ffffff;
  border: 1.5px solid #e4e7ec;
  border-radius: 14px;
  box-shadow:
    0 4px 6px -2px rgba(16, 24, 40, 0.04),
    0 12px 30px -4px rgba(16, 24, 40, 0.12),
    0 0 0 1px rgba(70, 95, 255, 0.04);
  z-index: 99999;
  overflow: hidden;
  padding: 6px;
  animation: dropdownFadeIn 0.16s cubic-bezier(0.34, 1.56, 0.64, 1) both;

  @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  html.dark & {
    background: #1e2d3d;
    border-color: #2a3347;
  }
`;

const OptionItem = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: ${({ $selected }) => ($selected ? "#f2f4f7" : "transparent")};
  font-family: ${t.fonts.body};
  font-size: 0.875rem;
  font-weight: 500;
  color: ${t.colors.textPrimary};
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease;
  letter-spacing: -0.01em;

  &:hover {
    background: #f2f4f7;
  }

  html.dark & {
    color: #e2e8f0;
    background: ${({ $selected }) => ($selected ? "#252e42" : "transparent")};
    &:hover {
      background: #252e42;
    }
  }
`;

// ── Component ──────────────────────────────────────────────────
export const AdminDropdown: React.FC<AdminDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select…",
  style,
  className,
  disabled,
  height = 40,
}) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  // Close when another dropdown opens
  useEffect(() => {
    const onOtherOpen = (e: Event) => {
      if ((e as CustomEvent).detail !== id) setOpen(false);
    };
    document.addEventListener(OPEN_EVENT, onOtherOpen);
    return () => document.removeEventListener(OPEN_EVENT, onOtherOpen);
  }, [id]);

  // Close on outside click — but NOT if click is inside the portal menu
  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      const target = e.target as Node;
      // ignore clicks on the trigger itself (handled by openMenu toggle)
      if (triggerRef.current?.contains(target)) return;
      // ignore clicks inside the portal menu (let handleSelect fire first)
      if ((target as Element).closest?.("[data-admindropdown-menu]")) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onMouse, true);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onMouse, true);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  // Position the portal menu under the trigger
  const openMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || !triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 160),
      });
      const next = !open;
      setOpen(next);
      if (next) broadcastOpen(id);
    },
    [disabled, open, id],
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      <Trigger
        ref={triggerRef}
        type="button"
        $open={open}
        $disabled={disabled}
        $height={height}
        style={style}
        className={className}
        onClick={openMenu}
        disabled={disabled}
      >
        <TriggerLabel>
          {selectedOption?.color && (
            <ColorDot
              $color={selectedOption.color}
              style={{ marginRight: 6 }}
            />
          )}
          {displayLabel}
        </TriggerLabel>
        <ChevronIcon $open={open}>
          <ChevronDown size={15} strokeWidth={2.5} />
        </ChevronIcon>
      </Trigger>

      {open &&
        ReactDOM.createPortal(
          <Menu
            $top={pos.top}
            $left={pos.left}
            $width={pos.width}
            data-admindropdown-menu
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((opt) => (
              <OptionItem
                key={opt.value}
                type="button"
                $selected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.color && <ColorDot $color={opt.color} />}
                {opt.label}
              </OptionItem>
            ))}
          </Menu>,
          document.body,
        )}
    </>
  );
};

// ══════════════════════════════════════════════════════════════
// StatusDropdown — colored pill/badge style dropdown
// Replaces OrderStatusSelect and similar styled <select> elements
//
// Usage:
//   <StatusDropdown
//     value={o.status}
//     onChange={val => handleUpdateOrderStatus(o.id, val as Order['status'])}
//     variant={orderStatusV(o.status)}
//     options={['pending','processing','shipped','delivered','cancelled']}
//   />
// ══════════════════════════════════════════════════════════════

const VARIANT_STYLES: Record<string, { bg: string; color: string }> = {
  success: { bg: "#ecfdf3", color: "#027a48" },
  info: { bg: "#eff8ff", color: "#175cd3" },
  warning: { bg: "#fffaeb", color: "#b54708" },
  neutral: { bg: "#f2f4f7", color: "#344054" },
  danger: { bg: "#fef3f2", color: "#b42318" },
};

const StatusTrigger = styled.button<{ $variant: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px 4px 10px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
  transition: filter 0.15s ease;
  background-color: ${({ $variant }) =>
    (VARIANT_STYLES[$variant] ?? VARIANT_STYLES.neutral).bg};
  color: ${({ $variant }) =>
    (VARIANT_STYLES[$variant] ?? VARIANT_STYLES.neutral).color};
  &:hover {
    filter: brightness(0.94);
  }
`;

const StatusChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  transition: transform 0.15s ease;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
  opacity: 0.7;
`;

const StatusOptionItem = styled.button<{
  $selected: boolean;
  $variant: string;
}>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  transition: background 0.12s ease;
  background: ${({ $selected, $variant }) =>
    $selected
      ? (VARIANT_STYLES[$variant] ?? VARIANT_STYLES.neutral).bg
      : "transparent"};
  color: ${({ $variant }) =>
    (VARIANT_STYLES[$variant] ?? VARIANT_STYLES.neutral).color};
  &:hover {
    background: ${({ $variant }) =>
      (VARIANT_STYLES[$variant] ?? VARIANT_STYLES.neutral).bg};
  }
`;

export interface StatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  /** Maps each option value to a variant color */
  variantMap: Record<string, string>;
  options: string[];
  title?: string;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  onChange,
  variantMap,
  options,
  title,
}) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const currentVariant = variantMap[value] ?? "neutral";

  // Close when another dropdown opens
  useEffect(() => {
    const onOtherOpen = (e: Event) => {
      if ((e as CustomEvent).detail !== id) setOpen(false);
    };
    document.addEventListener(OPEN_EVENT, onOtherOpen);
    return () => document.removeEventListener(OPEN_EVENT, onOtherOpen);
  }, [id]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-admindropdown-menu]")) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onMouse, true);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onMouse, true);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const openMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 140),
      });
      const next = !open;
      setOpen(next);
      if (next) broadcastOpen(id);
    },
    [open, id],
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      <StatusTrigger
        ref={triggerRef}
        type="button"
        $variant={currentVariant}
        title={title}
        onClick={openMenu}
      >
        {value}
        <StatusChevron $open={open}>
          <ChevronDown size={10} strokeWidth={2.5} />
        </StatusChevron>
      </StatusTrigger>

      {open &&
        ReactDOM.createPortal(
          <Menu
            $top={pos.top}
            $left={pos.left}
            $width={pos.width}
            data-admindropdown-menu
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((opt) => (
              <StatusOptionItem
                key={opt}
                type="button"
                $selected={opt === value}
                $variant={variantMap[opt] ?? "neutral"}
                onClick={() => handleSelect(opt)}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </StatusOptionItem>
            ))}
          </Menu>,
          document.body,
        )}
    </>
  );
};

export default AdminDropdown;
