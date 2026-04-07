/**
 * src/admin/pages/dashboard/CountryMap.tsx
 * World vector map rendered via @react-jvectormap.
 * Pure presentational — no state, no API calls.
 *
 * Component structure:
 *   1. Props interface
 *   2. Constants  (markerData, regionStyle)
 *   3. Render
 */

import React from 'react';
// @ts-ignore
import { VectorMap } from '@react-jvectormap/core';
// @ts-ignore
import { worldMill } from '@react-jvectormap/world';
import { adminTheme as t } from '../../styles/adminTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CountryMapProps {
  mapColor?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MARKERS = [
  { latLng: [37.258, -104.657], name: 'United States', style: { fill: t.colors.primary, borderWidth: 1, borderColor: 'white' } },
  { latLng: [20.75,   73.727],  name: 'India',          style: { fill: t.colors.primary, borderWidth: 1, borderColor: 'white' } },
  { latLng: [53.613,  -11.636], name: 'United Kingdom', style: { fill: t.colors.primary, borderWidth: 1, borderColor: 'white' } },
  { latLng: [-25.03,  115.209], name: 'Australia',      style: { fill: t.colors.primary, borderWidth: 1, borderColor: 'white' } },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => (
  <VectorMap
    map={worldMill}
    backgroundColor="transparent"
    markerStyle={{ initial: { fill: t.colors.primary, r: 4 } as any }}
    markersSelectable
    markers={MARKERS}
    zoomOnScroll={false}
    zoomMax={12}
    zoomMin={1}
    zoomAnimate
    zoomStep={1.5}
    regionStyle={{
      initial: {
        fill: mapColor ?? t.colors.border,
        fillOpacity: 1,
        stroke: 'none',
        strokeWidth: 0,
        strokeOpacity: 0,
      },
      hover:        { fillOpacity: 0.7, cursor: 'pointer', fill: t.colors.primary },
      selected:     { fill: t.colors.primary },
      selectedHover:{},
    }}
    regionLabelStyle={{
      initial:      { fill: t.colors.textSecondary, fontWeight: 500, fontSize: '13px', stroke: 'none' },
      hover:        {},
      selected:     {},
      selectedHover:{},
    }}
  />
);

export default CountryMap;
