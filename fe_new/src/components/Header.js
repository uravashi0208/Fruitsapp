import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Button,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingBag as ShoppingBagIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { NavLink } from 'react-router-dom';

const Header = ({ cartItems = [] }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? '#81c408' : 'rgb(0 0 0 / 51%)',
    fontSize: '16px',
    textDecoration: 'none',
  });

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: 'primary.main' }}>
        Fruitables
      </Typography>
      <List>
        <ListItem disablePadding>
          <ListItemText sx={{ textAlign: 'center' }}>
            <NavLink to="/" style={navLinkStyle}>Home</NavLink>
          </ListItemText>
        </ListItem>
        <ListItem disablePadding>
          <ListItemText sx={{ textAlign: 'center' }}>
            <NavLink to="/shop" style={navLinkStyle}>Shop</NavLink>
          </ListItemText>
        </ListItem>
        <ListItem disablePadding>
          <ListItemText sx={{ textAlign: 'center' }}>
            <NavLink to="/contact" style={navLinkStyle}>Contact</NavLink>
          </ListItemText>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ backgroundColor: 'white', color: 'text.primary', boxShadow: 0,p:2 }}>
        <Container sx={{ px: { xs: 0, sm: 2 } }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: '800', lineHeight:1.2, display: { xs: 'none', md: 'block' } }}>
              Fruitables
            </Typography>

            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' }, color: 'primary.main' }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Button component={NavLink} to="/" sx={{ textTransform: 'none' }} style={navLinkStyle}>Home</Button>
              <Button component={NavLink} to="/shop" sx={{ textTransform: 'none' }} style={navLinkStyle}>Shop</Button>
              <Button component={NavLink} to="/contact" sx={{ textTransform: 'none' }} style={navLinkStyle}>Contact</Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton sx={{  position: 'relative' }}  component={NavLink} to="/cart">
                <Badge badgeContent={cartItemCount} color="secondary">
                  <ShoppingBagIcon sx={{ fontSize: '1.5em', color: 'primary.main' }} />
                </Badge>
              </IconButton>
              <IconButton>
                <PersonIcon sx={{ fontSize: '1.5em', color: 'primary.main' }} />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Spacer for fixed header */}
      <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />
    </>
  );
};

export default Header;