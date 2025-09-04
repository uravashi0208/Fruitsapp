import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Divider,
  Slider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Button,
} from '@mui/material';
import Header from '../components/Header';
import ProductGrid from '../features/products/components/ProductGrid';
import Cart from '../features/cart/components/Cart';
import { getAllProducts, getAllCategories } from '../features/products/services/products';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} from '../features/cart/slice/cartSlice';

// Utility to format price values
const formatPrice = (value) => `$${value.toFixed(2)}`;

const ShopCategoryPage = () => {
  // slug can be used to switch content later (women, men, accessories, etc.)
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || '';

  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  // Cart state
  const [cartOpen, setCartOpen] = useState(false);

  const handleCartOpen = () => setCartOpen(true);
  const handleCartClose = () => setCartOpen(false);
  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
  };
  const handleRemoveFromCart = (productId) => {
    dispatch(removeFromCart(productId));
  };
  const handleUpdateQuantity = (productId, quantity) => {
    dispatch(updateQuantity({ id: productId, quantity }));
  };
  const handleClearCart = () => {
    dispatch(clearCart());
  };

  // Page title/description mapping based on slug
  const { title, description } = useMemo(() => {
    // For now we only replicate the "Women" archive layout; you can extend this switch
    if ((slug || '').toLowerCase() === 'women') {
      return {
        title: 'Women',
        description:
          'Nam nec tellus a odio tincidunt auctor a ornare odio. Sed non mauris vitae erat consequat auctor eu in elit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Mauris in erat justo. Nullam ac urna eu felis dapibus condimentum sit amet a augue. Sed non neque elit sed ut.',
      };
    }
    return {
      title: 'Everything',
      description:
        'Explore our curated collection. Use filters to refine your search and find exactly what you want.',
    };
  }, [slug]);

  // Get products and categories data
  const allProducts = useMemo(() => getAllProducts(), []);
  const allCategories = useMemo(() => getAllCategories(), []);

  // Price range from available products
  const priceValues = useMemo(() => allProducts.map((p) => p.price), [allProducts]);
  const minPrice = useMemo(() => Math.floor(Math.min(...priceValues)), [priceValues]);
  const maxPrice = useMemo(() => Math.ceil(Math.max(...priceValues)), [priceValues]);
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);

  const handlePriceChange = (_, newValue) => setPriceRange(newValue);

  // Filtered products by category and price
  const filtered = useMemo(() => {
    const [minP, maxP] = priceRange;
    return allProducts.filter((p) => {
      const inPrice = p.price >= minP && p.price <= maxP;
      const inCategory = selectedCategory ? p.category === selectedCategory : true;
      return inPrice && inCategory;
    });
  }, [priceRange, selectedCategory, allProducts]);

  // Pagination
  const perPage = 12;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  // Best sellers: top by price (as a placeholder metric)
  const bestSellers = useMemo(() => {
    return [...allProducts].sort((a, b) => b.price - a.price).slice(0, 5);
  }, [allProducts]);

  // Category counts (derived from data)
  const categoryCounts = useMemo(() => {
    const map = new Map();
    allProducts.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    return Array.from(map.entries()) // [category, count]
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [allProducts]);

  // When selectedCategory changes, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  return (
    <Box sx={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <Header cartItems={cartItems} onCartOpen={handleCartOpen} />

      {/* Push content below fixed header */}
      <Box sx={{ height: { xs: 76, md: 92 } }} />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} underline="hover" color="inherit" to="/">
            Home
          </Link>
          <Typography color="text.primary">{title}</Typography>
        </Breadcrumbs>

        {/* Title & description */}
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1.5 }}>
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 900, lineHeight: 1.7 }}
        >
          {description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', md: 300 } }}>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Filter by Price
              </Typography>
              <Box sx={{ px: 1 }}>
                <Slider
                  value={priceRange}
                  min={minPrice}
                  max={maxPrice}
                  onChange={handlePriceChange}
                  valueLabelDisplay="auto"
                  getAriaLabel={() => 'Price range'}
                  getAriaValueText={(v) => `${v}`}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Price: {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
                </Typography>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Categories
              </Typography>
              <List dense>
                {categoryCounts.map(([cat, count]) => (
                  <ListItem disablePadding key={cat}>
                    <ListItemButton
                      selected={selectedCategory === cat}
                      onClick={() => {
                        const next = selectedCategory === cat ? '' : cat;
                        if (next) setSearchParams({ category: next });
                        else setSearchParams({});
                      }}
                    >
                      <ListItemText
                        primaryTypographyProps={{ fontSize: '0.95rem' }}
                        primary={`${cat} (${count})`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Our Best Sellers
              </Typography>
              <List dense>
                {bestSellers.map((p) => (
                  <ListItem key={p.id} alignItems="flex-start" sx={{ gap: 1.5 }}>
                    <Box
                      component="img"
                      src={p.image}
                      alt={p.name}
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 1,
                        background: '#efeef4',
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatPrice(p.price)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>

          {/* Main content */}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1}–
                {Math.min(page * perPage, filtered.length)} of {filtered.length} results
              </Typography>
              {/* Placeholder for sort dropdown in future */}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <ProductGrid products={pagedProducts} onAddToCart={handleAddToCart} />

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? 'contained' : 'outlined'}
                    color="primary"
                    size="small"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Container>


      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1300 }}>
        <Button
          component={RouterLink}
          to="/checkout"
          variant="contained"
          color="primary"
          disabled={cartItems.length === 0}
        >
          Go to Checkout
        </Button>
      </Box>

      <Cart
        open={cartOpen}
        onClose={handleCartClose}
        onRemove={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
      />
    </Box>
  );
};

export default ShopCategoryPage;
