import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Trash2, ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { useCart } from '../hooks/useCart';
import { isInStock } from '../store/cartSlice';
import { theme } from '../styles/theme';
import { Container, Section, Flex, Button, Divider, QuantityWrapper, QuantityBtn, QuantityNum } from '../styles/shared';
import { NewsletterSection } from '../components/ui/NewsletterSection';

const CartLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 40px;
  align-items: start;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: 1fr; }
`;

const CartTable = styled.div`
  background: white;
  border: 1px solid #f0f0f0;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 1fr 40px;
  gap: 16px;
  padding: 16px 20px;
  background: ${theme.colors.primary};
  span {
    font-size: 11px;
    font-weight: ${theme.fontWeights.medium};
    text-transform: uppercase;
    letter-spacing: 1px;
    color: white;
  }
  @media (max-width: ${theme.breakpoints.md}) { display: none; }
`;

const CartRow = styled.div<{ $unavailable?: boolean }>`
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 1fr 40px;
  gap: 16px;
  padding: 20px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  transition: ${theme.transitions.base};
  &:last-child { border-bottom: none; }
  &:hover { background: #f8f9fa; }
  ${({ $unavailable }) => $unavailable && `
    opacity: 0.7;
    background: #fff8f8;
    &:hover { background: #fff5f5; }
  `}
  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const ProductCol = styled(Flex)`gap: 16px;`;

const ProductThumb = styled.img`
  width: 72px; height: 72px;
  object-fit: cover;
  border: 1px solid #f0f0f0;
  flex-shrink: 0;
`;

const ProductName = styled.h3`
  font-size: 15px;
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textDark};
  margin-bottom: 2px;
`;

const ProductCat = styled.span`
  font-size: 12px;
  color: ${theme.colors.primary};
  text-transform: capitalize;
`;

const OutOfStockTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 2px 8px;
  margin-top: 4px;
`;

const StockWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #ea580c;
  font-weight: 500;
`;

const PriceCell = styled.span`
  font-size: 15px;
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textDark};
`;

const TotalCell = styled.span`
  font-size: 15px;
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.primary};
`;

const RemoveBtn = styled.button`
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid #dee2e6;
  color: ${theme.colors.text};
  cursor: pointer;
  transition: ${theme.transitions.base};
  &:hover { background: #dc3545; border-color: #dc3545; color: white; }
`;

const SummaryBox = styled.aside`
  background: white;
  border: 1px solid #f0f0f0;
  padding: 30px;
  position: sticky;
  top: 20px;
`;

const SummaryTitle = styled.h3`
  font-size: 18px;
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textDark};
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${theme.colors.primary};
`;

const SummaryRow = styled(Flex)`
  justify-content: space-between;
  margin-bottom: 12px;
  span:first-child { color: ${theme.colors.text}; font-size: 14px; }
  span:last-child { font-weight: ${theme.fontWeights.medium}; }
`;

const TotalRow = styled(SummaryRow)`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #f0f0f0;
  span:first-child { font-weight: ${theme.fontWeights.medium}; color: ${theme.colors.textDark}; font-size: 16px; }
  span:last-child { font-size: 20px; color: ${theme.colors.primary}; font-weight: ${theme.fontWeights.bold}; }
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 80px 20px;
  background: white;
  border: 1px solid #f0f0f0;
`;

const UnavailableBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #92400e;
`;

const CartPage: React.FC = () => {
  const { items, subtotal, shipping, total, removeItem, changeQty } = useCart();

  // Separate available vs unavailable items
  const unavailableItems = items.filter(i => !isInStock(i as any));
  const availableItems   = items.filter(i => isInStock(i as any));
  const hasUnavailable   = unavailableItems.length > 0;

  if (items.length === 0) {
    return (
      <main>
        <PageHero title="My Cart" breadcrumbs={[{ label: 'Cart' }]} />
        <Section>
          <Container>
            <EmptyCart>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
              <h2 style={{ fontSize: 24, marginBottom: 12 }}>Your cart is empty</h2>
              <p style={{ color: theme.colors.text, marginBottom: 24 }}>
                Looks like you haven't added any products yet.
              </p>
              <Button as={Link as any} to="/shop">
                <ShoppingBag size={16} /> Continue Shopping
              </Button>
            </EmptyCart>
          </Container>
        </Section>
      </main>
    );
  }

  return (
    <main>
      <PageHero title="My Cart" breadcrumbs={[{ label: 'Cart' }]} />

      <Section>
        <Container>
          {/* Out-of-stock warning banner */}
          {hasUnavailable && (
            <UnavailableBanner>
              <AlertTriangle size={16} color="#ea580c" style={{ flexShrink: 0 }} />
              <span>
                <strong>{unavailableItems.length} item{unavailableItems.length > 1 ? 's' : ''} in your cart
                {unavailableItems.length > 1 ? ' are' : ' is'} out of stock</strong> and cannot be checked out.
                Please remove {unavailableItems.length > 1 ? 'them' : 'it'} to proceed.
              </span>
            </UnavailableBanner>
          )}

          <CartLayout>
            <div>
              <CartTable>
                <TableHead>
                  <span>Product</span>
                  <span>Price</span>
                  <span>Quantity</span>
                  <span>Total</span>
                  <span />
                </TableHead>

                {items.map((item) => {
                  const inStock  = isInStock(item as any);
                  const maxStock = (item as any).stock as number | undefined;
                  const isLow    = inStock && maxStock !== undefined && maxStock <= 5;

                  return (
                    <CartRow key={item.id} $unavailable={!inStock}>
                      <ProductCol as="div">
                        <ProductThumb
                          src={item.image?.startsWith('http') ? item.image : `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${item.image}`}
                          alt={item.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `https://placehold.co/72x72/f1f8f1/82ae46?text=${item.name[0]}`;
                          }}
                          style={{ filter: inStock ? 'none' : 'grayscale(60%)' }}
                        />
                        <div>
                          <ProductName>{item.name}</ProductName>
                          <ProductCat>{item.category}</ProductCat>
                          {!inStock && (
                            <OutOfStockTag>
                              <AlertTriangle size={10} /> Out of Stock
                            </OutOfStockTag>
                          )}
                          {inStock && isLow && (
                            <StockWarning>
                              <AlertTriangle size={11} /> Only {maxStock} left
                            </StockWarning>
                          )}
                        </div>
                      </ProductCol>

                      <PriceCell>${item.price.toFixed(2)}</PriceCell>

                      <QuantityWrapper as="div">
                        <QuantityBtn
                          onClick={() => changeQty(item.id, item.quantity - 1)}
                          disabled={!inStock}
                        >−</QuantityBtn>
                        <QuantityNum style={{ color: inStock ? undefined : '#9ca3af' }}>
                          {item.quantity}
                        </QuantityNum>
                        <QuantityBtn
                          onClick={() => changeQty(item.id, item.quantity + 1)}
                          disabled={!inStock || (maxStock !== undefined && item.quantity >= maxStock)}
                        >+</QuantityBtn>
                      </QuantityWrapper>

                      <TotalCell style={{ color: inStock ? undefined : '#9ca3af' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </TotalCell>

                      <RemoveBtn onClick={() => removeItem(item.id)} aria-label="Remove item">
                        <Trash2 size={14} />
                      </RemoveBtn>
                    </CartRow>
                  );
                })}
              </CartTable>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
                <Button $variant="outline" as={Link as any} to="/shop">
                  ← Continue Shopping
                </Button>
                {hasUnavailable && (
                  <Button
                    $variant="outline"
                    style={{ borderColor: '#dc2626', color: '#dc2626' }}
                    onClick={() => unavailableItems.forEach(i => removeItem(i.id))}
                  >
                    <Trash2 size={14} /> Remove Out-of-Stock Items
                  </Button>
                )}
              </div>
            </div>

            {/* Summary */}
            <SummaryBox>
              <SummaryTitle>Order Summary</SummaryTitle>

              <SummaryRow as="div">
                <span>Subtotal ({availableItems.reduce((a, i) => a + i.quantity, 0)} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </SummaryRow>
              <SummaryRow as="div">
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? theme.colors.primary : undefined }}>
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </SummaryRow>

              {shipping > 0 && (
                <p style={{ fontSize: 12, color: theme.colors.text, marginBottom: 8 }}>
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}

              <TotalRow as="div">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </TotalRow>

              <Divider $my="20px" />

              <p style={{ fontSize: 13, color: theme.colors.text, marginBottom: 8 }}>🏷️ Have a coupon?</p>
              <div style={{ display: 'flex', gap: 0, borderRadius: 30, overflow: 'hidden', border: '1px solid #dee2e6' }}>
                <input
                  type="text"
                  placeholder="Coupon code"
                  style={{
                    flex: 1, padding: '10px 16px', border: 'none',
                    fontFamily: theme.fonts.body, fontSize: 13, outline: 'none',
                  }}
                />
                <button
                  style={{
                    padding: '10px 16px', background: theme.colors.primary,
                    color: 'white', border: 'none', fontFamily: theme.fonts.body,
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Apply
                </button>
              </div>

              <Button
                as={Link as any}
                to="/checkout"
                style={{
                  width: '100%', marginTop: 20, justifyContent: 'center',
                  opacity: hasUnavailable ? 0.6 : 1,
                  pointerEvents: hasUnavailable ? 'none' : 'auto',
                  background: hasUnavailable ? '#9ca3af' : undefined,
                }}
                title={hasUnavailable ? 'Remove out-of-stock items to proceed' : undefined}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </Button>

              {hasUnavailable && (
                <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 8 }}>
                  Remove out-of-stock items to checkout
                </p>
              )}
            </SummaryBox>
          </CartLayout>
        </Container>
      </Section>
      <NewsletterSection />
    </main>
  );
};

export default CartPage;
