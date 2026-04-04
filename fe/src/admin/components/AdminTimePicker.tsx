/**
 * src/admin/components/AdminTimePicker.tsx
 *
 * Polished time picker dropdown (HH:MM) that matches the
 * Vegefoods admin theme (blues / greys from adminTheme tokens).
 *
 * Usage:
 *   <AdminTimePicker value={form.startTime} onChange={(val) => setField("startTime", val)} placeholder="Start time" />
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Clock, ChevronDown } from "lucide-react";
import { adminTheme as t } from "../styles/adminTheme";

// ── Global keyframes ──────────────────────────────────────────
const GlobalStyle = createGlobalStyle`
  @keyframes tpDropIn {
    from { opacity: 0; transform: translateY(-6px) scaleY(0.97); }
    to   { opacity: 1; transform: translateY(0)    scaleY(1);    }
  }
`;

// ── Styled components ─────────────────────────────────────────

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  font-family: ${t.fonts.body};
`;

const Trigger = styled.button<{ $open: boolean; $hasValue: boolean }>`
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 12px;
  border: 1px solid
    ${({ $open }) => ($open ? t.colors.primary : t.colors.border)};
  border-radius: ${t.radii.md};
  background: white;
  cursor: pointer;
  box-sizing: border-box;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  box-shadow: ${({ $open }) => ($open ? t.shadows.focus : "none")};
  text-align: left;

  &:hover {
    border-color: ${t.colors.primary};
  }
`;

const TriggerText = styled.span<{ $placeholder: boolean }>`
  flex: 1;
  font-size: 0.875rem;
  color: ${({ $placeholder }) =>
    $placeholder ? t.colors.textMuted : t.colors.textPrimary};
  font-weight: ${({ $placeholder }) => ($placeholder ? "400" : "500")};
  letter-spacing: 0.01em;
`;

const ChevronWrap = styled.span<{ $open: boolean }>`
  color: ${t.colors.textMuted};
  display: flex;
  align-items: center;
  transition: transform 0.2s;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
  flex-shrink: 0;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  min-width: 200px;
  background: white;
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.lg};
  box-shadow: ${t.shadows.lg};
  z-index: 1000;
  overflow: hidden;
  animation: tpDropIn 0.18s ease;
`;

const DropHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid ${t.colors.border};
  background: ${t.colors.surfaceAlt};
`;

const ColLabel = styled.div`
  padding: 8px 0 7px;
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 700;
  color: ${t.colors.textMuted};
  letter-spacing: 0.8px;
`;

const ColumnsWrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-height: 220px;
  overflow: hidden;
`;

const Col = styled.div`
  overflow-y: auto;
  max-height: 220px;
  scrollbar-width: thin;
  scrollbar-color: ${t.colors.border} transparent;

  &:first-child {
    border-right: 1px solid ${t.colors.border};
  }

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${t.colors.border};
    border-radius: 4px;
  }
`;

const Item = styled.button<{ $active: boolean }>`
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? "700" : "400")};
  color: ${({ $active }) => ($active ? "white" : t.colors.textSecondary)};
  background: ${({ $active }) => ($active ? t.colors.primary : "transparent")};
  border: none;
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
  font-family: ${t.fonts.body};
  letter-spacing: 0.01em;

  &:hover {
    background: ${({ $active }) =>
      $active ? t.colors.primaryDark : t.colors.primaryGhost};
    color: ${({ $active }) => ($active ? "white" : t.colors.primary)};
  }
`;

const ClearBtn = styled.button`
  width: 100%;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${t.colors.textMuted};
  background: ${t.colors.surfaceAlt};
  border: none;
  border-top: 1px solid ${t.colors.border};
  cursor: pointer;
  font-family: ${t.fonts.body};
  transition:
    background 0.12s,
    color 0.12s;

  &:hover {
    background: ${t.colors.border};
    color: ${t.colors.textSecondary};
  }
`;

// ── Helpers ───────────────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);

const formatDisplay = (val: string): string => {
  if (!val) return "";
  const [h, m] = val.split(":").map(Number);
  if (isNaN(h)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const mStr = String(isNaN(m) ? 0 : m).padStart(2, "0");
  return `${String(h12).padStart(2, "0")}:${mStr} ${ampm}`;
};

// ── Props ─────────────────────────────────────────────────────
interface AdminTimePickerProps {
  value: string; // "HH:MM" 24-hr format
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────
const AdminTimePicker: React.FC<AdminTimePickerProps> = ({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const selectedHour = value ? value.split(":")[0] : null;
  const selectedMin = value
    ? String(Math.round(parseInt(value.split(":")[1] || "0") / 5) * 5).padStart(
        2,
        "0",
      )
    : null;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll selected item into view when opening
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      const scrollToActive = (ref: React.RefObject<HTMLDivElement>) => {
        const active = ref.current?.querySelector(
          "[data-active='true']",
        ) as HTMLElement;
        if (active && ref.current) {
          ref.current.scrollTop = active.offsetTop - 72;
        }
      };
      scrollToActive(hourRef);
      scrollToActive(minRef);
    }, 50);
  }, [open]);

  const handleHour = useCallback(
    (h: string) => {
      const m = selectedMin ?? "00";
      onChange(`${h}:${m}`);
    },
    [selectedMin, onChange],
  );

  const handleMin = useCallback(
    (m: string) => {
      const h = selectedHour ?? "00";
      onChange(`${h}:${m}`);
    },
    [selectedHour, onChange],
  );

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <>
      <GlobalStyle />
      <Wrapper ref={wrapRef}>
        <Trigger
          type="button"
          $open={open}
          $hasValue={!!value}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
        >
          <Clock
            size={14}
            color={value ? t.colors.primary : t.colors.textMuted}
          />
          <TriggerText $placeholder={!value}>
            {value ? formatDisplay(value) : placeholder}
          </TriggerText>
          <ChevronWrap $open={open}>
            <ChevronDown size={14} />
          </ChevronWrap>
        </Trigger>

        {open && (
          <Dropdown>
            <DropHeader>
              <ColLabel>HOUR</ColLabel>
              <ColLabel>MIN</ColLabel>
            </DropHeader>

            <ColumnsWrap>
              {/* Hour column */}
              <Col ref={hourRef}>
                {HOURS.map((h) => (
                  <Item
                    key={h}
                    type="button"
                    $active={h === selectedHour}
                    data-active={h === selectedHour}
                    onClick={() => handleHour(h)}
                  >
                    {h}
                  </Item>
                ))}
              </Col>

              {/* Minute column */}
              <Col ref={minRef}>
                {MINUTES.map((m) => (
                  <Item
                    key={m}
                    type="button"
                    $active={m === selectedMin}
                    data-active={m === selectedMin}
                    onClick={() => handleMin(m)}
                  >
                    {m}
                  </Item>
                ))}
              </Col>
            </ColumnsWrap>

            {value && (
              <ClearBtn type="button" onClick={handleClear}>
                Clear
              </ClearBtn>
            )}
          </Dropdown>
        )}
      </Wrapper>
    </>
  );
};

export default AdminTimePicker;
