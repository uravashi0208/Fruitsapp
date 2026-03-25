import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { ShoppingCart, Heart, Share2, CheckCircle, Truck, RefreshCw } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { ProductCard } from '../components/ui/ProductCard';
import { PRODUCTS } from '../data';
import { useCart, useWishlist } from '../hooks/useCart';
import { theme } from '../styles/theme';
import { Container, Section, Flex, Button, Divider, QuantityWrapper, QuantityBtn, QuantityNum } from '../styles/shared';
import { NewsletterSection } from '../components/ui/NewsletterSection';

const DetailLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: start;
  @media (max-width: ${theme.breakpoints.md}) { grid-template-columns: 1fr; gap: 30px; }
`;

const MainImage = styled.div`
  position: relative;
  overflow: hidden;
  img {
    width: 100%; aspect-ratio: 4/3;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
    &:hover { transform: scale(1.04); }
  }
`;

const BadgeSpan = styled.span`
  position: absolute; top: 12px; left: 12px;
  padding: 4px 12px;
  background: ${theme.colors.primary};
  color: white;
  font-size: 12px;
  font-weight: ${theme.fontWeights.light};
  border-radius: 2px;
  z-index: 2;
`;

const ThumbnailRow = styled(Flex)`
  gap: 8px; flex-wrap: wrap; margin-top: 12px;
`;

const Thumb = styled.button<{ $active: boolean }>`
  width: 72px; height: 72px;
  border: 2px solid ${({ $active }) => ($active ? theme.colors.primary : '#f0f0f0')};
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  background: none;
  transition: ${theme.transitions.base};
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  &:hover { border-color: ${theme.colors.primary}; }
`;

const ProductInfo = styled.div`position: sticky; top: 20px;`;

const ProductCategory = styled.span`
  font-size: 12px;
  color: ${theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 2px;
  display: block;
  margin-bottom: 8px;
`;

const ProductTitle = styled.h1`
  font-size: 28px;
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textDark};
  font-family: ${theme.fonts.body};
  margin-bottom: 12px;
  line-height: 1.3;
`;

const RatingRow = styled(Flex)`
  gap: 8px; margin-bottom: 16px;
`;

const Stars = styled.span`
  color: #ffc107; font-size: 16px;
`;

const ReviewCount = styled.span`
  font-size: 14px; color: ${theme.colors.text};
`;

const PriceBlock = styled.div`margin-bottom: 20px;`;

const MainPrice = styled.span`
  font-size: 28px;
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
`;

const OldPrice = styled.span`
  font-size: 18px;
  color: ${theme.colors.textLight};
  text-decoration: line-through;
  margin-left: 10px;
`;

const DiscountBadge = styled.span`
  margin-left: 10px;
  background: ${theme.colors.primary};
  color: white;
  padding: 2px 10px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: ${theme.fontWeights.light};
`;

const Desc = styled.p`
  font-size: 14px;
  color: ${theme.colors.text};
  line-height: 1.8;
  margin-bottom: 24px;
`;

const ActionRow = styled(Flex)`
  gap: 10px; flex-wrap: wrap; margin-bottom: 24px;
`;

const WishBtn = styled.button<{ $active: boolean }>`
  width: 48px; height: 48px;
  border-radius: 50%;
  border: 2px solid ${({ $active }) => ($active ? theme.colors.primary : '#dee2e6')};
  background: ${({ $active }) => ($active ? theme.colors.primary : 'white')};
  color: ${({ $active }) => ($active ? 'white' : theme.colors.text)};
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: ${theme.transitions.base};
  &:hover { background: ${theme.colors.primary}; border-color: ${theme.colors.primary}; color: white; }
`;

const ShareBtn = styled(WishBtn)<{ $active: boolean }>``;

const PerksBox = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border: 1px solid #f0f0f0;
`;

const PerkRow = styled(Flex)`
  gap: 10px; margin-bottom: 12px;
  &:last-child { margin-bottom: 0; }
  svg { color: ${theme.colors.primary}; flex-shrink: 0; }
  span { font-size: 13px; color: ${theme.colors.text}; }
`;

const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 20px;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const renderStars = (rating: number) =>
  '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const product = PRODUCTS.find((p) => p.id === Number(id));
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  if (!product) {
    return (
      <main>
        <PageHero title="Product Not Found" breadcrumbs={[{ label: 'Shop', to: '/shop' }]} />
        <Section>
          <Container>
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <h2 style={{ marginBottom: 16 }}>Product not found</h2>
              <Button as={Link as any} to="/shop">Back to Shop</Button>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  const thumbImages = [
    product.image,
    ...PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3).map((p) => p.image),
  ];
  const related = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addItem(product);
  };

  return (
    <main>
      <PageHero
        title={product.name}
        breadcrumbs={[{ label: 'Shop', to: '/shop' }, { label: product.name }]}
      />

      <Section>
        <Container>
          <Link
            to="/shop"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.colors.text, marginBottom: 30, textDecoration: 'none' }}
          >
            ← Back to Shop
          </Link>

          <DetailLayout>
            {/* Gallery */}
            <div>
              <MainImage>
                <img
                  src={thumbImages[activeImg]}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://placehold.co/600x450/f1f8f1/82ae46?text=${encodeURIComponent(product.name)}`;
                  }}
                />
                {product.badge && <BadgeSpan>{product.badge}</BadgeSpan>}
              </MainImage>
              <ThumbnailRow as="div">
                {thumbImages.map((img, i) => (
                  <Thumb key={i} $active={activeImg === i} onClick={() => setActiveImg(i)}>
                    <img src={img} alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/72x72/f1f8f1/82ae46?text=.'; }} />
                  </Thumb>
                ))}
              </ThumbnailRow>
            </div>

            {/* Info */}
            <ProductInfo>
              <ProductCategory>{product.category}</ProductCategory>
              <ProductTitle>{product.name}</ProductTitle>

              <RatingRow as="div">
                <Stars>{renderStars(product.rating)}</Stars>
                <ReviewCount>{product.rating} ({product.reviews} reviews)</ReviewCount>
              </RatingRow>

              <PriceBlock>
                <MainPrice>${product.price.toFixed(2)}</MainPrice>
                {product.originalPrice && (
                  <>
                    <OldPrice>${product.originalPrice.toFixed(2)}</OldPrice>
                    <DiscountBadge>{product.discount}% OFF</DiscountBadge>
                  </>
                )}
              </PriceBlock>

              <Desc>{product.description}</Desc>

              <Divider $my="20px" />

              <Flex as="div" $align="center" $gap="16px" style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: theme.fontWeights.medium, color: theme.colors.text }}>Quantity:</span>
                <QuantityWrapper as="div">
                  <QuantityBtn onClick={() => setQty((q) => Math.max(1, q - 1))}>−</QuantityBtn>
                  <QuantityNum>{qty}</QuantityNum>
                  <QuantityBtn onClick={() => setQty((q) => q + 1)}>+</QuantityBtn>
                </QuantityWrapper>
              </Flex>

              <ActionRow as="div">
                <Button onClick={handleAddToCart} style={{ flex: 1 }}>
                  <ShoppingCart size={16} /> Add to Cart
                </Button>
                <WishBtn
                  $active={isWishlisted(product.id)}
                  onClick={() => toggle(product)}
                  aria-label="Wishlist"
                >
                  <Heart size={18} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
                </WishBtn>
                <ShareBtn $active={false} aria-label="Share">
                  <Share2 size={18} />
                </ShareBtn>
              </ActionRow>

              <PerksBox>
                <PerkRow as="div"><Truck size={16} /><span>Free shipping on orders over $100</span></PerkRow>
                <PerkRow as="div"><RefreshCw size={16} /><span>30-day hassle-free returns</span></PerkRow>
                <PerkRow as="div"><CheckCircle size={16} /><span>Certified 100% organic produce</span></PerkRow>
              </PerksBox>
            </ProductInfo>
          </DetailLayout>
        </Container>
      </Section>

      {/* Related Products */}
      {related.length > 0 && (
        <Section>
          <Container>
            <h2 style={{ fontSize: 30, marginBottom: 40, fontWeight: theme.fontWeights.semibold }}>
              You May Also Like
            </h2>
            <RelatedGrid>
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </RelatedGrid>
          </Container>
        </Section>
      )}
      <NewsletterSection />
    </main>
  );
};

export default ProductDetailPage;
