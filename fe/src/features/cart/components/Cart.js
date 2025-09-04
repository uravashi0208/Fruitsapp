import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  ButtonGroup,
  Paper,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  cartSlideIn,
  successCheckmark,
} from '../../../utils/animations';

import { useSelector } from 'react-redux';

const Cart = ({ open, onClose, onRemove, onUpdateQuantity, onClearCart }) => {
  const cartItems = useSelector((state) => state.cart.items);
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [removingItem, setRemovingItem] = useState(null);

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleRemoveItem = async (itemId) => {
    setRemovingItem(itemId);
    await new Promise((resolve) => setTimeout(resolve, 300));
    onRemove(itemId);
    setRemovingItem(null);
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsProcessing(false);
    onClose();
    navigate('/checkout');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          backgroundColor: '#f8f9fa',
          backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          overflow: 'auto', // Allow scrolling
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(58, 143, 94, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(58, 143, 94, 0.5)',
            },
          },
        },
      }}
    >
      <motion.div initial="hidden" animate="visible" variants={cartSlideIn}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ShoppingCartIcon sx={{ mr: 1, color: 'primary.main' }} />
            Shopping Cart
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {cartItems.length === 0 ? (
          <Box
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                backgroundColor: 'white',
                maxWidth: 320,
              }}
            >
              <ShoppingBagIcon
                sx={{
                  fontSize: 70,
                  color: 'primary.light',
                  mb: 2,
                  opacity: 0.8,
                }}
              />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Your cart is empty
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 3,
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                Looks like you haven't added any plants to your cart yet. Browse our collection and
                find your perfect plant!
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={onClose}
                sx={{
                  px: 3,
                  py: 1,
                  boxShadow: '0 4px 12px rgba(58, 143, 94, 0.2)',
                }}
              >
                Continue Shopping
              </Button>
            </Paper>
          </Box>
        ) : (
          <>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pb: 12 }}>
              <List
                sx={{
                  px: 2,
                  py: 2,
                  backgroundColor: 'transparent',
                }}
              >
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        py: 2,
                        px: 2,
                        mb: 2,
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        borderRadius: 2,
                        mr: 2,
                        position: 'relative',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          variant="rounded"
                          src={item.image}
                          alt={item.name}
                          sx={{
                            width: 70,
                            height: 70,
                            mr: 2,
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                            },
                          }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              variant="body2"
                              color="primary.main"
                              sx={{
                                fontWeight: 600,
                                fontSize: '1rem',
                              }}
                            >
                              ${item.price.toFixed(2)}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mt: 1.5,
                                justifyContent: 'space-between',
                              }}
                            >
                              <ButtonGroup
                                size="small"
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'primary.light',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  boxShadow: '0 2px 8px rgba(58, 143, 94, 0.1)',
                                }}
                              >
                                <Button
                                  onClick={() =>
                                    onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                                  }
                                  disabled={item.quantity <= 1}
                                  sx={{
                                    minWidth: 32,
                                    borderRight: '1px solid',
                                    borderColor: 'primary.light',
                                    borderRadius: 0,
                                    color: 'primary.main',
                                    '&:hover': {
                                      backgroundColor: 'primary.light',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  <RemoveIcon fontSize="small" />
                                </Button>
                                <Button
                                  disabled
                                  sx={{
                                    px: 2,
                                    minWidth: 40,
                                    color: 'primary.main',
                                    fontWeight: 700,
                                    backgroundColor: 'primary.50',
                                  }}
                                >
                                  {item.quantity}
                                </Button>
                                <Button
                                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                  sx={{
                                    minWidth: 32,
                                    borderLeft: '1px solid',
                                    borderColor: 'primary.light',
                                    borderRadius: 0,
                                    color: 'primary.main',
                                    '&:hover': {
                                      backgroundColor: 'primary.light',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  <AddIcon fontSize="small" />
                                </Button>
                              </ButtonGroup>

                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => onRemove(item.id)}
                                sx={{
                                  color: 'text.secondary',
                                  '&:hover': {
                                    color: 'error.main',
                                  },
                                }}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        }
                        primaryTypographyProps={{
                          variant: 'subtitle1',
                          fontWeight: 600,
                          sx: {
                            mb: 0.5,
                            fontSize: '1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </AnimatePresence>
              </List>
            </Box>

            <Box
              sx={{
                p: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'white',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 3,
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total:
                </Typography>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                  ${totalPrice.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ position: 'relative' }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleCheckout}
                  disabled={isProcessing || showSuccess}
                  sx={{
                    py: 2,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    boxShadow: '0 6px 25px rgba(58, 143, 94, 0.4)',
                    background: 'linear-gradient(135deg, #3a8f5e 0%, #2e7d52 100%)',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(58, 143, 94, 0.5)',
                      transform: 'translateY(-2px)',
                      background: 'linear-gradient(135deg, #2e7d52 0%, #256a45 100%)',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #3a8f5e 0%, #2e7d52 100%)',
                      opacity: showSuccess ? 1 : 0.7,
                    },
                  }}
                >
                  {showSuccess ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <motion.div initial="hidden" animate="visible" variants={successCheckmark}>
                        <CheckCircleIcon />
                      </motion.div>
                      Success!
                    </Box>
                  ) : isProcessing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* <CircularProgress size={20} thickness={4} sx={{ color: 'white' }} /> */}
                      Processing...
                    </Box>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </Button>
                {isProcessing && (
                  <CircularProgress
                    size={24}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-12px',
                      marginLeft: '-12px',
                    }}
                  />
                )}
              </Box>
              <Button
                variant="text"
                color="inherit"
                fullWidth
                onClick={onClose}
                sx={{
                  mt: 1.5,
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'primary.main',
                  },
                }}
              >
                Continue Shopping
              </Button>
            </Box>
          </>
        )}
      </motion.div>
    </Drawer>
  );
};

export default Cart;
