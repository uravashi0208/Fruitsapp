import { useSelector, useDispatch } from 'react-redux';
import ShopPageHeader from "../Shop/ShopPageHeader";
import {
  Box,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  IconButton,
  TextField,
  Button,
  Paper,
  Container,
} from "@mui/material";
import { Add, Remove, Close } from "@mui/icons-material";
import {
  removeFromCart,
  updateQuantity
} from '../../features/cart/slice/cartSlice';
import { useState } from 'react';
import { createCheckoutSession } from '../../Api/api';

export default function CartPage() {
    const dispatch = useDispatch();
    const items = useSelector((state) => state.cart.items);
    const total = useSelector((state) => state.cart.total);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRemove = (id) => {
        dispatch(removeFromCart(id));
    };
    const handleUpdateQuantity = (productId, quantity) => {
        dispatch(updateQuantity({ id: productId, quantity }));
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

  return (
    <>
    <ShopPageHeader title={'Cart'}/>
    <Container>
    <Box sx={{ py: 5 }}>
      <Box sx={{ py: 5 }}>
        <Table>
        <TableHead>
            <TableRow>
            <TableCell>Products</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Handle</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {/* Example Row */}
            {items.map((item) => (
            <TableRow>
                <TableCell>
                <Box display="flex" alignItems="center">
                    <img
                    src={item.image}
                    alt={item.name}
                    style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                    }}
                    />
                </Box>
                </TableCell>
                <TableCell>
                <Typography sx={{ mt: 2 }}>{item.name}</Typography>
                </TableCell>
                <TableCell>
                <Typography sx={{ mt: 2 }}>${item.price}</Typography>
                </TableCell>
                <TableCell>
                <Box
                    display="flex"
                    sx={{ mt: 2 }}
                >
                    <IconButton size="small" onClick={() =>handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                    <Remove />
                    </IconButton>
                    <TextField
                    size="small"
                    value={item.quantity}
                    sx={{ width: 50, mx: 1 }}
                    inputProps={{ style: { textAlign: "center" } }}
                    />
                    <IconButton size="small" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                    <Add />
                    </IconButton>
                </Box>
                </TableCell>
                <TableCell>
                <Typography sx={{ mt: 2 }}>${item.price}</Typography>
                </TableCell>
                <TableCell>
                <IconButton sx={{ mt: 2 }} onClick={() => handleRemove(item.id)}>
                    <Close color="error" />
                </IconButton>
                </TableCell>
            </TableRow>
            ))}
            {/* Repeat <TableRow> for other products */}
        </TableBody>
        </Table>

        {/* Cart Summary */}
        <Grid container justifyContent="flex-end" mt={5}>
          <Grid item xs={12} sm={8} md={7} lg={6} xl={4} sx={{width:'35%'}}>
            <Paper sx={{ borderRadius: 2, bgcolor: "#f8f9fa",color:'#45595b' }}>
              <Box p={4}>
                {/* Heading */}
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: "bold",
                    mb: 4,
                    fontSize: "2.5rem",
                  }}
                >
                  Cart{" "}
                  <Box component="span" sx={{ fontWeight: 400 }}>
                    Total
                  </Box>
                </Typography>

                {/* Subtotal */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  mb={4}
                >
                  <Typography variant="h5" sx={{ mr: 4,fontWeight: 600,lineHeight:1.2 }}>
                    Subtotal:
                  </Typography>
                  <Typography variant="h6">${total.toFixed(2)}</Typography>
                </Box>

                {/* Shipping */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography variant="h5" sx={{ mr: 4,fontWeight: 600,lineHeight:1.2 }}>
                    Shipping
                  </Typography>
                  <Typography variant="h6">Flat rate: $3.00</Typography>
                </Box>
              </Box>

              {/* Divider with top/bottom border for Total */}
              <Box
                py={3}
                mb={4}
                px={4}
                display="flex"
                justifyContent="space-between"
                sx={{ borderTop: "1px solid #ddd", borderBottom: "1px solid #ddd" }}
              >
                <Typography variant="h5" sx={{fontWeight: 600,lineHeight:1.2 }}>Total</Typography>
                <Typography variant="h6">${total.toFixed(2)}</Typography>
              </Box>

              {/* Checkout button */}
              <Box px={4} pb={4}>
                <Button
                  variant="outlined"
                  sx={{
                    borderRadius: "50px",
                    px: 4,
                    py: 1.5,
                    textTransform: "uppercase",
                    border:'1px solid rgba(0,0,0,0)',
                    borderColor:'#ffb524',
                    fontWeight:600,
                    transition:'0.5s',
                    fontSize:'1.6 rem'
                  }}
                  onClick={handleStripeCheckout}
                >
                  {loading ? 'Redirecting...' : 'Checkout with Stripe'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
    </Container>
    </>
  );
}
