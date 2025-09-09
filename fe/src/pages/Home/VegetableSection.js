import {
  Box,
  Typography,
  Button,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { categories } from '../../data/products';

import "swiper/css";
import "swiper/css/navigation";

export default function VegetableSection() {
  return (
    <Box sx={{ py: 6, px: { xs: 2, sm: 4, md: 8 } }}>
      {/* Header with arrows */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#2c3e50" }}>
          Fresh Organic Fruits
        </Typography>
      </Box>

      {/* Swiper Carousel */}
      <Swiper
        modules={[Navigation, Autoplay]}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        loop={true}
        spaceBetween={20}
        breakpoints={{
          320: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 5 },
        }}
      >
        {categories.map((product, index) => (
          <SwiperSlide key={index}>
            <Box
              sx={{
                border: "1px solid #9CCC65",
                borderRadius: "10px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                position: "relative",
              }}
            >
              {/* Product image */}
              <Box sx={{ position: "relative",boxShadow:'0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <Box
                  component="img"
                  src={product.image}
                  alt={product.name}
                  sx={{ width: "100%", height: "200px", objectFit: "cover" }}
                />
              </Box>

              {/* Product content */}
              <Box sx={{ p: 2, flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#2c3e50" }}>
                  {product.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                  {product.description}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  {product.price}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<ShoppingCartIcon />}
                  sx={{
                    borderColor: "#FFB524",
                    color: "#7AC943",
                    fontWeight: 600,
                    textTransform: "none",
                    borderRadius: "20px",
                    px: 2,
                    "&:hover": {
                      bgcolor: "#FFB524",
                      color: "white",
                      borderColor: "#FFB524",
                    },
                  }}
                >
                  Shop Now
                </Button>
              </Box>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}
