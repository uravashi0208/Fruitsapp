import React from 'react';
import { Box, Container, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { features } from '../data/products';
import FeatureCard from './FeatureCard';
import { fadeIn, staggerContainer } from '../utils/animations';

const Features = () => {
  return (
    <Box
      component={motion.section}
      variants={fadeIn}
      sx={{
        py: { xs: 4, md: 8 },
        backgroundColor: '#f9f9f9',
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={6}
          justifyContent="center"
          alignItems="center"
          component={motion.div}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {features.map((feature, index) => (
            <Grid
              item
              xs={12}
              md={4}
              key={feature.id}
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
              component={motion.div}
              variants={fadeIn}
            >
              <FeatureCard feature={feature} index={index} isLast={index === features.length - 1} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Features;
