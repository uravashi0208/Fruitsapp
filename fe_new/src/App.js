import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Spinner from './components/Spinner';
import Home from './pages/Home/Home';
import Shop from './pages/Shop/Shop';
import { useSelector } from 'react-redux';
import './App.css';
import CartPage from './pages/Cart/Cart';

const theme = createTheme({
  palette: {
    primary: {
      main: '#81c408 ', // Custom primary color
    },
    secondary: {
      main: '#ffb524 ', // Custom secondary color
    },
  },
  typography: {
    fontFamily: '"Open Sans", "Raleway", "Arial", sans-serif',
  },
});

function App() {
  const [loading, setLoading] = useState(true);
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Spinner show={loading} />
        <Header cartItems={cartItems} />
        <main>
          {!loading && (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          )}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;