// ============================================================
// PRODUCT CARD
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Menu } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';
import { Product } from '../../types';
import { useCart, useWishlist } from '../../hooks/useCart';








// ── Animations ────────────────────────────────────────────────
const badgePop = keyframes`
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
`;

// ── Styled Components ─────────────────────────────────────────
const ProductWrap = styled.article`
  display: block;
  width: 100%;
  margin-bottom: 30px;
  position: relative;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  background: white;

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

const StatusBadge = styled.span`
  position: absolute;
  top: 0; left: 0;
  padding: 2px 10px;
  color: #fff;
  font-weight: ${theme.fontWeights.light};
  background: ${theme.colors.primary};
  font-size: 12px;
  z-index: 3;
  animation: ${badgePop} 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
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
  margin-bottom: 15px;
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

const ActionBtn = styled.button`
  color: #fff;
  background: ${theme.colors.primary};
  width: 40px; height: 40px;
  border-radius: 50%;
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  text-decoration: none;
  &:hover {
    background: ${theme.colors.primaryDark};
    transform: scale(1.1);
  }
`;

const WishActionBtn = styled(ActionBtn)<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? '#dc3545' : theme.colors.primary)};
  &:hover { background: ${({ $active }) => ($active ? '#c82333' : theme.colors.primaryDark)}; }
`;

// ── Component ─────────────────────────────────────────────────
export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <ProductWrap>
      <ImgProd>
        <ProductImg
          className="product-img"
          src={`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${product.image}`}
          alt={product.name}
          loading="lazy"
        />
        <ImgOverlay className="img-overlay" />
        {product.badge && <StatusBadge>{product.badge}</StatusBadge>}
      </ImgProd>

      <CardText>
        <ProductTitle>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </ProductTitle>

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
          {/* Quick View — using Link styled as button */}
          <ActionBtn
            as={Link as any}
            to={`/product/${product.id}`}
            title="Quick View"
            aria-label="Quick view"
          >
            <Menu />
          </ActionBtn>

          {/* Add to Cart */}
          <ActionBtn
            onClick={() => addItem(product)}
            title="Add to Cart"
            aria-label="Add to cart"
          >
            <ShoppingCart />
          </ActionBtn>

          {/* Wishlist */}
          <WishActionBtn
            $active={wishlisted}
            onClick={() => toggle(product)}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart />
          </WishActionBtn>
        </BottomArea>
      </CardText>
    </ProductWrap>
  );
};