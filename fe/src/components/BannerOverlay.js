import React from 'react';
import { Box } from '@mui/material';

const BannerOverlay = ({ children }) => {
  return (
    <>
      {/* Enhanced background overlay for better text visibility */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.3) 100%)',
          zIndex: 1,
        }}
      />

      {/* Additional overlay for text area */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: { xs: '100%', md: '60%' },
          height: '100%',
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {children}
    </>
  );
};

export default BannerOverlay;
