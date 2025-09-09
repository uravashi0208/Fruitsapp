import { combineReducers } from '@reduxjs/toolkit';
// import cartReducer from '../../features/cart/slice/cartSlice';
import cartReducer from '../features/cart/slice/cartSlice';

// Import other feature reducers here
// import productsReducer from '../features/products/slice/productsSlice';

export const rootReducer = combineReducers({
  cart: cartReducer,
  // products: productsReducer,
  // Add other feature reducers here
});
