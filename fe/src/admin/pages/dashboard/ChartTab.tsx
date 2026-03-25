import React, { useState } from 'react';

type Option = 'Monthly' | 'Quarterly' | 'Annually';

const ChartTab: React.FC = () => {
  const [selected, setSelected] = useState<Option>('Monthly');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: '#f2f4f7',
        borderRadius: 8,
        padding: 2,
      }}
    >
      {(['Monthly', 'Quarterly', 'Annually'] as Option[]).map((opt) => (
        <button
          key={opt}
          onClick={() => setSelected(opt)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.15s ease',
            background: selected === opt ? '#ffffff' : 'transparent',
            color: selected === opt ? '#101828' : '#667085',
            boxShadow: selected === opt ? '0px 1px 2px rgba(16,24,40,0.05)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

export default ChartTab;
