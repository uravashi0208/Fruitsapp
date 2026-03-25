import React from 'react';
// @ts-ignore
import { VectorMap } from '@react-jvectormap/core';
// @ts-ignore
import { worldMill } from '@react-jvectormap/world';

interface CountryMapProps {
  mapColor?: string;
}

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  return (
    <VectorMap
      map={worldMill}
      backgroundColor="transparent"
      markerStyle={{
        initial: { fill: '#465FFF', r: 4 } as any,
      }}
      markersSelectable={true}
      markers={[
        { latLng: [37.258, -104.657], name: 'United States', style: { fill: '#465FFF', borderWidth: 1, borderColor: 'white' } },
        { latLng: [20.75, 73.727], name: 'India', style: { fill: '#465FFF', borderWidth: 1, borderColor: 'white' } },
        { latLng: [53.613, -11.636], name: 'United Kingdom', style: { fill: '#465FFF', borderWidth: 1, borderColor: 'white' } },
        { latLng: [-25.03, 115.209], name: 'Australia', style: { fill: '#465FFF', borderWidth: 1, borderColor: 'white' } },
      ]}
      zoomOnScroll={false}
      zoomMax={12}
      zoomMin={1}
      zoomAnimate={true}
      zoomStep={1.5}
      regionStyle={{
        initial: {
          fill: mapColor || '#D0D5DD',
          fillOpacity: 1,
          stroke: 'none',
          strokeWidth: 0,
          strokeOpacity: 0,
        },
        hover: { fillOpacity: 0.7, cursor: 'pointer', fill: '#465fff' },
        selected: { fill: '#465FFF' },
        selectedHover: {},
      }}
      regionLabelStyle={{
        initial: { fill: '#35373e', fontWeight: 500, fontSize: '13px', stroke: 'none' },
        hover: {},
        selected: {},
        selectedHover: {},
      }}
    />
  );
};

export default CountryMap;
