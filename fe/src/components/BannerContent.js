import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const BannerContent = () => {
  return (
    <Box
      sx={{
        maxWidth: { xs: '100%', md: '55%' },
        pl: { md: 3 },
      }}
    >
      <Typography
        component="h5"
        sx={{
          color: '#ffffff',
          textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)',
          mb: { xs: 2, md: 3 },
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          fontSize: { xs: '0.875rem', md: '1rem' },
          position: 'relative',
          display: 'inline-block',
          pl: 3,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            width: 15,
            height: 2,
            backgroundColor: 'primary.main',
            transform: 'translateY(-50%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          },
        }}
      >
        Best Quality Fruits
      </Typography>

      <Typography
        variant="h1"
        sx={{
          color: '#ffffff',
          textShadow: '0 3px 15px rgba(0,0,0,0.9), 0 1px 5px rgba(0,0,0,1)',
          mb: { xs: 3, md: 4 },
          fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.5px',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
        }}
      >
        Amazing Variety Of Fresh Fruits Starting Just $3
      </Typography>

      <Button
        variant="contained"
        color="primary"
        size="large"
        href="/store"
        sx={{
          borderRadius: 30,
          px: { xs: 4, md: 5 },
          py: { xs: 1.5, md: 1.75 },
          fontSize: { xs: '0.9375rem', md: '1rem' },
          fontWeight: 600,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
            transform: 'translateY(-3px)',
            border: '2px solid rgba(255,255,255,0.2)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        Shop Now
      </Button>
    </Box>
  );
};

export default BannerContent;
