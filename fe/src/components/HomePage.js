import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import Header from './Header';
import HeroBanner from './HeroBanner';
import Features from './Features';
import Categories from '../features/products/components/Categories';
import FeaturedProducts from '../features/products/components/FeaturedProducts';
import HelpSection from './HelpSection';
import CTASection from './CTASection';
import Cart from '../features/cart/components/Cart';
import { staggerContainer } from '../utils/animations';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} from '../features/cart/slice/cartSlice';

const HomePage = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  const handleCartOpen = () => {
    setCartOpen(true);
  };

  const handleCartClose = () => {
    setCartOpen(false);
  };

  const handleAddToCart = (product) => {
    console.log('Adding to cart:', product);
    dispatch(addToCart({ ...product, quantity: 1 }));
  };

  const handleRemoveFromCart = (productId) => {
    console.log('Removing from cart:', productId);
    dispatch(removeFromCart(productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    console.log('Updating quantity for:', productId, 'to', quantity);
    dispatch(updateQuantity({ id: productId, quantity }));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  return (
    <Box component={motion.div} variants={staggerContainer} initial="hidden" animate="visible">
      <Header cartItems={cartItems} onCartOpen={handleCartOpen} />
      <HeroBanner />
      <Features />
      <Categories />
      <FeaturedProducts onAddToCart={handleAddToCart} />
      <HelpSection />
      <CTASection />
      <Cart
        open={cartOpen}
        onClose={handleCartClose}
        cartItems={cartItems}
        onRemove={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
      />
    </Box>
  );
};

export default HomePage;
