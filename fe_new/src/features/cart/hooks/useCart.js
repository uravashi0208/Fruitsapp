import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateQuantity, clearCart } from '../slice/cartSlice';

export const useCart = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  const addItemToCart = (product, quantity = 1) => {
    dispatch(addToCart({ ...product, quantity }));
  };

  const removeItemFromCart = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const updateItemQuantity = (productId, quantity) => {
    dispatch(updateQuantity({ id: productId, quantity }));
  };

  const clearCartItems = () => {
    dispatch(clearCart());
  };

  const getCartTotal = () => {
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  const isInCart = (productId) => {
    return cart.items.some((item) => item.id === productId);
  };

  return {
    items: cart.items,
    total: cart.total,
    isLoading: cart.isLoading,
    error: cart.error,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    clearCartItems,
    getCartTotal,
    getCartItemCount,
    isInCart,
  };
};
