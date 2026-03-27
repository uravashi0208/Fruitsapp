import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { adminStore } from './store';
import { login } from './store';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAdminSelector } from './store';
import { getAccessToken } from '../api/client';
import { adminAuthApi } from '../api/admin';

// ── Lazy pages ────────────────────────────────────────────────
const DashboardPage    = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductsPage           = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const AdminProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.AdminProductDetailPage })));
const CategoriesPage   = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const SlidersPage      = lazy(() => import('./pages/SlidersPage').then(m => ({ default: m.SlidersPage })));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage').then(m => ({ default: m.TestimonialsPage })));
const NewsletterPage   = lazy(() => import('./pages/NewsletterPage').then(m => ({ default: m.NewsletterPage })));
const UsersPage        = lazy(() => import('./pages/OtherAdminPages').then(m => ({ default: m.UsersPage })));
const OrdersPage    = lazy(() => import('./pages/OtherAdminPages').then(m => ({ default: m.OrdersPage })));
const InvoicePage    = lazy(() => import('./pages/InvoicePage').then(m => ({ default: m.InvoicePage })));
const CardsPage     = lazy(() => import('./pages/OtherAdminPages').then(m => ({ default: m.CardsPage })));
const ContactsPage  = lazy(() => import('./pages/OtherAdminPages').then(m => ({ default: m.ContactsPage })));
const BlogsPage     = lazy(() => import('./pages/OtherAdminPages').then(m => ({ default: m.BlogsPage })));
const SettingsPage  = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProfilePage   = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const WishlistPage  = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.AdminWishlistPage })));

// ── Spinner ───────────────────────────────────────────────────
const AdminLoader: React.FC = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '40vh', gap: 12, color: '#4CAF50',
    fontFamily: 'Inter, sans-serif', fontSize: 14,
  }}>
    <div style={{
      width: 28, height: 28,
      border: '3px solid #e8f5e9',
      borderTopColor: '#4CAF50',
      borderRadius: '50%',
      animation: 'adminSpin 0.75s linear infinite',
    }} />
    Loading…
  </div>
);

// ── Full-screen restore spinner (shown while checking token) ──
const RestoreLoader: React.FC = () => (
  <div style={{
    position: 'fixed', inset: 0,
    background: '#0f1117',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 16,
    zIndex: 9999,
  }}>
    <div style={{
      width: 40, height: 40,
      border: '3px solid rgba(76,175,80,0.2)',
      borderTopColor: '#4CAF50',
      borderRadius: '50%',
      animation: 'adminSpin 0.75s linear infinite',
    }} />
    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
      Checking session…
    </p>
  </div>
);

// ── Auth guard ────────────────────────────────────────────────
// Uses useSelector so it reacts to Redux state changes in real time
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAdminSelector(s => s.adminAuth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve the intended destination so we can redirect back after login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// ── Redirect already-logged-in users away from /login ─────────
const RedirectIfAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAdminSelector(s => s.adminAuth.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

// ── Session restore on app load ───────────────────────────────
// If a valid JWT is in sessionStorage, re-hydrate the Redux user from /me
const useRestoreSession = () => {
  const [checking, setChecking] = React.useState(true);

  useEffect(() => {
    const restore = async () => {
      const token = getAccessToken();
      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const res = await adminAuthApi.getMe();
        if (res.success && res.data) {
          adminStore.dispatch(
            login({
              id:    res.data.uid,
              name:  res.data.name,
              email: res.data.email,
              role:  res.data.role,
            })
          );
        }
      } catch {
        // Token invalid / expired — leave as unauthenticated
      } finally {
        setChecking(false);
      }
    };

    restore();
  }, []);

  return checking;
};

// ── Inner router (lives inside Provider so hooks work) ────────
const AdminRouterInner: React.FC = () => {
  const checking = useRestoreSession();

  // Show spinner while we verify the stored token
  if (checking) return <RestoreLoader />;

  return (
    <Routes>
      {/* Public — redirect to dashboard if already logged in */}
      <Route
        path="login"
        element={
          <RedirectIfAuth>
            <LoginPage />
          </RedirectIfAuth>
        }
      />
      <Route
        path="register"
        element={
          <RedirectIfAuth>
            <RegisterPage />
          </RedirectIfAuth>
        }
      />

      {/* Invoice — protected but rendered WITHOUT the AdminLayout (no sidebar/topbar) so print is clean */}
      <Route
        path="orders/:id/invoice"
        element={
          <RequireAuth>
            <Suspense fallback={<AdminLoader />}><InvoicePage /></Suspense>
          </RequireAuth>
        }
      />

      {/* Protected — redirect to login if NOT authenticated */}
      <Route path="/" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index           element={<Suspense fallback={<AdminLoader />}><DashboardPage /></Suspense>} />
        <Route path="products"      element={<Suspense fallback={<AdminLoader />}><ProductsPage /></Suspense>} />
        <Route path="products/:id"  element={<Suspense fallback={<AdminLoader />}><AdminProductDetailPage /></Suspense>} />
        <Route path="categories"    element={<Suspense fallback={<AdminLoader />}><CategoriesPage /></Suspense>} />
        <Route path="sliders"       element={<Suspense fallback={<AdminLoader />}><SlidersPage /></Suspense>} />
        <Route path="testimonials"  element={<Suspense fallback={<AdminLoader />}><TestimonialsPage /></Suspense>} />
        <Route path="newsletter"    element={<Suspense fallback={<AdminLoader />}><NewsletterPage /></Suspense>} />
        <Route path="orders"        element={<Suspense fallback={<AdminLoader />}><OrdersPage /></Suspense>} />
        <Route path="users"    element={<Suspense fallback={<AdminLoader />}><UsersPage /></Suspense>} />
        <Route path="cards"    element={<Suspense fallback={<AdminLoader />}><CardsPage /></Suspense>} />
        <Route path="contacts" element={<Suspense fallback={<AdminLoader />}><ContactsPage /></Suspense>} />
        <Route path="blogs"    element={<Suspense fallback={<AdminLoader />}><BlogsPage /></Suspense>} />
        <Route path="wishlist" element={<Suspense fallback={<AdminLoader />}><WishlistPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<AdminLoader />}><SettingsPage /></Suspense>} />
        <Route path="profile"  element={<Suspense fallback={<AdminLoader />}><ProfilePage /></Suspense>} />
      </Route>

      {/* Any unknown /admin/* path → dashboard (which will redirect to login if needed) */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

// ── Root export — wraps everything in the admin Redux Provider
export const AdminRouter: React.FC = () => (
  <Provider store={adminStore}>
    <AdminRouterInner />
  </Provider>
);