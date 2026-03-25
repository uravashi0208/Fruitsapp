import React, { useState } from 'react';
import { Dropdown } from '../../theme-components/ui/dropdown/Dropdown';
import { DropdownItem } from '../../theme-components/ui/dropdown/DropdownItem';
import CountryMap from './CountryMap';
import { useAdminSelector } from '../../store';

const MoreDotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M5 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface CountryStat {
  name: string;
  flag: string;
  customers: number;
  pct: number;
}

const DemographicCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const users = useAdminSelector((s) => s.adminUsers.items);
  const total = users.length || 1;

  // Derive country stats from user data or use defaults
  const countries: CountryStat[] = [
    { name: 'USA',    flag: '🇺🇸', customers: Math.round(total * 0.79), pct: 79 },
    { name: 'France', flag: '🇫🇷', customers: Math.round(total * 0.23), pct: 23 },
    { name: 'India',  flag: '🇮🇳', customers: Math.round(total * 0.15), pct: 15 },
    { name: 'UK',     flag: '🇬🇧', customers: Math.round(total * 0.10), pct: 10 },
  ];

  return (
    <div style={{ borderRadius: 16, border: '1px solid #e4e7ec', background: '#ffffff', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#101828', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Customers Demographic
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#667085', fontFamily: 'Outfit, sans-serif' }}>
            Number of customers based on country
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <MoreDotIcon />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <div style={{ padding: 8, minWidth: 140 }}>
              <DropdownItem onItemClick={() => setIsOpen(false)}>View More</DropdownItem>
              <DropdownItem onItemClick={() => setIsOpen(false)}>Delete</DropdownItem>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Map */}
      <div style={{
        border: '1px solid #e4e7ec', borderRadius: 16, overflow: 'hidden',
        padding: '24px 16px', marginBottom: 24,
        height: 220,
      }}>
        <CountryMap />
      </div>

      {/* Country list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {countries.map((c) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24, lineHeight: 1 }}>{c.flag}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#101828', fontFamily: 'Outfit, sans-serif' }}>
                  {c.name}
                </p>
                <span style={{ fontSize: 12, color: '#667085', fontFamily: 'Outfit, sans-serif' }}>
                  {c.customers.toLocaleString()} Customers
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 130 }}>
              <div style={{ position: 'relative', height: 8, width: 100, borderRadius: 4, background: '#e4e7ec' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${c.pct}%`, borderRadius: 4,
                  background: '#465fff',
                }} />
              </div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: 13, color: '#101828', fontFamily: 'Outfit, sans-serif', minWidth: 30 }}>
                {c.pct}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemographicCard;
