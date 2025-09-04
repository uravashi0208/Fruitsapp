import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Button, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';
import { createCheckoutSession } from './api';
import { removeFromCart } from '../cart/slice/cartSlice';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const total = useSelector((state) => state.cart.total);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleStripeCheckout = async () => {
    try {
      setError(null);
      setLoading(true);
      // Build payload items expected by backend
      const payloadItems = items.map((it) => ({
        id: it.id,
        name: it.name,
        price: it.price, // decimal dollars; backend converts to cents
        quantity: it.quantity,
        image: it.image,
        currency: 'usd',
      }));
      const { url } = await createCheckoutSession({ items: payloadItems, customer: {} });
      window.location.href = url; // redirect to Stripe Checkout
    } catch (e) {
      setError(e.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5">Your cart is empty.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Checkout
      </Typography>
      <List>
        {items.map((item) => (
          <ListItem key={item.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <ListItemText
              primary={item.name}
              secondary={`Quantity: ${item.quantity} | Price: $${item.price.toFixed(2)}`}
            />
            <Button color="error" onClick={() => handleRemove(item.id)}>
              Remove
            </Button>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Total: ${total.toFixed(2)}</Typography>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        disabled={loading}
        onClick={handleStripeCheckout}
      >
        {loading ? 'Redirecting...' : 'Checkout with Stripe'}
      </Button>
    </Box>
  );
};

export default CheckoutPage;
