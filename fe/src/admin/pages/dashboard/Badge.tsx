import React from 'react';

type BadgeColor = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  color?: BadgeColor;
  size?: BadgeSize;
  children: React.ReactNode;
}

const colorMap: Record<BadgeColor, { bg: string; text: string }> = {
  primary: { bg: '#ecf3ff', text: '#465fff' },
  success: { bg: '#ecfdf3', text: '#039855' },
  error:   { bg: '#fef3f2', text: '#d92d20' },
  warning: { bg: '#fffaeb', text: '#dc6803' },
  info:    { bg: '#f0f9ff', text: '#0ba5ec' },
  light:   { bg: '#f2f4f7', text: '#344054' },
  dark:    { bg: '#667085', text: '#ffffff' },
};

const Badge: React.FC<BadgeProps> = ({ color = 'primary', size = 'md', children }) => {
  const { bg, text } = colorMap[color];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        borderRadius: 9999,
        fontSize: size === 'sm' ? 12 : 13,
        fontWeight: 500,
        background: bg,
        color: text,
        fontFamily: 'Outfit, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
