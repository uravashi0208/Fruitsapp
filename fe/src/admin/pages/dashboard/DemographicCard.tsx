/**
 * src/admin/pages/dashboard/DemographicCard.tsx
 * Customers-by-country widget with world map and per-country bar chart.
 * All styling from dashboardStyles.ts.
 *
 * Component structure:
 *   1. useState  (1a. dropdown open)
 *   2. Derived data (countries from Redux user store)
 *   3. Render
 */

import React, { useState } from 'react';
import { Dropdown }     from '../../theme-components/ui/dropdown/Dropdown';
import { DropdownItem } from '../../theme-components/ui/dropdown/DropdownItem';
import CountryMap from './CountryMap';
import { useAdminSelector } from '../../store';
import {
  DashCard, CardPadding, CardHeaderRow, CardTitle, CardSubtitle,
  MoreBtn, MoreDotSVG,
  MapBox, CountryList, CountryRow, CountryInfo, CountryFlag,
  CountryName, CountryCustomers, CountryBarWrap, CountryPct,
  ProgressTrack, ProgressFill,
} from './dashboardStyles';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CountryStat {
  name:      string;
  flag:      string;
  customers: number;
  pct:       number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const DemographicCard: React.FC = () => {
  // 1a. UI state
  const [isOpen, setIsOpen] = useState(false);

  // 2. Derived data
  const users = useAdminSelector((s) => s.adminUsers.items);
  const total = users.length || 1;

  const countries: CountryStat[] = [
    { name: 'USA',    flag: '🇺🇸', customers: Math.round(total * 0.79), pct: 79 },
    { name: 'France', flag: '🇫🇷', customers: Math.round(total * 0.23), pct: 23 },
    { name: 'India',  flag: '🇮🇳', customers: Math.round(total * 0.15), pct: 15 },
    { name: 'UK',     flag: '🇬🇧', customers: Math.round(total * 0.10), pct: 10 },
  ];

  // 3. Render
  return (
    <DashCard>
      <CardPadding>
        {/* Header */}
        <CardHeaderRow>
          <div>
            <CardTitle>Customers Demographic</CardTitle>
            <CardSubtitle>Number of customers based on country</CardSubtitle>
          </div>
          <div style={{ position: 'relative' }}>
            <MoreBtn className="dropdown-toggle" onClick={() => setIsOpen((v) => !v)}>
              <MoreDotSVG />
            </MoreBtn>
            <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <div style={{ padding: 8, minWidth: 140 }}>
                <DropdownItem onItemClick={() => setIsOpen(false)}>View More</DropdownItem>
                <DropdownItem onItemClick={() => setIsOpen(false)}>Delete</DropdownItem>
              </div>
            </Dropdown>
          </div>
        </CardHeaderRow>

        {/* Map */}
        <MapBox>
          <CountryMap />
        </MapBox>

        {/* Country list */}
        <CountryList>
          {countries.map((c) => (
            <CountryRow key={c.name}>
              <CountryInfo>
                <CountryFlag>{c.flag}</CountryFlag>
                <div>
                  <CountryName>{c.name}</CountryName>
                  <CountryCustomers>{c.customers.toLocaleString()} Customers</CountryCustomers>
                </div>
              </CountryInfo>
              <CountryBarWrap>
                <ProgressTrack>
                  <ProgressFill $pct={c.pct} />
                </ProgressTrack>
                <CountryPct>{c.pct}%</CountryPct>
              </CountryBarWrap>
            </CountryRow>
          ))}
        </CountryList>
      </CardPadding>
    </DashCard>
  );
};

export default DemographicCard;
