import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { GlobalStyles } from './styles/GlobalStyles';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastManager } from './components/ui/Toast';
import styled from 'styled-components';
import { WishlistPage, AboutPage, BlogPage, ContactPage } from './pages/OtherPages';
import { AdminRouter } from './admin/AdminRouter';
import ShippingPage from './pages/ShippingPage';
import TrackingPage from './pages/TrackingPage';
import ReturnsPage from './pages/ReturnsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

const HomePage          = lazy(() => import('./pages/HomePage'));
const ShopPage          = lazy(() => import('./pages/ShopPage'));
const CartPage          = lazy(() => import('./pages/CartPage'));
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const BlogDetailPage    = lazy(() => import('./pages/BlogDetailPage'));
const FaqPage           = lazy(() => import('./pages/FaqPage'));

const PageLoader = styled.div`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  &::after {
    content: '';
    width: 32px; height: 32px;
    border: 3px solid #e8f5e9;
    border-top-color: #82ae46;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
`;

const AppLayout = styled.div`display:flex;flex-direction:column;min-height:100vh;`;
const MainContent = styled.div`flex:1;`;

const StorefrontShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppLayout>
    <Navbar />
    <MainContent>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </MainContent>
    <Footer />
    <ToastManager />
  </AppLayout>
);

const App: React.FC = () => (
  <Provider store={store}>
    <GlobalStyles />
    <BrowserRouter>
      <Routes>
        {/* Admin panel — has its own Provider + Router inside */}
        <Route path="/admin/*" element={<AdminRouter />} />

        {/* Storefront */}
        <Route
          path="/*"
          element={
            <StorefrontShell>
              <Routes>
                <Route path="/"            element={<HomePage />} />
                <Route path="/shop"        element={<ShopPage />} />
                <Route path="/cart"        element={<CartPage />} />
                <Route path="/checkout"    element={<CheckoutPage />} />
                <Route path="/wishlist"    element={<WishlistPage />} />
                <Route path="/about"       element={<AboutPage />} />
                <Route path="/blog"        element={<BlogPage />} />
                <Route path="/blog/:id"    element={<Suspense fallback={<PageLoader />}><BlogDetailPage /></Suspense>} />
                <Route path="/contact"     element={<ContactPage />} />
                <Route path="/faq"         element={<Suspense fallback={<PageLoader />}><FaqPage /></Suspense>} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/shipping"    element={<ShippingPage />} />
                <Route path="/returns"     element={<ReturnsPage />} />
                <Route path="/terms"       element={<TermsPage />} />
                <Route path="/privacy"     element={<PrivacyPage />} />
                <Route path="/tracking"    element={<TrackingPage />} />
                <Route path="/tracking/:code" element={<TrackingPage />} />
                <Route path="*"            element={<HomePage />} />
              </Routes>
            </StorefrontShell>
          }
        />
      </Routes>
    </BrowserRouter>
  </Provider>
);

export default App;
