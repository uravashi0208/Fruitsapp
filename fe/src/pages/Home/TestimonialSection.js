import {
  Box,
  Typography,
  Avatar,
  Rating,
  Paper,
} from "@mui/material";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import testimonial1 from "../../assets/img/avatar.jpg";

export default function TestimonialSection() {
  const testimonials = [
    {
      text: "Lorem Ipsum is simply dummy text of the printing Ipsum has been the industry's standard dummy text ever since the 1500s.",
      name: "Client Name",
      profession: "Profession",
      image: testimonial1,
      rating: 5,
    },
    {
      text: "Lorem Ipsum is simply dummy text of the printing Ipsum has been the industry's standard dummy text ever since the 1500s.",
      name: "Client Name",
      profession: "Profession",
      image: testimonial1,
      rating: 5,
    },
    {
      text: "Lorem Ipsum is simply dummy text of the printing Ipsum has been the industry's standard dummy text ever since the 1500s.",
      name: "Client Name",
      profession: "Profession",
      image: testimonial1,
      rating: 5,
    },
  ];

  return (
    <Box sx={{ py: 8, bgcolor: "white" }}>
      <Box sx={{ maxWidth: "1200px", mx: "auto", px: 2 }}>
        {/* Header */}
        <Box textAlign="center" mb={5}>
          <Typography variant="h6" color="success.main">
            Our Testimonial
          </Typography>
          <Typography
            variant="h3"
            fontWeight={700}
            color="text.primary"
            sx={{ mb: 4 }}
          >
            Our Client Saying!
          </Typography>
        </Box>


        {/* Swiper Carousel */}
        <Swiper
          spaceBetween={30}
          slidesPerView={1}
          loop
          autoplay={{ delay: 3000 }}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          breakpoints={{
            768: { slidesPerView: 2 },
            1200: { slidesPerView: 2 },
          }}
          modules={[Navigation, Autoplay]}
        >
          {testimonials.map((t, i) => (
            <SwiperSlide key={i}>
              <Paper
                sx={{
                  p: 4,
                  borderRadius: 3,
                  bgcolor: "grey.100",
                  height: "100%",
                }}
              >
                {/* Testimonial text */}
                <Typography variant="body1" color="text.secondary" mb={2}>
                  {t.text}
                </Typography>

                {/* Divider */}
                <Box
                  sx={{
                    height: 1,
                    bgcolor: "#FFB524",
                    my: 2,
                  }}
                />

                {/* Bottom section */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Client Info */}
                  <Box display="flex" alignItems="center">
                    <Avatar
                      src={t.image}
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: 2,
                        mr: 2,
                      }}
                      variant="rounded"
                    />
                    <Box>
                      <Typography variant="h6" color="text.primary">
                        {t.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {t.profession}
                      </Typography>
                      <Rating value={t.rating} readOnly size="small" />
                    </Box>
                  </Box>

                  {/* Quote Icon */}
                  <FormatQuoteIcon
                    sx={{ fontSize: 40, color: "#FFB524" }}
                  />
                </Box>
              </Paper>
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
}
