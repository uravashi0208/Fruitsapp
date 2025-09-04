import React from 'react';
import { Box, Container } from '@mui/material';
import { motion } from 'framer-motion';
import BannerOverlay from './BannerOverlay';
import BannerContent from './BannerContent';
import { fadeIn } from '../utils/animations';

const HeroBanner = () => {
  return (
    <Box
      component={motion.div}
      variants={fadeIn}
      sx={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1743636521309-41ab36eb89e1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwyfHxmcnVpdCUyMG1hcmtldCUyMGZyZXNoJTIwZnJ1aXRzJTIwY29sb3JmdWwlMjBwcm9kdWNlfGVufDB8MHx8fDE3NTU4NTM4NTd8MA&ixlib=rb-4.1.0&q=85')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: { xs: '80vh', sm: '85vh', md: '78vh' },
        minHeight: { xs: '500px', md: '650px' },
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        mt: { xs: 7, md: 8 },
        borderBottomLeftRadius: { xs: 30, md: 80 },
        borderBottomRightRadius: { xs: 30, md: 80 },
        overflow: 'hidden',
      }}
    >
      <BannerOverlay>
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 2,
            px: { xs: 3, sm: 4, md: 5 },
          }}
        >
          <BannerContent />
        </Container>
      </BannerOverlay>
    </Box>
  );
};

export default HeroBanner;
