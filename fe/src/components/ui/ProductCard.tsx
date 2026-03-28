// ============================================================
// PRODUCT CARD  — with full out-of-stock / low-stock UI
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Eye, AlertCircle } from 'lucide-react';
import styled, { keyframes, css } from 'styled-components';
import { theme } from '../../styles/theme';
import { Product } from '../../types';
import { useCart, useWishlist } from '../../hooks/useCart';
import { isInStock } from '../../store/cartSlice';

// ── Helpers ────────────────────────────────────────────────
const LOW_STOCK_QTY = 5;

const stockState = (p: Product): 'out' | 'low' | 'in' => {
  if (!isInStock(p)) return 'out';
  if ((p.stock ?? Infinity) <= LOW_STOCK_QTY) return 'low';
  return 'in';
};

// ── Animations ─────────────────────────────────────────────
const badgePop = keyframes`
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
`;

// ── Styled Components ──────────────────────────────────────
const ProductWrap = styled.article<{ $disabled: boolean }>`
  display: block;
  width: 100%;
  margin-bottom: 30px;
  position: relative;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  background: white;
  ${({ $disabled }) => $disabled && css`
    opacity: 0.75;
    filter: grayscale(40%);
  `}

  &:hover {
    box-shadow: 0px 7px 15px -5px rgba(0,0,0,0.07);
  }
  &:hover .pricing     { opacity: 0; }
  &:hover .bottom-area { opacity: 1; }
  &:hover .img-overlay { opacity: 0.15; }
  &:hover .product-img { transform: scale(1.1); }
`;

const ImgProd = styled.div`
  position: relative;
  display: block;
  overflow: hidden;
`;

const ProductImg = styled.img`
  width: 100%;
  height: 220px;
  object-fit: cover;
  transform: scale(1);
  transition: all 0.3s ease;
  display: block;
`;

const ImgOverlay = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  background: #82ae4600;
`;

// Out-of-stock diagonal ribbon overlay
const OutOfStockOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  pointer-events: none;
`;

const OutOfStockRibbon = styled.span`
  background: rgba(220, 38, 38, 0.92);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 6px 24px;
  transform: rotate(-30deg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
`;

const StatusBadge = styled.span<{ $type: 'promo' | 'new' | 'out' | 'low' }>`
  position: absolute;
  top: 0; left: 0;
  padding: 2px 10px;
  color: #fff;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.5px;
  z-index: 3;
  animation: ${badgePop} 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
  background: ${({ $type }) => ({
    promo: theme.colors.primary,
    new:   '#0ea5e9',
    out:   '#dc2626',
    low:   '#f97316',
  }[$type])};
`;

const CardText = styled.div`
  background: #fff;
  position: relative;
  width: 100%;
  padding: 11px 0px 18px;
  text-align: center;
`;

const ProductTitle = styled.h3`
  font-size: 14px;
  margin-bottom: 10px;
  font-weight: ${theme.fontWeights.light};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: ${theme.fonts.body};

  a {
    color: ${theme.colors.textDark};
    text-decoration: none;
    transition: all 0.3s ease;
    &:hover { color: ${theme.colors.primary}; }
  }
`;

// Low-stock indicator bar
const StockBar = styled.div`
  width: 80%;
  margin: 0 auto 10px;
  height: 3px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
`;

const StockFill = styled.div<{ $pct: number; $low: boolean }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $low }) => ($low ? '#f97316' : theme.colors.primary)};
  border-radius: 2px;
  transition: width 0.4s ease;
`;

const StockLabel = styled.span<{ $out: boolean; $low: boolean }>`
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  color: ${({ $out, $low }) => $out ? '#dc2626' : $low ? '#f97316' : '#16a34a'};
  animation: ${({ $out, $low }) => ($out || $low) ? css`${pulse} 2s ease infinite` : 'none'};
`;

const Pricing = styled.div`
  width: 100%;
  transition: all 0.3s ease;
  p {
    margin-bottom: 0;
    color: ${theme.colors.primary};
    font-weight: ${theme.fontWeights.normal};
    font-size: 15px;
  }
`;

const PriceDc = styled.span`
  text-decoration: line-through;
  color: ${theme.colors.textLight};
  margin-right: 6px;
  font-size: 13px;
`;

const PriceSale = styled.span`
  color: ${theme.colors.primary};
`;

const BottomArea = styled.div`
  position: absolute;
  bottom: 15px;
  left: 0; right: 0;
  opacity: 0;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  z-index: 4;
`;

const ActionBtn = styled.button<{ $disabled?: boolean }>`
  color: #fff;
  background: ${({ $disabled }) => $disabled ? '#9ca3af' : theme.colors.primary};
  width: 40px; height: 40px;
  border-radius: 50%;
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  font-size: 16px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  text-decoration: none;
  &:hover {
    background: ${({ $disabled }) => $disabled ? '#9ca3af' : theme.colors.primaryDark};
    transform: ${({ $disabled }) => $disabled ? 'none' : 'scale(1.1)'};
  }
`;

const WishActionBtn = styled(ActionBtn)<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? '#dc3545' : theme.colors.primary)};
  &:hover { background: ${({ $active }) => ($active ? '#c82333' : theme.colors.primaryDark)}; }
`;

// ── Component ──────────────────────────────────────────────
export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem, items } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted  = isWishlisted(product.id);
  const state       = stockState(product);
  const outOfStock  = state === 'out';
  const lowStock    = state === 'low';
  const stockNum    = product.stock ?? 0;
  const inCartQty   = items.find(i => i.id === product.id)?.quantity ?? 0;
  const pct         = Math.min(100, Math.max(0, (stockNum / Math.max(stockNum + inCartQty, 20)) * 100));

  const handleAddToCart = () => {
    if (!outOfStock) addItem(product);
  };

  const badge = (() => {
    if (outOfStock) return <StatusBadge $type="out">Out of Stock</StatusBadge>;
    if (lowStock)   return <StatusBadge $type="low">Only {stockNum} left!</StatusBadge>;
    if (product.badge) return <StatusBadge $type="promo">{product.badge}</StatusBadge>;
    if (product.isNew) return <StatusBadge $type="new">New</StatusBadge>;
    return null;
  })();

  return (
    <ProductWrap $disabled={outOfStock}>
      <ImgProd>
        <ProductImg
          className="product-img"
          src={
            product.image?.startsWith('http')
              ? product.image
              : `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${product.image}`
          }
          alt={product.name}
          loading="lazy"
        />
        <ImgOverlay className="img-overlay" />
        {badge}

        {outOfStock && (
          <OutOfStockOverlay>
            <OutOfStockRibbon>Out of Stock</OutOfStockRibbon>
          </OutOfStockOverlay>
        )}
      </ImgProd>

      <CardText>
        <ProductTitle>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </ProductTitle>

        {/* Stock bar — only show when stock info is available */}
        {product.stock !== undefined && (
          <>
            {!outOfStock && lowStock && (
              <StockBar>
                <StockFill $pct={pct} $low={lowStock} />
              </StockBar>
            )}
            <StockLabel $out={outOfStock} $low={lowStock}>
              {outOfStock
                ? '✕ Out of Stock'
                : lowStock
                  ? `⚠ Only ${stockNum} left`
                  : `✓ In Stock (${stockNum})`}
            </StockLabel>
          </>
        )}

        <Pricing className="pricing">
          <p>
            {product.originalPrice ? (
              <>
                <PriceDc>${product.originalPrice.toFixed(2)}</PriceDc>
                <PriceSale>${product.price.toFixed(2)}</PriceSale>
              </>
            ) : (
              <span>${product.price.toFixed(2)}</span>
            )}
          </p>
        </Pricing>

        <BottomArea className="bottom-area">
          {/* Quick View */}
          <ActionBtn
            as={Link as any}
            to={`/product/${product.id}`}
            title="Quick View"
            aria-label="Quick view"
          >
            <Eye size={16} />
          </ActionBtn>

          {/* Add to Cart */}
          <ActionBtn
            onClick={handleAddToCart}
            $disabled={outOfStock}
            title={outOfStock ? 'Out of stock' : 'Add to Cart'}
            aria-label={outOfStock ? 'Out of stock' : 'Add to cart'}
            aria-disabled={outOfStock}
          >
            {outOfStock ? <AlertCircle size={16} /> : <ShoppingCart size={16} />}
          </ActionBtn>

          {/* Wishlist */}
          <WishActionBtn
            $active={wishlisted}
            onClick={() => toggle(product)}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} />
          </WishActionBtn>
        </BottomArea>
      </CardText>
    </ProductWrap>
  );
};
