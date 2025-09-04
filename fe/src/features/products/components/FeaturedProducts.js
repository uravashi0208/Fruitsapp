import { Box, Container } from '@mui/material';
import { motion } from 'framer-motion';
import SectionHeader from '../components/SectionHeader';
import ProductGrid from './ProductGrid';
import { products } from '../../../data/products';
import { fadeIn } from '../../../utils/animations';

const FeaturedProducts = ({ onAddToCart }) => {
  return (
    <Box
      component={motion.section}
      variants={fadeIn}
      sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#ffffff' }}
    >
      <Container maxWidth="xl">
        <SectionHeader
          title="Featured Fruits"
          subtitle="Discover our freshest and most-loved fruits—handpicked varieties perfect for snacks, smoothies, and your healthy lifestyle."
        />

        <ProductGrid products={products} onAddToCart={onAddToCart} />
      </Container>
    </Box>
  );
};

export default FeaturedProducts;
