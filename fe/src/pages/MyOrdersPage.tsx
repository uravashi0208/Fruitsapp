/**
 * src/pages/MyOrdersPage.tsx
 * Guest order lookup by email — no login required
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHero } from '../components/ui/PageHero';
import { theme } from '../styles/theme';
import { Container, Section, Button } from '../styles/shared';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { lookupOrdersByEmail, PlacedOrder } from '../api/storefront';

const Wrapper = styled.div`
  max-width: 680px;
  margin: 0 auto;
`;

const SearchCard = styled.div`
  background: white;
  border: 1px solid #f0f0f0;
  padding: 40px;
  margin-bottom: 32px;
  text-align: center;
`;

const Icon = styled.div`
  width: 72px; height: 72px;
  border-radius: 50%;
  background: #f1f8f1;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
  svg { color: ${theme.colors.primary}; }
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: ${theme.colors.textDark};
  margin-bottom: 8px;
`;

const Sub = styled.p`
  font-size: 14px;
  color: ${theme.colors.text};
  margin-bottom: 28px;
`;

const InputRow = styled.div`
  display: flex;
  gap: 0;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
  input {
    flex: 1;
    padding: 12px 16px;
    border: none;
    font-family: ${theme.fonts.body};
    font-size: 14px;
    outline: none;
  }
  button {
    padding: 12px 20px;
    background: ${theme.colors.primary};
    border: none;
    color: white;
    cursor: pointer;
    font-family: ${theme.fonts.body};
    font-size: 14px;
    font-weight: 600;
    display: flex; align-items: center; gap: 6px;
    transition: background 0.2s;
    &:hover { background: ${theme.colors.primaryDark}; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
`;

const OrderCard = styled.div`
  background: white;
  border: 1px solid #f0f0f0;
  padding: 20px 24px;
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const OrderMeta = styled.div``;

const OrderNum = styled.div`
  font-weight: 700;
  font-size: 15px;
  color: ${theme.colors.textDark};
  margin-bottom: 4px;
`;

const OrderDate = styled.div`
  font-size: 12px;
  color: ${theme.colors.text};
`;

const StatusBadge = styled.span<{ $s: string }>`
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 600; text-transform: capitalize;
  ${({ $s }) => ({
    delivered:  'background:#dcfce7;color:#166534;',
    shipped:    'background:#dbeafe;color:#1e40af;',
    processing: 'background:#fef9c3;color:#854d0e;',
    confirmed:  'background:#e0e7ff;color:#3730a3;',
    pending:    'background:#f3f4f6;color:#6b7280;',
    cancelled:  'background:#fee2e2;color:#991b1b;',
  }[$s] || 'background:#f3f4f6;color:#6b7280;')}
`;

const statusIcon = (s: string) => ({
  delivered: <CheckCircle size={11} />,
  shipped:   <Truck size={11} />,
  processing:<Clock size={11} />,
  cancelled: <XCircle size={11} />,
}[s] || <Package size={11} />);

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  background: white;
  border: 1px solid #f0f0f0;
  color: ${theme.colors.text};
`;

const MyOrdersPage: React.FC = () => {
  const [email,   setEmail]   = useState('');
  const [orders,  setOrders]  = useState<PlacedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await lookupOrdersByEmail(email.trim());
      setOrders(res.success ? res.data : []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setOrders(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <PageHero title="Track My Orders" breadcrumbs={[{ label: 'My Orders' }]} />
      <Section>
        <Container>
          <Wrapper>
            <SearchCard>
              <Icon><Package size={32} /></Icon>
              <Title>Find Your Orders</Title>
              <Sub>Enter your email address to see all orders placed with that address — no account required.</Sub>

              <form onSubmit={handleSearch}>
                <InputRow>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={loading}>
                    <Search size={16} /> {loading ? 'Searching…' : 'Look Up'}
                  </button>
                </InputRow>
              </form>

              {error && (
                <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</p>
              )}
            </SearchCard>

            {/* Results */}
            {orders !== null && (
              <>
                {orders.length === 0 ? (
                  <EmptyState>
                    <Package size={40} color="#dee2e6" style={{ marginBottom: 12 }} />
                    <p style={{ fontWeight: 600, marginBottom: 6 }}>No orders found</p>
                    <p style={{ fontSize: 13 }}>No orders were found for <strong>{email}</strong>.</p>
                    <Button as={Link as any} to="/shop" style={{ marginTop: 16, display: 'inline-flex' }}>
                      Start Shopping
                    </Button>
                  </EmptyState>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: theme.colors.text, marginBottom: 16 }}>
                      Found <strong>{orders.length}</strong> order(s) for <strong>{email}</strong>
                    </p>
                    {orders.map(order => (
                      <OrderCard key={order.id}>
                        <OrderMeta>
                          <OrderNum>{order.orderNumber || `#${order.id?.slice(0, 8)}`}</OrderNum>
                          <OrderDate>
                            {new Date(order.createdAt as string).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                            {' · '}{order.items?.length ?? 0} item(s)
                            {' · '}${((order as any).total ?? 0).toFixed(2)}
                          </OrderDate>
                        </OrderMeta>
                        <StatusBadge $s={order.status || 'pending'}>
                          {statusIcon(order.status || 'pending')} {order.status || 'pending'}
                        </StatusBadge>
                        {(order as any).trackingCode && (
                          <Link
                            to={`/tracking/${(order as any).trackingCode}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 13, color: theme.colors.primary, fontWeight: 500,
                            }}
                          >
                            Track <ChevronRight size={14} />
                          </Link>
                        )}
                      </OrderCard>
                    ))}
                  </>
                )}
              </>
            )}
          </Wrapper>
        </Container>
      </Section>
      <NewsletterSection />
    </main>
  );
};

export default MyOrdersPage;
