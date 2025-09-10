import React from "react";
import { Container, Paper, Typography, Button, Box } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import ShopPageHeader from "../Shop/ShopPageHeader";

const Cancel = () => {
  return (
    <>
    <ShopPageHeader title={'Cancel Payment'}/>
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        {/* Cancel Icon */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <CancelIcon color="error" sx={{ fontSize: 60 }} />
        </Box>

        {/* Title */}
        <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "error.main" }}>
          Payment Cancelled
        </Typography>

        {/* Subtitle */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your payment was not completed. Please try again or return to the homepage.
        </Typography>

        {/* Button */}
        <Button
          variant="contained"
          color="primary"
          href="/"
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.2,
            textTransform: "none",
            fontWeight: "bold",
          }}
        >
          Go back to Home
        </Button>
      </Paper>
    </Container>
    </>
  );
};

export default Cancel;
