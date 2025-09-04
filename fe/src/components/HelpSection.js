import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';

const HelpSection = () => {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundImage: `url('https://images.unsplash.com/photo-1591025274565-15f8a5b5171b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw5fHxmcnVpdCUyMG9yY2hhcmQlMjBmcnVpdCUyMHRyZWVzJTIwZmFybWluZ3xlbnwwfDB8fGdyZWVufDE3NTU4NTM4NTd8MA&ixlib=rb-4.1.0&q=85')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        },
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          color: 'white',
        }}
      >
        <Typography
          variant="h3"
          component="h2"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            mb: 3,
            color: 'white',
          }}
        >
          Need help in choosing the right fruits?
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 4,
            maxWidth: 700,
            mx: 'auto',
            lineHeight: 1.8,
            fontSize: { xs: '0.9375rem', md: '1rem' },
            color: 'white',
            opacity: 0.9,
          }}
        >
          Our fruit experts are here to help you select the perfect fruits for your needs. Whether
          you're looking for seasonal favorites, exotic varieties, or organic options, we'll guide
          you to the best choices for your health and taste preferences.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          size="large"
          href="/contact"
          sx={{
            px: { xs: 4, md: 5 },
            py: { xs: 1.25, md: 1.5 },
            borderRadius: 50,
            backgroundColor: '#8bc34a',
            color: 'white',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            letterSpacing: 1,
            '&:hover': {
              backgroundColor: '#7cb342',
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 15px rgba(0,0,0,0.2)',
            },
          }}
        >
          CONNECT WITH US
        </Button>
      </Container>
    </Box>
  );
};

export default HelpSection;
