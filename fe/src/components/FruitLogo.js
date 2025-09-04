import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #7cb342 100%)`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    height: '70%',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
  },
}));

const FruitIcon = styled('div')(({ theme }) => ({
  fontSize: '20px',
  zIndex: 1,
  position: 'relative',
}));

const FruitLogo = ({ size = 40 }) => {
  return (
    <LogoContainer sx={{ width: size, height: size }}>
      <FruitIcon>🍎</FruitIcon>
    </LogoContainer>
  );
};

export default FruitLogo;
