import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, Button, Paper } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ShopPageHeader from "../Shop/ShopPageHeader";
import { clearCart } from "../../features/cart/slice/cartSlice";

const Success = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get("session_id");
  dispatch(clearCart());
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    // Fetch session details from your backend (optional)
    fetch(`${process.env.REACT_APP_API_BASE}/checkout-session?sessionId=${sessionId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setSession(data);
        dispatch(clearCart());
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching session:", error);
        setLoading(false);
      });
    
  }, [sessionId]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
    <ShopPageHeader title={'Cancel Payment'}/>
     <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          maxWidth: 400,
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 60, color: "green", mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Payment Successful
        </Typography>

        {sessionId && (
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Session ID: {sessionId}
          </Typography>
        )}

        {session && (
          <Box mt={2}>
            <Typography variant="h6">
              Amount: ${(session.amount_total / 100).toFixed(2)}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Customer: {session.customer_details?.email}
            </Typography>
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 4 }}
          href="/"
        >
          Go back to Home
        </Button>
      </Paper>
    </Box>
    </>
  );
};

export default Success;
