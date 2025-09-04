import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { fadeIn, slideUp, buttonHover, buttonTap } from '../utils/animations';

const CTASection = () => {
  return (
    <Box
      component={motion.section}
      variants={fadeIn}
      sx={{
        backgroundImage: `url('/assets/imgs/clients/Fresh Fruit.png')`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        height: '850px',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          textAlign: 'center',
          pb: 50,
        }}
      >
        <Box
          sx={{
            maxWidth: 800,
            mx: 'auto',
          }}
        >
          <Typography
            component={motion.h2}
            variants={slideUp}
            variant="h2"
            sx={{
              color: '#2B2F38',
              mb: 3,
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '2.66rem' },
              lineHeight: 1.2,
            }}
          >
            Interested? Shop Our Fresh Fruit Collection!
          </Typography>

          <Typography
            component={motion.p}
            variants={slideUp}
            variant="body1"
            sx={{
              mb: { xs: 4, md: 5 },
              maxWidth: 700,
              mx: 'auto',
              lineHeight: 1.8,
              fontSize: { xs: '0.9375rem', md: '1rem' },
              color: '#555',
            }}
          >
            Discover the freshest, most delicious fruits sourced directly from local farms. From
            sweet berries to tropical delights, we have everything you need for a healthy lifestyle.
          </Typography>

          <Button
            component={motion.button}
            variants={slideUp}
            whileHover={buttonHover}
            whileTap={buttonTap}
            variant="contained"
            size="large"
            href="/store"
            sx={{
              backgroundColor: '#8bc34a',
              color: 'white',
              borderRadius: 50,
              px: { xs: 4, md: 5 },
              py: { xs: 1.25, md: 1.5 },
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              letterSpacing: 1,
            }}
          >
            GO TO SHOP
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default CTASection;
