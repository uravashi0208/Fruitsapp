import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Badge,
  useMediaQuery,
  Divider,
  ListItemIcon,
  Link,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FruitLogo from './FruitLogo';

const Header = ({ cartItems = [], onCartOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const navItems = [
    { name: 'Home', path: '/', icon: <HomeIcon /> },
    {
      name: 'Store',
      path: '/store',
      icon: <StoreIcon />,
    },
  ];

  const drawerList = (
    <Box sx={{ width: { xs: '100%', sm: 300 } }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FruitLogo size={35} />
          <Box sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component="span"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
            }}
          >
            Fresh Fruits
          </Typography>
        </Box>
        <IconButton onClick={toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ pt: 2 }}>
        {navItems.map((item) => (
          <React.Fragment key={item.name}>
            <ListItem
              button
              component="a"
              href={item.path}
              onClick={item.hasSubmenu ? null : toggleDrawer(false)}
              sx={{
                py: 1.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: '1rem',
                }}
              />
              {item.hasSubmenu && <KeyboardArrowDownIcon />}
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: '#e5e5e3',
        transition: 'all 0.3s ease',
        py: isScrolled ? { xs: 0.75, md: 1 } : { xs: 1.25, md: 1.5 },
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FruitLogo size={45} />
            <Box sx={{ mr: { xs: 1, md: 1.5 } }} />
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none',
                display: { xs: 'none', sm: 'block' },
                fontSize: { sm: '1.125rem', md: '1.25rem' },
              }}
            >
              Fresh Fruits
            </Typography>
          </Box>

          {isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="primary"
                aria-label="cart"
                onClick={onCartOpen}
                sx={{
                  mr: 1,
                  display: isSmall ? 'none' : 'flex',
                }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                >
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              <IconButton
                color="primary"
                aria-label="cart"
                onClick={onCartOpen}
                sx={{
                  mr: 1,
                  display: isSmall ? 'flex' : 'none',
                }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                >
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              <IconButton
                color="primary"
                aria-label="menu"
                edge="end"
                onClick={toggleDrawer(true)}
                sx={{
                  border: '1px solid',
                  borderColor: 'rgba(0, 0, 0, 0)',
                }}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                PaperProps={{
                  sx: {
                    width: { xs: '100%', sm: 300 },
                  },
                }}
              >
                {drawerList}
              </Drawer>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', mr: 3, alignItems: 'center' }}>
                {navItems.map((item) => (
                  <Typography
                    key={item.name}
                    component={Link}
                    href={item.path}
                    sx={{
                      color: 'text.primary',
                      mx: 2,
                      fontWeight: 500,
                      fontSize: '0.9375rem',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {item.name}
                  </Typography>
                ))}
              </Box>
              <IconButton
                color="primary"
                aria-label="cart"
                onClick={onCartOpen}
                sx={{
                  ml: 1,
                }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                >
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
