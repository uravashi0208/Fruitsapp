import { Box, Typography } from '@mui/material';

const SectionHeader = ({
  title,
  subtitle,
  titleVariant = 'h2',
  titleComponent = 'h2',
  maxWidth = 700,
  marginBottom = 5,
}) => {
  return (
    <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
      <Typography
        variant={titleVariant}
        component={titleComponent}
        sx={{
          fontWeight: 600,
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 1,
          color: '#2B2F38',
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: maxWidth,
            mx: 'auto',
            fontSize: { xs: '0.9375rem', md: '1rem' },
            lineHeight: 1.7,
            mb: marginBottom,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default SectionHeader;
