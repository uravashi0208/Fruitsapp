import React, { useState, useEffect, useCallback } from 'react';
import { springPop as badgePop } from '../styles/animations';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { ShoppingCart, Heart, Share2, CheckCircle, Truck, RefreshCw, Star, Send, User, AlertCircle } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { ProductCard } from '../components/ui/ProductCard';
import { useProduct, useProducts } from '../hooks/useApi';
import { ApiProduct, reviewsApi, ApiReview } from '../api/storefront';
import { getAccessToken } from '../api/client';
import { useCart, useWishlist } from '../hooks/useCart';
import { isInStock } from '../store/cartSlice';
import { theme } from '../styles/theme';
import {
  Container, Section, Flex, Button, Divider,
  QuantityWrapper, QuantityBtn, QuantityNum,
} from '../styles/shared';
import { NewsletterSection } from '../components/ui/NewsletterSection';

const resolveImg = (url: string) =>
  url?.startsWith('http') ? url : `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${url}`;

const renderStars = (rating: number) =>
  '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

const decodeToken = (token: string): { name?: string; id?: string } | null => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
};

const LOW_STOCK = 5;

// ── Styled ─────────────────────────────────────────────────

const DetailLayout = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start;
  @media (max-width: ${theme.breakpoints.md}) { grid-template-columns: 1fr; gap: 30px; }
`;
const MainImage = styled.div`
  position: relative; overflow: hidden;
  img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; transition: transform 0.4s ease; &:hover { transform: scale(1.04); } }
`;

const BadgeSpan = styled.span`
  position: absolute; top: 0px; left: 0px; padding: 4px 12px;
  background: ${theme.colors.primary}; color: white; font-size: 14px;
  font-weight: ${theme.fontWeights.light}; border-radius: 2px; z-index: 2;
  animation: ${badgePop} 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
`;

const OutOfStockBadge = styled.span`
  position: absolute; top: 0px; left: 0px; padding: 4px 12px;
  background: #dc2626; color: white; font-size: 14px;
  font-weight: 600; border-radius: 2px; z-index: 2;
  animation: ${badgePop} 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
`;

const LowStockBadge = styled.span`
  position: absolute; top: 0px; left: 0px; padding: 4px 12px;
  background: #f97316; color: white; font-size: 14px;
  font-weight: 600; border-radius: 2px; z-index: 2;
  animation: ${badgePop} 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
`;

const ThumbnailRow = styled(Flex)`gap: 8px; flex-wrap: wrap; margin-top: 12px;`;
const Thumb = styled.button<{ $active: boolean }>`
  width: 72px; height: 72px;
  border: 2px solid ${({ $active }) => ($active ? theme.colors.primary : '#f0f0f0')};
  overflow: hidden; cursor: pointer; padding: 0; background: none; transition: ${theme.transitions.base};
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  &:hover { border-color: ${theme.colors.primary}; }
`;
const ProductInfo = styled.div`position: sticky; top: 20px;`;
const ProductCategory = styled.span`
  font-size: 12px; color: ${theme.colors.primary}; text-transform: uppercase;
  letter-spacing: 2px; display: block; margin-bottom: 8px;
`;
const ProductTitle = styled.h1`
  font-size: 28px; font-weight: ${theme.fontWeights.medium}; color: ${theme.colors.textDark};
  font-family: ${theme.fonts.body}; margin-bottom: 12px; line-height: 1.3;
`;
const RatingRow   = styled(Flex)`gap: 8px; margin-bottom: 16px;`;
const Stars       = styled.span`color: #ffc107; font-size: 16px;`;
const ReviewCount = styled.span`font-size: 14px; color: ${theme.colors.text};`;
const PriceBlock  = styled.div`margin-bottom: 20px;`;
const MainPrice   = styled.span`font-size: 28px; font-weight: ${theme.fontWeights.bold}; color: ${theme.colors.primary};`;
const OldPrice    = styled.span`font-size: 18px; color: ${theme.colors.textLight}; text-decoration: line-through; margin-left: 10px;`;
const DiscountBadge = styled.span`
  margin-left: 10px; background: ${theme.colors.primary}; color: white;
  padding: 2px 10px; border-radius: 30px; font-size: 12px; font-weight: ${theme.fontWeights.light};
`;
const Desc      = styled.p`font-size: 14px; color: ${theme.colors.text}; line-height: 1.8; margin-bottom: 24px;`;
const ActionRow = styled(Flex)`gap: 10px; flex-wrap: wrap; margin-bottom: 24px;`;
const WishBtn   = styled.button<{ $active: boolean }>`
  width: 48px; height: 48px; border-radius: 50%;
  border: 2px solid ${({ $active }) => ($active ? theme.colors.primary : '#dee2e6')};
  background: ${({ $active }) => ($active ? theme.colors.primary : 'white')};
  color: ${({ $active }) => ($active ? 'white' : theme.colors.text)};
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: ${theme.transitions.base};
  &:hover { background: ${theme.colors.primary}; border-color: ${theme.colors.primary}; color: white; }
`;
const ShareBtn  = styled(WishBtn)<{ $active: boolean }>``;
const PerksBox  = styled.div`background: #f8f9fa; padding: 20px; border: 1px solid #f0f0f0;`;
const PerkRow   = styled(Flex)`
  gap: 10px; margin-bottom: 12px; &:last-child { margin-bottom: 0; }
  svg { color: ${theme.colors.primary}; flex-shrink: 0; }
  span { font-size: 13px; color: ${theme.colors.text}; }
`;
const RelatedGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0 20px;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;
const SkeletonBox = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px; 100% { background-position: -200% 0; } }
`;

/* ── Review Styles ── */
const ReviewsSection      = styled.div`margin-top: 60px; padding-top: 40px; border-top: 1px solid #e9ecef;`;
const ReviewsSectionTitle = styled.h2`font-size: 26px; font-weight: ${theme.fontWeights.semibold}; color: ${theme.colors.textDark}; margin-bottom: 32px;`;
const ReviewFormBox       = styled.div`background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 28px; margin-bottom: 40px;`;
const FormTitle           = styled.h3`font-size: 17px; font-weight: ${theme.fontWeights.medium}; color: ${theme.colors.textDark}; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;`;
const StarRatingInput     = styled.div`display: flex; gap: 4px; margin-bottom: 16px;`;
const StarBtn             = styled.button<{ $filled: boolean }>`
  background: none; border: none; cursor: pointer; padding: 2px; font-size: 30px; line-height: 1;
  color: ${({ $filled }) => ($filled ? '#ffc107' : '#dee2e6')}; transition: color 0.15s, transform 0.1s;
  &:hover { transform: scale(1.15); }
`;
const FormInput           = styled.input`
  width: 100%; padding: 10px 14px; border: 1px solid #dee2e6; border-radius: 6px;
  font-size: 14px; font-family: ${theme.fonts.body}; color: ${theme.colors.textDark};
  background: white; outline: none; transition: border-color 0.2s; margin-bottom: 12px; box-sizing: border-box;
  &:focus { border-color: ${theme.colors.primary}; } &::placeholder { color: #adb5bd; }
`;
const FormTextarea        = styled.textarea`
  width: 100%; padding: 10px 14px; border: 1px solid #dee2e6; border-radius: 6px;
  font-size: 14px; font-family: ${theme.fonts.body}; color: ${theme.colors.textDark};
  background: white; outline: none; resize: vertical; min-height: 100px; transition: border-color 0.2s;
  margin-bottom: 16px; box-sizing: border-box;
  &:focus { border-color: ${theme.colors.primary}; } &::placeholder { color: #adb5bd; }
`;
const FormError           = styled.p`color: #dc3545; font-size: 13px; margin: -8px 0 12px;`;
const FormSuccess         = styled.p`color: #198754; font-size: 14px; font-weight: ${theme.fontWeights.medium}; background: #d1e7dd; border: 1px solid #a3cfbb; border-radius: 6px; padding: 10px 14px;`;
const GuestLabel          = styled.span`font-size: 12px; color: #6c757d; background: #e9ecef; border-radius: 4px; padding: 2px 8px; margin-left: 8px;`;
const ReviewsList         = styled.div`display: flex; flex-direction: column; gap: 20px;`;
const ReviewCard          = styled.div`border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; background: white;`;
const ReviewHeader        = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;`;
const ReviewerInfo        = styled.div`display: flex; align-items: center; gap: 10px;`;
const ReviewerAvatar      = styled.div`
  width: 38px; height: 38px; border-radius: 50%; background: ${theme.colors.primary}20;
  color: ${theme.colors.primary}; display: flex; align-items: center; justify-content: center;
  font-weight: ${theme.fontWeights.medium}; font-size: 15px; flex-shrink: 0;
`;
const ReviewerName        = styled.span`font-weight: ${theme.fontWeights.medium}; color: ${theme.colors.textDark}; font-size: 14px;`;
const ReviewDate          = styled.span`font-size: 12px; color: ${theme.colors.textLight};`;
const ReviewStars         = styled.span`color: #ffc107; font-size: 14px; letter-spacing: 1px;`;
const ReviewComment       = styled.p`font-size: 14px; color: ${theme.colors.text}; line-height: 1.7; margin: 0;`;
const PaginationRow       = styled.div`display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 28px;`;
const PageBtn             = styled.button<{ $active?: boolean }>`
  width: 36px; height: 36px; border-radius: 6px;
  border: 1px solid ${({ $active }) => ($active ? theme.colors.primary : '#dee2e6')};
  background: ${({ $active }) => ($active ? theme.colors.primary : 'white')};
  color: ${({ $active }) => ($active ? 'white' : theme.colors.text)};
  font-size: 14px; cursor: pointer; transition: all 0.2s;
  &:hover:not(:disabled) { border-color: ${theme.colors.primary}; color: ${theme.colors.primary}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
const NoReviews = styled.div`text-align: center; padding: 40px 20px; color: ${theme.colors.textLight}; font-size: 15px;`;

// ── Helpers ─────────────────────────────────────────────────
const toCartProduct = (p: ApiProduct) => ({
  id: p.id as any, name: p.name, category: p.category as any, price: p.price,
  originalPrice: p.originalPrice, discount: p.discount, image: p.image,
  description: p.description, stock: p.stock, sku: p.sku, badge: p.badge,
  isNew: p.isNew, rating: p.rating, reviews: p.reviews,
  status: p.status as any,
});

/* ── ReviewForm ── */
const ReviewForm: React.FC<{ productId: string; onSubmitted: () => void }> = ({ productId, onSubmitted }) => {
  const token      = getAccessToken();
  const userData   = token ? decodeToken(token) : null;
  const isLoggedIn = !!token && !!userData;

  const [rating,     setRating]     = useState(0);
  const [hovered,    setHovered]    = useState(0);
  const [comment,    setComment]    = useState('');
  const [guestName,  setGuestName]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!isLoggedIn && !guestName.trim()) { setError('Please enter your name.'); return; }
    setSubmitting(true);
    try {
      await reviewsApi.submit(productId, { rating, comment: comment.trim(), guestName: isLoggedIn ? undefined : guestName.trim() });
      setSuccess(true);
      setRating(0); setComment(''); setGuestName('');
      setTimeout(() => { setSuccess(false); onSubmitted(); }, 2000);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit review. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (success) return <FormSuccess>✓ Thank you! Your review has been submitted.</FormSuccess>;

  return (
    <ReviewFormBox>
      <FormTitle>
        <Star size={18} color={theme.colors.primary} fill={theme.colors.primary} />
        Write a Review
        {isLoggedIn && <GuestLabel>Logged in as {userData?.name || 'User'}</GuestLabel>}
      </FormTitle>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 13, color: theme.colors.text, marginBottom: 6, display: 'block' }}>
          Your Rating <span style={{ color: '#dc3545' }}>*</span>
        </label>
        <StarRatingInput>
          {[1,2,3,4,5].map(n => (
            <StarBtn key={n} type="button" $filled={n <= (hovered || rating)}
              onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)} aria-label={`${n} star`}>★</StarBtn>
          ))}
        </StarRatingInput>
      </div>
      {!isLoggedIn && (
        <>
          <label style={{ fontSize: 13, color: theme.colors.text, marginBottom: 6, display: 'block' }}>
            Your Name <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <FormInput placeholder="Enter your name" value={guestName} onChange={e => setGuestName(e.target.value)} />
        </>
      )}
      <label style={{ fontSize: 13, color: theme.colors.text, marginBottom: 6, display: 'block' }}>
        Your Review <span style={{ color: '#adb5bd' }}>(optional)</span>
      </label>
      <FormTextarea placeholder="Share your experience with this product…" value={comment} onChange={e => setComment(e.target.value)} />
      {error && <FormError>{error}</FormError>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Button onClick={handleSubmit} disabled={submitting} style={{ minWidth: 140, opacity: submitting ? 0.7 : 1 }}>
          <Send size={15} /> {submitting ? 'Submitting…' : 'Submit Review'}
        </Button>
        {!isLoggedIn && (
          <span style={{ fontSize: 12, color: theme.colors.textLight }}>
            Posting as guest.{' '}
            <Link to="/login" style={{ color: theme.colors.primary }}>Log in</Link> to post with your account.
          </span>
        )}
      </div>
    </ReviewFormBox>
  );
};

/* ── ReviewItem ── */
const ReviewItem: React.FC<{ review: ApiReview }> = ({ review }) => {
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  return (
    <ReviewCard>
      <ReviewHeader>
        <ReviewerInfo>
          <ReviewerAvatar>{(review.userName || 'G').slice(0, 1).toUpperCase()}</ReviewerAvatar>
          <div>
            <ReviewerName>{review.userName}</ReviewerName>
            {review.isGuest && <GuestLabel>Guest</GuestLabel>}
            <ReviewDate style={{ display: 'block', marginTop: 2 }}>{date}</ReviewDate>
          </div>
        </ReviewerInfo>
        <ReviewStars>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</ReviewStars>
      </ReviewHeader>
      {review.comment && <ReviewComment>{review.comment}</ReviewComment>}
    </ReviewCard>
  );
};

/* ── ReviewsBlock ── */
const REVIEWS_PER_PAGE = 5;
const ReviewsBlock: React.FC<{ productId: string; refreshKey: number }> = ({ productId, refreshKey }) => {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const totalPages = Math.ceil(total / REVIEWS_PER_PAGE);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await reviewsApi.list(productId, { page: p, limit: REVIEWS_PER_PAGE });
      if (res.success) { setReviews(res.data); setTotal(res.pagination?.total ?? 0); }
    } catch { } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { setPage(1); load(1); }, [load, refreshKey]);

  const goTo = (p: number) => { setPage(p); load(p); };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1,2,3].map(i => <SkeletonBox key={i} style={{ height: 90 }} />)}
    </div>
  );

  if (!reviews.length) return (
    <NoReviews>
      <User size={40} style={{ opacity: 0.25, marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
      <div>No reviews yet. Be the first to review this product!</div>
    </NoReviews>
  );

  return (
    <>
      <ReviewsList>{reviews.map(r => <ReviewItem key={r.id} review={r} />)}</ReviewsList>
      {totalPages > 1 && (
        <PaginationRow>
          <PageBtn onClick={() => goTo(page - 1)} disabled={page === 1}>‹</PageBtn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <PageBtn key={p} $active={p === page} onClick={() => goTo(p)}>{p}</PageBtn>
          ))}
          <PageBtn onClick={() => goTo(page + 1)} disabled={page === totalPages}>›</PageBtn>
        </PaginationRow>
      )}
    </>
  );
};

/* ── Main Page ── */
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, loading, error } = useProduct(id ?? null);
  const { data: allProducts } = useProducts({ limit: 20 });
  const [qty, setQty]             = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewKey, setReviewKey] = useState(0);
  const { addItem }               = useCart();
  const { isWishlisted, toggle }  = useWishlist();

  if (loading) return (
    <main>
      <PageHero title="Loading…" breadcrumbs={[{ label: 'Shop', to: '/shop' }]} />
      <Section><Container>
        <DetailLayout>
          <SkeletonBox style={{ width: '100%', aspectRatio: '4/3' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonBox style={{ height: 14, width: '40%' }} />
            <SkeletonBox style={{ height: 32, width: '80%' }} />
            <SkeletonBox style={{ height: 20, width: '30%' }} />
            <SkeletonBox style={{ height: 36, width: '50%' }} />
            <SkeletonBox style={{ height: 80, width: '100%' }} />
            <SkeletonBox style={{ height: 48, width: '100%' }} />
          </div>
        </DetailLayout>
      </Container></Section>
    </main>
  );

  if (error || !product) return (
    <main>
      <PageHero title="Product Not Found" breadcrumbs={[{ label: 'Shop', to: '/shop' }]} />
      <Section><Container>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h2 style={{ marginBottom: 16 }}>Product not found</h2>
          <Button as={Link as any} to="/shop">Back to Shop</Button>
        </div>
      </Container></Section>
    </main>
  );

  // ── Derived stock state (all based on cartProduct which is typed correctly) ──
  const cartProduct    = toCartProduct(product);
  const mainImageUrl   = resolveImg(product.image);
  const wishlisted     = isWishlisted(product.id as any);
  const productInStock = isInStock(cartProduct as any);
  const stockNum       = product.stock ?? 0;
  const isLowStock     = productInStock && stockNum > 0 && stockNum <= LOW_STOCK;
  const related = (allProducts ?? [])
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4).map(toCartProduct);

  // ── Image badge — pick exactly one ──────────────────────
  const imageBadge = !productInStock
    ? <OutOfStockBadge>Out of Stock</OutOfStockBadge>
    : isLowStock
      ? <LowStockBadge>Only {stockNum} left!</LowStockBadge>
      : product.badge
        ? <BadgeSpan>{product.badge}</BadgeSpan>
        : null;

  return (
    <main>
      <PageHero title={product.name} breadcrumbs={[{ label: 'Shop', to: '/shop' }, { label: product.name }]} />

      <Section>
        <Container>
          <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.colors.text, marginBottom: 30, textDecoration: 'none' }}>
            ← Back to Shop
          </Link>

          <DetailLayout>
            {/* Gallery */}
            <div>
              <MainImage>
                <img src={mainImageUrl} alt={product.name}
                  onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/600x450/f1f8f1/82ae46?text=${encodeURIComponent(product.name)}`; }} />
                {imageBadge}
              </MainImage>
              <ThumbnailRow as="div">
                <Thumb $active={activeImg === 0} onClick={() => setActiveImg(0)}>
                  <img src={mainImageUrl} alt={product.name}
                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/72x72/f1f8f1/82ae46?text=.'; }} />
                </Thumb>
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
                  <><OldPrice>${product.originalPrice.toFixed(2)}</OldPrice>
                  {product.discount && <DiscountBadge>{product.discount}% OFF</DiscountBadge>}</>
                )}
              </PriceBlock>
              <Desc>{product.description || 'No description available.'}</Desc>

              <Divider $my="20px" />
              <Flex as="div" $align="center" $gap="16px" style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: theme.fontWeights.medium, color: theme.colors.text }}>Quantity:</span>
                <QuantityWrapper as="div">
                  <QuantityBtn
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={!productInStock}
                  >−</QuantityBtn>
                  <QuantityNum>{qty}</QuantityNum>
                  <QuantityBtn
                    onClick={() => setQty(q => Math.min(q + 1, productInStock ? (product.stock ?? 99) : 1))}
                    disabled={!productInStock || qty >= (product.stock ?? 99)}
                  >+</QuantityBtn>
                </QuantityWrapper>
                {productInStock && product.stock !== undefined && (
                  <span style={{ fontSize: 12, color: theme.colors.textLight }}>
                    max {product.stock}
                  </span>
                )}
              </Flex>
              <ActionRow as="div">
                <Button
                  onClick={() => {
                    if (!productInStock) return;
                    for (let i = 0; i < qty; i++) addItem(cartProduct);
                  }}
                  disabled={!productInStock}
                  style={{
                    flex: 1,
                    opacity: productInStock ? 1 : 0.6,
                    cursor: productInStock ? 'pointer' : 'not-allowed',
                    background: !productInStock ? '#9ca3af' : undefined,
                  }}
                >
                  {productInStock
                    ? <><ShoppingCart size={16} /> Add to Cart</>
                    : <><AlertCircle size={16} /> Out of Stock</>}
                </Button>
                <WishBtn $active={wishlisted} onClick={() => toggle(cartProduct)} aria-label="Wishlist">
                  <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
                </WishBtn>
                <ShareBtn $active={false} aria-label="Share"><Share2 size={18} /></ShareBtn>
              </ActionRow>
              <PerksBox>
                <PerkRow as="div"><Truck size={16} /><span>Free shipping on orders over $100</span></PerkRow>
                <PerkRow as="div"><RefreshCw size={16} /><span>30-day hassle-free returns</span></PerkRow>
                <PerkRow as="div"><CheckCircle size={16} /><span>Certified 100% organic produce</span></PerkRow>
              </PerksBox>
            </ProductInfo>
          </DetailLayout>

          {/* Reviews */}
          <ReviewsSection>
            <ReviewsSectionTitle>Customer Reviews</ReviewsSectionTitle>
            <ReviewForm productId={product.id} onSubmitted={() => setReviewKey(k => k + 1)} />
            <ReviewsBlock productId={product.id} refreshKey={reviewKey} />
          </ReviewsSection>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section>
          <Container>
            <h2 style={{ fontSize: 30, marginBottom: 40, fontWeight: theme.fontWeights.semibold }}>You May Also Like</h2>
            <RelatedGrid>{related.map(p => <ProductCard key={p.id} product={p} />)}</RelatedGrid>
          </Container>
        </Section>
      )}

      <NewsletterSection />
    </main>
  );
};

export default ProductDetailPage;
