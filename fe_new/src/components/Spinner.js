import React from 'react';
import { CircularProgress, Box } from '@mui/material';

// Spinner shows an overlay when `show` is true
const Spinner = ({ show = false }) => {
  return (
    <Box
      id="spinner"
      sx={{
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity 0.8s ease-out, visibility 0s linear 0.5s',
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&.show': {
          transition: 'opacity 0.8s ease-out, visibility 0s linear 0s',
          visibility: 'visible',
          opacity: 1
        }
      }}
      className={show ? 'show' : ''}
    >
      <CircularProgress color="primary" />
    </Box>
  );
};

export default Spinner;