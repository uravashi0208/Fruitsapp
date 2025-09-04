import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { categories } from '../../../data/products';
import CategoryCard from './CategoryCard';
import { fadeIn, slideUp, staggerContainer } from '../../../utils/animations';

const Categories = () => {
  return (
    <Box
      component={motion.section}
      variants={fadeIn}
      sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#f9f9f9' }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          component={motion.div}
          variants={slideUp}
          sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}
        >
          <Typography
            component={motion.span}
            variants={slideUp}
            variant="subtitle1"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              fontSize: { xs: '0.875rem', md: '1rem' },
              mb: 1,
              display: 'block',
            }}
          >
            Our Collections
          </Typography>
          <Typography
            component={motion.h2}
            variants={slideUp}
            variant="h2"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '2rem', md: '2.5rem' },
              mb: 1.5,
              color: '#222',
            }}
          >
            Fruit Collections
          </Typography>
          <Box
            component={motion.div}
            variants={slideUp}
            sx={{
              width: 60,
              height: 2,
              backgroundColor: 'primary.main',
              mx: 'auto',
              mb: 2.5,
            }}
          />
          <Typography
            component={motion.p}
            variants={slideUp}
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 700,
              mx: 'auto',
              fontSize: { xs: '0.9375rem', md: '1rem' },
              lineHeight: 1.7,
            }}
          >
            Explore our wide variety of fresh fruits and fruit-growing accessories to find the
            perfect addition to your kitchen or garden.
          </Typography>
        </Box>

        <Box
          component={motion.div}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          sx={{
            display: 'flex',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: 4,
            justifyContent: 'center',
          }}
        >
          {categories.map((category) => (
            <Box
              key={category.id}
              component={motion.div}
              variants={fadeIn}
              sx={{ width: { xs: '100%', sm: '32%', md: '32%' }, minWidth: { sm: '30%' } }}
            >
              <CategoryCard category={category} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Categories;
