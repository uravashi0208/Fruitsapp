import React, { useState, useEffect } from "react";
import {  useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Slider,
  Card,
  CardMedia,
  CardContent,
  Button,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ShopPageHeader from "./ShopPageHeader";
import { products } from '../../data/products';
import {
  addToCart,
} from '../../features/cart/slice/cartSlice';

const ITEMS_PER_PAGE = 6;

export default function FreshFruitsShop() {
  const [page, setPage] = useState(1);
   const dispatch = useDispatch();

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  // Compute price bounds from products
  const prices = products.map((p) => p.price);
  const minPrice = Math.floor(Math.min(...prices));
  const maxPrice = Math.ceil(Math.max(...prices));

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);

  // Apply filters
  const filteredProducts = products.filter((p) =>
    (selectedCategory === 'All' || p.category === selectedCategory) &&
    p.price >= priceRange[0] && p.price <= priceRange[1]
  );

  // Total pages and page clamping when filters change
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  useEffect(() => {
    // If current page exceeds total pages after filtering, clamp back
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  // Paginate filtered products
  const displayedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // const categoryCounts = products.reduce((acc, product) => {
  //   acc[product.category] = (acc[product.category] || 0) + 1;
  //   return acc;
  // }, {});

  // // Get categories that appear more than once
  // const commonCategories = Object.keys(categoryCounts).filter(
  //   (cat) => categoryCounts[cat] > 1
  // );

  
const categoryCounts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  // Show ALL categories (even if only 1 product)
  const allCategories = ['All', ...Object.keys(categoryCounts)];
  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
  };

  return (
    <>
    <ShopPageHeader title={'Shop'}/>
    <Box sx={{ py: 5, bgcolor: "#f8f9fa",px: { xs: 2, sm: 3, md: 40 }, }}>
        <Typography variant="h3" gutterBottom>
          Fresh fruits shop
        </Typography>

        {/* Search and Sort */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 95,
            mb: 4,
            
          }}
          // c0e284
        >
          <Box sx={{ flex: 1, display: "flex", border: "1px solid #ccc", borderRadius: 2.5,height:'58px' }}>
            <InputBase sx={{ flex: 1,p:1,"&:hover": { border: "1px solid #c0e284",borderTopLeftRadius:10,borderBottomLeftRadius:10,boxShadow:'rgba(129, 196, 8, 0.25) 0px 0px 0px 0.25rem',outline:0 }}} placeholder="keywords" />
            <IconButton type="button" sx={{ backgroundColor:'#e9ecef',borderRadius: 0,borderTopRightRadius:10,borderBottomRightRadius:10,p:1.5}}>
              <SearchIcon />
            </IconButton>
          </Box>

          <Box sx={{ minWidth: 200 }}>
            <FormControl fullWidth>
              <Typography>Default Sorting:</Typography>
              <Select defaultValue="Nothing" size="small">
                <MenuItem value="Nothing">Nothing</MenuItem>
                <MenuItem value="Popularity">Popularity</MenuItem>
                <MenuItem value="Organic">Organic</MenuItem>
                <MenuItem value="Fantastic">Fantastic</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Main layout: sidebar + products */}
        <Box sx={{
            display: "flex",
            gap: 4,
            alignItems: "flex-start",
          }}>
          {/* Sidebar */}
          <Box sx={{ width: 280, flexShrink: 0 }}>
            {/* Categories */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5">Categories</Typography>
              <Box sx={{ mt: 1 }}>
                {allCategories.map((cat,i) => (
                  <Box
                      key={i}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        py: 0.5,
                      }}
                    >
                      <Typography
                        onClick={() => { setSelectedCategory(cat); setPage(1); }}
                        sx={{
                          color: selectedCategory === cat ? '#2e7d32' : '#81c408',
                          fontWeight: selectedCategory === cat ? 700 : 400,
                          cursor:'pointer',
                          lineHeight:'30px',
                          "&:hover": { color:'#FFB524' }
                        }}
                      >
                        <i className="fas fa-apple-alt" /> {cat}
                      </Typography>
                      <Typography sx={{lineHeight:'30px'}}>({cat === 'All' ? products.length : categoryCounts[cat]})</Typography>
                    </Box>
                ))}
              </Box>
            </Box>

            {/* Price */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5">Price</Typography>
              <Slider
                value={priceRange}
                min={minPrice}
                max={maxPrice}
                onChange={(_, newValue) => { setPriceRange(newValue); setPage(1); }}
                valueLabelDisplay="auto"
                getAriaLabel={() => 'Price range'}
                valueLabelFormat={(v) => `$${v}`}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">${priceRange[0]}</Typography>
                <Button size="small" onClick={() => { setPriceRange([minPrice, maxPrice]); setSelectedCategory('All'); setPage(1); }}>Reset</Button>
                <Typography variant="body2">${priceRange[1]}</Typography>
              </Box>
            </Box>

            {/* Additional */}
            {/* <Box sx={{ mb: 3 }}>
              <Typography variant="h5">Additional</Typography>
              <RadioGroup>
                {["Organic", "Fresh", "Sales", "Discount", "Expired"].map(
                  (item, i) => (
                    <FormControlLabel
                      key={i}
                      value={item}
                      control={<Radio />}
                      label={item}
                      sx={{height:'35px'}}
                    />
                  )
                )}
              </RadioGroup>
            </Box> */}

            {/* Featured Products */}
            <Box>
              <Typography variant="h5">Featured products</Typography>
              {products.slice(0, 3).map((prod) => (
                <Box
                  key={prod.id}
                  sx={{ display: "flex", alignItems: "center", my: 2 }}
                >
                  <Box
                    component="img"
                    src={prod.image}
                    sx={{ width: 100, height: 100, borderRadius: 1, mr: 2 }}
                  />
                  <Box>
                    <Typography>{prod.name}</Typography>
                    <Box sx={{ display: "flex" }}>
                      {[0, 1, 2, 3].map((i) => (
                        <StarIcon key={i} fontSize="small" sx={{ color: "#ccc" }} />
                      ))}
                      <StarBorderIcon fontSize="small" />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Typography sx={{ fontWeight: "bold" }}>${prod.price}</Typography>
                      <Typography sx={{ textDecoration: "line-through", color: "red" }}>
                        ${(prod.price + 1.12).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Products */}
          <Box sx={{ flex: 1 }}>
            <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: 3,
                }}
              >
              {displayedProducts.map((prod) => (
                <Card key={prod.id} sx={{borderRadius:'15px',boxShadow:'none',"&:hover": { boxShadow:'0 0 55px rgba(0, 0, 0, 0.4)' }}}>
                  <Box sx={{ position: "relative" }}>
                    <CardMedia component="img" image={prod.image} alt={prod.name} sx={{height:'230px',"&:hover": { transform:'scale(1.3)',transition:'0.7s' }}}/>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        bgcolor: "secondary.main",
                        color: "#fff",
                        px: 1,
                        borderRadius: 1,
                      }}
                    >
                      {prod.category}
                    </Box>
                  </Box>
                  <CardContent sx={{border:'1px solid #ffb524',borderTop:0}}>
                    <Typography variant="h5" sx={{color:'#45595b',fontWeight:600}}>{prod.name}</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod te incididunt
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold",color:'#45595b' }}>${prod.price} / kg</Typography>
                      <Button variant="outlined" startIcon={<ShoppingBagIcon />} sx={{borderRadius:'50px',border:'1px solid #ffb524 ',fontWeight:700,"&:hover": { background:'#FFB524' ,color:'#fff'}}} onClick={() => handleAddToCart(prod)}>
                        Add to cart
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Pagination */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handleChangePage}
              />
            </Box>
          </Box>
        </Box>
    </Box>
    </>
  );
}
