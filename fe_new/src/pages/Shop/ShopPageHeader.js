import React from "react";
import { Box, Typography, Breadcrumbs, Link } from "@mui/material";
import cartHeaderImage from '../../assets/img/cart-page-header-img.jpg';

export default function ShopPageHeader({title}) {
  return (
    <Box
      sx={{
        backgroundImage:
          `linear-gradient(rgba(43,57,64,.5), rgba(43,57,64,.5)), url(${cartHeaderImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        paddingTop:'130px',
        paddingBottom:'50px',
        textAlign: "center",
      }}
    >
      <Typography
        variant="h4"
        color="white"
        sx={{ fontWeight: "bold", mb: 2 }}
      >
        {title}
      </Typography>

      <Breadcrumbs
        aria-label="breadcrumb"
        sx={{
          display: "flex",
          justifyContent: "center",
          "& .MuiBreadcrumbs-separator": { color: "#fff" },
          "& a": { color: "#FFB524", textDecoration: "none" },
          "& .MuiTypography-root": { color: "#fff" },
        }}
      >
        <Link href="#" sx={{color:'#81c408 !important',"&:hover": { color:'rgb(103, 157, 6) !important' }}}>Home</Link>
        <Typography>{title}</Typography>
      </Breadcrumbs>
    </Box>
  );
}
