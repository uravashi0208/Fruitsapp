import { Box, Typography, Button, CardContent, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router-dom';
import { hoverLift, buttonHover, buttonTap, fadeIn } from '../../../utils/animations';

const MotionButton = motion(Button);

const mapCategoryFilter = (displayName) => {
  const name = displayName.toLowerCase();
  if (name.includes('berry')) return 'Berries';
  if (name.includes('citrus')) return 'Citrus';
  if (name.includes('tropical')) return 'Tropical';
  return displayName;
};

const CategoryCard = ({ category }) => {
  const filterCat = mapCategoryFilter(category.name);
  const to = `/store?category=${encodeURIComponent(filterCat)}`;

  return (
    <Paper
      component={motion.div}
      variants={fadeIn}
      whileHover={hoverLift}
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: '#f4f2f0',
        maxWidth: '100%',
      }}
    >
      <Box
        sx={{
          height: { xs: 280, sm: 250, md: 370 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f4f2f0',
          padding: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          component={motion.img}
          whileHover={{ scale: 1.05 }}
          src={category.image}
          alt={`${category.name} - Metin Ozer on Unsplash`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 3,
          }}
        />
      </Box>

      <CardContent
        sx={{
          p: { xs: 3, md: 3 },
          textAlign: 'left',
        }}
      >
        <Typography
          component={motion.h3}
          variant="h5"
          sx={{
            mb: 1.5,
            fontWeight: 600,
            fontSize: { xs: '1.25rem', md: '1.35rem' },
            color: '#2B2F38',
          }}
        >
          {category.name}
        </Typography>

        <Typography
          component={motion.p}
          variant="body2"
          sx={{
            mb: 3,
            color: 'text.secondary',
            fontSize: { xs: '0.875rem', md: '0.9375rem' },
            lineHeight: 1.6,
          }}
        >
          {category.description}
        </Typography>

        <MotionButton
          component={RouterLink}
          to={to}
          whileHover={buttonHover}
          whileTap={buttonTap}
          variant="text"
          endIcon={<ArrowForwardIcon />}
          sx={{
            color: '#75c32c',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: 1,
            padding: 0,
            '& .MuiSvgIcon-root': {
              transition: 'transform 0.3s ease',
            },
          }}
        >
          See collection
        </MotionButton>
      </CardContent>
    </Paper>
  );
};

export default CategoryCard;
