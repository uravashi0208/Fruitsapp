// Product data service
import { products, categories } from '../../../data/products';

// Get all products
export const getAllProducts = () => products;

// Get all categories
export const getAllCategories = () => categories;

// Get products by category
export const getProductsByCategory = (category) =>
  products.filter((product) => product.category === category);

// Get product by ID
export const getProductById = (id) => products.find((product) => product.id === id);

// Get category by name
export const getCategoryByName = (name) => categories.find((category) => category.name === name);

// Get featured products (first 4 products)
export const getFeaturedProducts = () => products.slice(0, 4);

// Get products by price range
export const getProductsByPriceRange = (min, max) =>
  products.filter((product) => product.price >= min && product.price <= max);

// Search products by name
export const searchProducts = (query) =>
  products.filter(
    (product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()),
  );
