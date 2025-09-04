import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import AppleIcon from '@mui/icons-material/Apple';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CachedOutlinedIcon from '@mui/icons-material/CachedOutlined';
import { bounce, hoverScale } from '../utils/animations';

const FeatureCard = ({ feature, index, isLast }) => {
  // Map icons to feature IDs
  const getIcon = (id) => {
    switch (id) {
      case 1:
        return <AppleIcon sx={{ fontSize: 40, color: '#75c32c' }} />;
      case 2:
        return <LocalShippingOutlinedIcon sx={{ fontSize: 40, color: '#75c32c' }} />;
      case 3:
        return <CachedOutlinedIcon sx={{ fontSize: 40, color: '#75c32c' }} />;
      default:
        return null;
    }
  };

  return (
    <Box
      component={motion.div}
      variants={bounce}
      whileHover={hoverScale}
      sx={{
        display: 'flex',
        alignItems: 'center',
        maxWidth: 350,
        width: '100%',
        position: 'relative',
        padding: 2,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(117, 195, 44, 0.05)',
          transform: 'translateY(-4px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          right: { xs: 'auto', md: 0 },
          bottom: { xs: -16, md: 'auto' },
          width: { xs: '80%', md: 1 },
          height: { xs: 1, md: '60%' },
          backgroundColor: 'rgba(255,255,255,0)',
          display: isLast ? 'none' : 'block',
        },
      }}
    >
      <Box
        component={motion.div}
        whileHover={{ scale: 1.1 }}
        sx={{
          mr: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {getIcon(feature.id)}
      </Box>
      <Box>
        <Typography
          component={motion.h6}
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.115rem', md: '1.12em' },
            mb: 0.5,
            color: '#2B2F38',
          }}
        >
          {feature.title}
        </Typography>
        <Typography
          component={motion.p}
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: { xs: '0.875rem', md: '0.9375rem' },
          }}
        >
          {feature.description}
        </Typography>
      </Box>
    </Box>
  );
};

export default FeatureCard;
