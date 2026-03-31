/**
 * src/pages/AccountPage.tsx
 * User account dashboard — Orders, Wishlist, Profile, Loyalty Points
 * Uses existing BE endpoints: /api/orders/my, /api/wishlist, /api/auth/me
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  ShoppingBag, Heart, User, LogOut, Star, Package,
  ChevronRight, Clock, CheckCircle, Truck, XCircle,
} from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { theme } from '../styles/theme';
import { Container, Section, Button } from '../styles/shared';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { ordersApi, cancelOrder, PlacedOrder } from '../api/storefront';
import { useAppDispatch, useAppSelector } from '../store';
import { showToast } from '../store/uiSlice';
import api, { getAccessToken } from '../api/client';
import { useAuth } from '../hooks/useAuth';

// ── Styled ─────────────────────────────────────────────────────────────────────
const Layout = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  align-items: start;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: 1fr; }
`;

const Sidebar = styled.aside`
  background: white;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  position: sticky;
  top: 20px;
`;

const UserInfo = styled.div`
  padding: 24px 20px;
  background: ${theme.colors.primary};
  color: white;
  text-align: center;
`;

const Avatar = styled.div`
  width: 64px; height: 64px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
  font-size: 24px; font-weight: 700;
`;

const NavList = styled.ul`list-style: none; padding: 8px 0;`;

const NavItem = styled.li<{ $active?: boolean }>`
  a, button {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 20px;
    font-size: 14px;
    color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.textDark};
    background: ${({ $active }) => $active ? '#f1f8f1' : 'transparent'};
    font-weight: ${({ $active }) => $active ? '600' : '400'};
    text-decoration: none;
    cursor: pointer;
    border: none;
    width: 100%;
    font-family: ${theme.fonts.body};
    transition: all 0.2s;
    border-left: 3px solid ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
    &:hover { background: #f8f9fa; color: ${theme.colors.primary}; }
  }
`;

const Content = styled.div``;

const Card = styled.div`
  background: white;
  border: 1px solid #f0f0f0;
  padding: 28px;
  margin-bottom: 20px;
`;

const CardTitle = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: ${theme.colors.textDark};
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${theme.colors.primary};
  display: flex; align-items: center; gap: 8px;
  svg { color: ${theme.colors.primary}; }
`;

const OrderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 12px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
  @media (max-width: ${theme.breakpoints.md}) { grid-template-columns: 1fr; }
`;

const OrderNum = styled.div`
  font-weight: 600; font-size: 14px; color: ${theme.colors.textDark};
  span { display: block; font-size: 12px; color: ${theme.colors.text}; font-weight: 400; margin-top: 2px; }
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600; text-transform: capitalize;
  ${({ $status }) => {
    const map: Record<string, string> = {
      delivered:  'background:#dcfce7;color:#166534;',
      shipped:    'background:#dbeafe;color:#1e40af;',
      processing: 'background:#fef9c3;color:#854d0e;',
      confirmed:  'background:#e0e7ff;color:#3730a3;',
      pending:    'background:#f3f4f6;color:#6b7280;',
      cancelled:  'background:#fee2e2;color:#991b1b;',
    };
    return map[$status] || 'background:#f3f4f6;color:#6b7280;';
  }}
`;

const statusIcon = (s: string) => {
  const map: Record<string, React.ReactNode> = {
    delivered:  <CheckCircle size={10} />,
    shipped:    <Truck size={10} />,
    processing: <Clock size={10} />,
    cancelled:  <XCircle size={10} />,
  };
  return map[s] || <Package size={10} />;
};

const CancelBtn = styled.button`
  padding: 5px 12px; border: 1px solid #dc2626; border-radius: 4px;
  background: white; color: #dc2626; font-size: 12px; font-weight: 500;
  cursor: pointer; font-family: ${theme.fonts.body};
  &:hover { background: #fee2e2; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const PointsBadge = styled.div`
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, ${theme.colors.primary}, #5cb85c);
  color: white; padding: 6px 16px; border-radius: 20px;
  font-size: 14px; font-weight: 700; margin-bottom: 12px;
  svg { opacity: 0.9; }
`;

const WishGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
`;

const WishCard = styled(Link)`
  text-decoration: none;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  img { width: 100%; height: 120px; object-fit: cover; display: block; }
  div { padding: 10px; font-size: 13px; font-weight: 500; color: ${theme.colors.textDark}; }
`;

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 6px;
  label { font-size: 13px; font-weight: 500; color: ${theme.colors.text}; }
  input {
    padding: 10px 14px; border: 1px solid #dee2e6; border-radius: 4px;
    font-family: ${theme.fonts.body}; font-size: 14px; outline: none;
    &:focus { border-color: ${theme.colors.primary}; }
  }
`;

const EmptyMsg = styled.div`
  text-align: center; padding: 40px 20px; color: ${theme.colors.text};
  p { margin-bottom: 16px; }
`;

type Tab = 'orders' | 'wishlist' | 'loyalty' | 'profile';

const AccountPage: React.FC = () => {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const wishItems  = useAppSelector(s => s.wishlist.items);
  const { openAuthModal, logout } = useAuth();

  const [tab,     setTab]     = useState<Tab>('orders');
  const [orders,  setOrders]  = useState<PlacedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState<{ name?: string; email?: string; phone?: string } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // loyalty (simple: count points from orders — or 0 if no loyalty endpoint)
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      openAuthModal('login');
      navigate('/');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [meRes, ordersRes] = await Promise.all([
          api.get<{ success: boolean; data: any }>('/api/auth/me'),
          ordersApi.myOrders(),
        ]);
        if (meRes.success) setUser(meRes.data);
        if (ordersRes.success) {
          setOrders(ordersRes.data);
          // Simple point estimate: 1pt per $1 on delivered orders
          const pts = ordersRes.data
            .filter((o: PlacedOrder) => o.status === 'delivered')
            .reduce((acc: number, o: PlacedOrder) => acc + Math.floor((o.total ?? 0)), 0);
          setPoints(pts);
        }
      } catch {
        dispatch(showToast({ message: 'Please log in to view your account', type: 'error' }));
        openAuthModal('login');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, dispatch, openAuthModal]);

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(orderId);
    try {
      await cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      dispatch(showToast({ message: 'Order cancelled successfully', type: 'success' }));
    } catch (e: any) {
      dispatch(showToast({ message: e.message || 'Could not cancel order', type: 'error' }));
    } finally {
      setCancelling(null);
    }
  };

  const initials = (name?: string) =>
    (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return (
    <main>
      <PageHero title="My Account" breadcrumbs={[{ label: 'Account' }]} />
      <Section><Container><div style={{ textAlign: 'center', padding: 80, color: theme.colors.text }}>Loading…</div></Container></Section>
    </main>
  );

  return (
    <main>
      <PageHero title="My Account" breadcrumbs={[{ label: 'Account' }]} />
      <Section>
        <Container>
          <Layout>
            {/* Sidebar */}
            <Sidebar>
              <UserInfo>
                <Avatar>{initials(user?.name)}</Avatar>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name || 'My Account'}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{user?.email}</div>
              </UserInfo>
              <NavList>
                {([
                  { id: 'orders',   icon: <ShoppingBag size={16} />, label: 'My Orders' },
                  { id: 'wishlist', icon: <Heart size={16} />,       label: 'Wishlist' },
                  { id: 'loyalty',  icon: <Star size={16} />,        label: 'Loyalty Points' },
                  { id: 'profile',  icon: <User size={16} />,        label: 'Profile' },
                ] as { id: Tab; icon: React.ReactNode; label: string }[]).map(item => (
                  <NavItem key={item.id} $active={tab === item.id}>
                    <button onClick={() => setTab(item.id)}>
                      {item.icon} {item.label}
                    </button>
                  </NavItem>
                ))}
                <NavItem>
                  <Link to="/tracking" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Truck size={16} /> Track Order
                  </Link>
                </NavItem>
              </NavList>
            </Sidebar>

            {/* Content */}
            <Content>
              {/* ── Orders ── */}
              {tab === 'orders' && (
                <Card>
                  <CardTitle><ShoppingBag size={18} /> My Orders ({orders.length})</CardTitle>
                  {orders.length === 0 ? (
                    <EmptyMsg>
                      <ShoppingBag size={40} color="#dee2e6" style={{ margin: '0 auto 12px' }} />
                      <p>You haven't placed any orders yet.</p>
                      <Button as={Link as any} to="/shop">Start Shopping</Button>
                    </EmptyMsg>
                  ) : orders.map(order => (
                    <OrderRow key={order.id}>
                      <OrderNum>
                        {order.orderNumber || order.id?.slice(0, 8)}
                        <span>{new Date(order.createdAt as string).toLocaleDateString()} · {order.items?.length ?? 0} item(s)</span>
                      </OrderNum>
                      <StatusBadge $status={order.status || 'pending'}>
                        {statusIcon(order.status || 'pending')} {order.status || 'pending'}
                      </StatusBadge>
                      <div style={{ fontWeight: 600, color: theme.colors.primary, fontSize: 14 }}>
                        ${((order as any).total ?? 0).toFixed(2)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Link
                          to={`/tracking/${(order as any).trackingCode || ''}`}
                          style={{ fontSize: 12, color: theme.colors.primary, display: 'flex', alignItems: 'center', gap: 3 }}
                        >
                          Track <ChevronRight size={12} />
                        </Link>
                        {!['shipped', 'delivered', 'cancelled'].includes(order.status || '') && (
                          <CancelBtn
                            onClick={() => handleCancel(order.id!)}
                            disabled={cancelling === order.id}
                          >
                            {cancelling === order.id ? '…' : 'Cancel'}
                          </CancelBtn>
                        )}
                      </div>
                    </OrderRow>
                  ))}
                </Card>
              )}

              {/* ── Wishlist ── */}
              {tab === 'wishlist' && (
                <Card>
                  <CardTitle><Heart size={18} /> My Wishlist ({wishItems.length})</CardTitle>
                  {wishItems.length === 0 ? (
                    <EmptyMsg>
                      <Heart size={40} color="#dee2e6" style={{ margin: '0 auto 12px' }} />
                      <p>Your wishlist is empty.</p>
                      <Button as={Link as any} to="/shop">Browse Products</Button>
                    </EmptyMsg>
                  ) : (
                    <WishGrid>
                      {wishItems.map(item => (
                        <WishCard key={item.id} to={`/product/${item.id}`}>
                          <img
                            src={item.image?.startsWith('http') ? item.image : `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${item.image}`}
                            alt={item.name}
                          />
                          <div>
                            {item.name}
                            <div style={{ color: theme.colors.primary, fontWeight: 700, marginTop: 4 }}>${item.price.toFixed(2)}</div>
                          </div>
                        </WishCard>
                      ))}
                    </WishGrid>
                  )}
                </Card>
              )}

              {/* ── Loyalty ── */}
              {tab === 'loyalty' && (
                <Card>
                  <CardTitle><Star size={18} /> Loyalty Points</CardTitle>
                  <PointsBadge><Star size={16} /> {points} Points</PointsBadge>
                  <p style={{ fontSize: 14, color: theme.colors.text, marginBottom: 20 }}>
                    You earn <strong>1 point per $1</strong> spent on delivered orders.
                    Redeem <strong>100 points = $1 discount</strong> at checkout.
                  </p>
                  <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '14px 18px', fontSize: 13, color: theme.colors.text }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Current balance</span><strong style={{ color: theme.colors.primary }}>{points} pts</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Estimated value</span><strong>${(points * 0.01).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Next reward at</span><strong>{Math.max(0, 100 - (points % 100))} pts away</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: theme.colors.textDark }}>How it works</div>
                    {[
                      ['🛒', 'Shop & earn 1pt per $1 on every delivered order'],
                      ['⭐', 'Accumulate 100+ points to redeem'],
                      ['💸', 'Apply points at checkout for instant discount'],
                    ].map(([icon, text]) => (
                      <div key={text} style={{ display: 'flex', gap: 10, fontSize: 13, color: theme.colors.text, marginBottom: 8 }}>
                        <span>{icon}</span><span>{text}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* ── Profile ── */}
              {tab === 'profile' && (
                <Card>
                  <CardTitle><User size={18} /> My Profile</CardTitle>
                  <FormGrid>
                    <FormGroup>
                      <label>Full Name</label>
                      <input defaultValue={user?.name || ''} readOnly />
                    </FormGroup>
                    <FormGroup>
                      <label>Email</label>
                      <input defaultValue={user?.email || ''} readOnly />
                    </FormGroup>
                    <FormGroup>
                      <label>Phone</label>
                      <input defaultValue={(user as any)?.phone || ''} readOnly />
                    </FormGroup>
                  </FormGrid>
                  <p style={{ fontSize: 12, color: theme.colors.text, marginTop: 12 }}>
                    To update your profile details, please contact support.
                  </p>
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                    <Button
                      $variant="outline"
                      style={{ borderColor: '#dc2626', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}
                      onClick={() => {
                        logout();
                        dispatch(showToast({ message: 'Logged out successfully', type: 'info' }));
                        navigate('/');
                      }}
                    >
                      <LogOut size={14} /> Logout
                    </Button>
                  </div>
                </Card>
              )}

              {/* Quick links */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Button as={Link as any} to="/shop" $variant="outline" style={{ fontSize: 13 }}>
                  Continue Shopping
                </Button>
                <Button as={Link as any} to="/tracking" $variant="outline" style={{ fontSize: 13 }}>
                  <Truck size={14} /> Track Order
                </Button>
              </div>
            </Content>
          </Layout>
        </Container>
      </Section>
      <NewsletterSection />
    </main>
  );
};

export default AccountPage;