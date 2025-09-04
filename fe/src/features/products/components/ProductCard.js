import { CardContent, Typography, Box, Chip, Rating, Button, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { hoverLift, buttonHover, buttonTap, fadeIn } from '../../../utils/animations';

const StyledCard = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  overflow: 'hidden',
  boxShadow: 'none',
  backgroundColor: '#ffffff',
}));

const ImageWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  height: 240,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#efeef4',
  // padding: 16
}));

const StyledCardMedia = styled('img', {
  shouldForwardProp: (prop) => prop !== 'isTransparent',
})(({ theme, isTransparent }) => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform 0.5s ease',
  ...(isTransparent && {
    opacity: 0.7,
  }),
}));

const SaleChip = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  backgroundColor: 'white',
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 28,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  zIndex: 2,
}));

const AddToCartButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  padding: '8px 16px',
  fontWeight: 600,
  fontSize: '0.875rem',
  textTransform: 'none',
}));

const ProductCard = ({ product, onAddToCart }) => {
  const { name, category, price, image, sale } = product;
  const isOrganicApples = name === 'Organic Apples';

  return (
    <StyledCard
      // component={motion.div}
      variants={fadeIn}
      whileHover={hoverLift}
      elevation={0}
    >
      <ImageWrapper>
        <StyledCardMedia src={image} alt={name} isTransparent={isOrganicApples} />
        {sale && <SaleChip label="Sale!" />}
      </ImageWrapper>

      <CardContent sx={{ flexGrow: 1, p: 2.5, textAlign: 'left' }}>
        <Typography
          component={motion.p}
          variant="body2"
          color="text.secondary"
          sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.875rem' }}
        >
          {category}
        </Typography>

        <Typography
          component={motion.h3}
          variant="h6"
          sx={{
            mb: 1,
            fontWeight: 600,
            fontSize: '1rem',
            color: '#2B2F38',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {name}
        </Typography>

        <Box sx={{ display: 'none', alignItems: 'center', mb: 1 }}>
          <Rating value={0} readOnly precision={0.5} size="small" />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography
            component={motion.span}
            variant="h6"
            color="primary.main"
            sx={{ fontWeight: 700, fontSize: '1rem' }}
          >
            ${price.toFixed(2)}
          </Typography>
        </Box>

        <AddToCartButton
          component={motion.button}
          whileHover={buttonHover}
          whileTap={buttonTap}
          variant="contained"
          disableElevation
          startIcon={<AddShoppingCartIcon />}
          onClick={() => onAddToCart(product)}
          fullWidth
        >
          Add to Cart
        </AddToCartButton>
      </CardContent>
    </StyledCard>
  );
};

export default ProductCard;
