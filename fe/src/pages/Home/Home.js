import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  IconButton
} from '@mui/material';
import {
  LocalShipping,
  Security,
  SwapHoriz,
  SupportAgent
} from '@mui/icons-material';

// Import images from assets so bundler resolves paths
import heroImg from '../../assets/img/hero-img.jpg';
import heroImg1 from '../../assets/img/hero-img-1.png';
import heroImg2 from '../../assets/img/hero-img-2.jpg';
import fruite1 from '../../assets/img/featur-1.jpg';
import fruite2 from '../../assets/img/featur-2.jpg';
import tropical from '../../assets/img/citrus.jpg';
import CounterSection from './CounterSection';
import TestimonialSection from './TestimonialSection';
import VegetableSection from './VegetableSection';
import BannerSection from './BannerSection';

const Home = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [heroIndex, setHeroIndex] = React.useState(0);

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  const heroSlides = [
    { src: heroImg1, label: 'Fruits' },
    { src: heroImg2, label: 'Vegetables' }
  ];

  const nextHero = () => setHeroIndex((prev) => (prev + 1) % heroSlides.length);
  const prevHero = () => setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  const products = [
  {
    title: "Fresh Apples",
    offer: "20% OFF",
    image: fruite1, // replace with your image path
    labelBg: "#7AC943",
    bottomBg: "#FFB524",
    lblcolor:'#fff',
    borderline:'#FFB524'
  },
  {
    title: "Tasty Fruits",
    offer: "Free delivery",
    image: fruite2,
    labelBg: "#F5F5F5",
    bottomBg: "#3A4B53",
    lblcolor:'#81c408',
    borderline:'#3A4B53'
  },
  {
    title: "Citrus Fruits",
    offer: "Discount 30$",
    image: tropical,
    labelBg: "#FFB524",
    bottomBg: "#7AC943",
    lblcolor:'#fff',
    borderline:'#7AC943'
  },
];

  const features = [
    { icon: <LocalShipping sx={{ fontSize: 40, color: 'white' }} />, title: 'Free Shipping', description: 'Free on order over $300' },
    { icon: <Security sx={{ fontSize: 40, color: 'white' }} />, title: 'Security Payment', description: '100% security payment' },
    { icon: <SwapHoriz sx={{ fontSize: 40, color: 'white' }} />, title: '30 Day Return', description: '30 day money guarantee' },
    { icon: <SupportAgent sx={{ fontSize: 40, color: 'white' }} />, title: '24/7 Support', description: 'Support every time fast' },
  ];

  return (
    <>
      {/* Hero Section */}
      <Box className="hero-header" sx={{ py: 5, mb: 5 ,backgroundImage: `linear-gradient(rgba(248, 223, 173, 0.1), rgba(248, 223, 173, 0.1)), url(${heroImg})`}}>
        <Container sx={{py:5}}>
          <Grid container spacing={5}>
            <Grid size={{ xs: 7, md: 7 }}>
              <Typography variant="h4" sx={{ mb: 3, color: 'secondary.main' }}>
                100% Organic Foods
              </Typography>
              <Typography variant="h2" sx={{ mb: 5, color: 'primary.main', fontWeight: 'bold' }}>
                Organic Fruits
              </Typography>
              <Box sx={{ position: 'relative', width: '100%' }}>
                <input 
                  type="text" 
                  placeholder="Search"
                  style={{
                    width: '75%',
                    padding: '1rem 1.5rem',
                    border: '2px solid #ffb524',
                    borderRadius: '50px',
                    fontSize: '16px'
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    position: 'absolute',
                    right: '25%',
                    top: 0,
                    height: '100%',
                    border: '2px solid #ffb524',
                    borderRadius: '50px',
                    color:'white',
                    fontWeight:600,
                    fontSize:'1rem',
                    '&:hover': {bgcolor: '#FFB524',color:'white'}
                  }}
                >
                  Submit Now
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 5, md: 5 }}>
              <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                <img 
                  src={heroSlides[heroIndex].src}
                  alt={heroSlides[heroIndex].label}
                  style={{ width: '100%', backgroundColor:'#ffb524' }}
                />
                <Button
                  variant="contained"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'linear-gradient(rgba(255, 181, 36, 0.7), rgba(255, 181, 36, 0.7))',
                    fontSize:'25px',
                    px:4,
                    borderRadius:'10px',
                    color:'white',
                  }}
                >
                  {heroSlides[heroIndex].label}
                </Button>
                <IconButton onClick={prevHero} sx={{ width:'48px', height:'48px',fontSize:'2.5rem',position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: '#81C408',border:'1px solid white' ,color:'white',opacity:'0.5','&:hover': {opacity: 0.9,bgcolor: '#81C408'},'&:focus': {opacity: 0.9}}}>
                  {'<'}
                </IconButton>
                <IconButton onClick={nextHero} sx={{width:'48px', height:'48px', fontSize:'2.5rem',position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: '#81C408' ,border:'1px solid white',color:'white',opacity:'0.5','&:hover': {opacity: 0.9,bgcolor: '#81C408'},'&:focus': {opacity: 0.9}}}>
                  {'>'}
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 5, width: '100%' }}>
        <Grid
          container
          spacing={4}              // smaller gaps between cards
          justifyContent="center"
          sx={{ m: 0, width: '100%' }}   // remove container margin
        >
          {features.map((feature, index) => (
            <Grid
              key={index}
              item
              xs={12}   // full width on mobile
              sm={6}    // 2 per row on small screens
              md={3}    // 4 per row on medium & large
              lg={3}
              sx={{ p: 0 }}   // remove extra padding inside grid item
            >
              <Box
                sx={{
                  borderRadius: '10px',
                  backgroundColor: '#f4f6f8',
                  px: 7,
                  py:3,
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                {/* Circle with pointer */}
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: '#FFB524',
                    mx: 'auto',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',

                    '&::after': {
                      content: '""',
                      width: '35px',
                      height: '35px',
                      bgcolor: '#FFB524',
                      position: 'absolute',
                      bottom: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                    },
                  }}
                >
                  {feature.icon}
                </Box>

                {/* Text */}
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 600, color: '#2c3e50' }}
                >
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box sx={{ py: 5, px: { xs: 2, sm: 4, md: 8 } }}>
        <Grid container spacing={3} justifyContent="center">
          {products.map((product, index) => (
            <Grid
              key={index}
              item
              xs={12}   // full width on mobile
              sm={6}    // 2 per row on small screens
              md={4}    // 4 per row on medium & large
              lg={4}
              sx={{ p: 0 }}   // remove extra padding inside grid item
            >
              <Box
                sx={{
                  border: "1px solid #ddd",
                  borderColor: product.borderline,
                  borderRadius: "10px",
                  overflow: "hidden",
                  position: "relative",
                  bgcolor: "#fff",
                  textAlign: "center",
                }}
              >
                {/* Image */}
                <Box
                  component="img"
                  src={product.image}
                  alt={product.title}
                  sx={{
                    width: "100%",
                    height: "280px",
                    objectFit: "cover",
                  }}
                />

                {/* Floating label */}
                <Box
                  sx={{
                    position: "absolute",
                    top: "70%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    bgcolor: product.labelBg,
                    px: 3,
                    py: 1.5,
                    borderRadius: "8px",
                    boxShadow: 2,
                    width: "250px",
                    height: '115px',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600,fontSize:'1.25rem',color:product.lblcolor }}>
                    {product.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {product.offer}
                  </Typography>
                </Box>

                {/* Bottom section */}
                <Box
                  sx={{
                    bgcolor: product.bottomBg,
                    height: "120px",
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <VegetableSection />
      <BannerSection />
      <CounterSection />
      <TestimonialSection />
    </>
  );
};

export default Home;