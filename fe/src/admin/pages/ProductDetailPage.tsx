/**
 * src/admin/pages/ProductDetailPage.tsx
 * Admin: product detail view — product info + paginated reviews.
 *
 * Page structure (consistent across ALL admin detail pages):
 *   1. useState declarations  (1a. data state → 1b. UI/loading → 1c. pagination)
 *   2. Data fetch             (loadProduct, loadReviews — useCallback + useEffect)
 *   3. Action handlers        (handleDeleteReview)
 *   4. Return JSX             (back btn → header → tab bar → tab panels)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Star, Trash2, Package, Tag, BarChart2, Calendar, MessageSquare } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminCard, IconBtn, StatusPill, PageBtns, PageBtn, SectionTitle, EmptyState,
} from '../styles/adminShared';
import { adminProductsApi, adminReviewsApi, AdminReview } from '../../api/admin';
import { AdminProduct } from '../types';
import { formatDate } from '../utils/formatDate';
import { useAdminDispatch, showAdminToast } from '../store';
import { API_BASE } from '../../api/client';

/* ── Helpers ─────────────────────────────────────────────────── */
const resolveImg = (url: string) =>
  url?.startsWith('http') ? url : url ? `${API_BASE}${url}` : '';

const renderStars = (r: number) =>
  '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

/* ── Styled ──────────────────────────────────────────────────── */
const PageWrap = styled.div`
  padding: 0;
  font-family: ${t.fonts.body};
`;

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 0.875rem; color: ${t.colors.textSecondary};
  padding: 0; margin-bottom: 20px;
  transition: color ${t.transitions.fast};
  &:hover { color: ${t.colors.primary}; }
`;

const PageHeader = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 24px;
`;

const ProductHero = styled.div`
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
`;

const HeroThumb = styled.img`
  width: 60px; height: 60px; border-radius: 10px;
  object-fit: cover; border: 1px solid ${t.colors.border};
  flex-shrink: 0;
`;

const HeroThumbPh = styled.div`
  width: 60px; height: 60px; border-radius: 10px;
  background: ${t.colors.surfaceAlt}; border: 1px solid ${t.colors.border};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;

const HeroName = styled.h1`
  font-size: 1.25rem; font-weight: 700; color: ${t.colors.textPrimary}; margin: 0 0 4px;
`;

const HeroSku = styled.div`
  font-size: 0.8rem; color: ${t.colors.textMuted};
`;

/* ── Tabs ── */
const TabBar = styled.div`
  display: flex; gap: 0; border-bottom: 2px solid ${t.colors.border}; margin-bottom: 24px;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex; align-items: center; gap: 7px;
  padding: 12px 20px; background: none; border: none; cursor: pointer;
  font-size: 0.875rem; font-weight: 600; font-family: ${t.fonts.body};
  color: ${({ $active }) => ($active ? t.colors.primary : t.colors.textSecondary)};
  border-bottom: 2px solid ${({ $active }) => ($active ? t.colors.primary : 'transparent')};
  margin-bottom: -2px;
  transition: color ${t.transitions.fast}, border-color ${t.transitions.fast};
  &:hover { color: ${t.colors.primary}; }
`;

const TabBadge = styled.span<{ $active: boolean }>`
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; border-radius: 10px; padding: 0 6px;
  font-size: 0.7rem; font-weight: 700;
  background: ${({ $active }) => ($active ? t.colors.primary : t.colors.surfaceAlt)};
  color: ${({ $active }) => ($active ? '#fff' : t.colors.textMuted)};
  transition: background ${t.transitions.fast}, color ${t.transitions.fast};
`;

/* ── Detail Tab ── */
const DetailGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;

const DetailCard = styled(AdminCard)`padding: 24px;`;

const CardLabel = styled.div`
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
  color: ${t.colors.textMuted}; margin-bottom: 4px;
`;

const CardValue = styled.div`
  font-size: 0.9rem; color: ${t.colors.textPrimary}; font-weight: 500; line-height: 1.5;
`;

const FieldRow = styled.div`
  display: flex; align-items: flex-start; gap: 10px; padding: 12px 0;
  border-bottom: 1px solid ${t.colors.border}; &:last-child { border-bottom: none; }
  svg { color: ${t.colors.textMuted}; flex-shrink: 0; margin-top: 2px; }
`;

const FullImageWrap = styled.div`
  width: 100%; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden;
  border: 1px solid ${t.colors.border}; margin-bottom: 16px;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const PriceBadge = styled.span`
  font-size: 1.4rem; font-weight: 700; color: ${t.colors.primary};
`;

const OldPriceBadge = styled.span`
  font-size: 1rem; color: ${t.colors.textMuted}; text-decoration: line-through; margin-left: 8px;
`;

/* ── Reviews Tab ── */
const ReviewsTableWrap = styled(AdminCard)`padding: 0; overflow: hidden;`;

const ReviewsTable = styled.table`
  width: 100%; border-collapse: collapse; font-family: ${t.fonts.body};
`;

const RTHead = styled.thead`
  background: ${t.colors.surfaceAlt}; border-bottom: 1px solid ${t.colors.border};
`;

const RTH = styled.th`
  padding: 12px 16px; font-size: 0.75rem; font-weight: 600;
  color: ${t.colors.textMuted}; text-align: left; white-space: nowrap;
`;

const RTR = styled.tr`
  border-bottom: 1px solid ${t.colors.border};
  transition: background 0.12s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${t.colors.surfaceAlt}; }
`;

const RTD = styled.td`
  padding: 14px 16px; font-size: 0.8125rem; color: ${t.colors.textSecondary}; vertical-align: middle;
`;

const ReviewStars = styled.span`color: #f79009; font-size: 13px; letter-spacing: 1px;`;

const ReviewerCell = styled.div`display: flex; align-items: center; gap: 10px;`;

const ReviewerAvatar = styled.div`
  width: 34px; height: 34px; border-radius: 50%;
  background: ${t.colors.primaryGhost}; color: ${t.colors.primary};
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px; flex-shrink: 0;
`;

const ReviewerName = styled.div`font-weight: 600; color: ${t.colors.textPrimary}; font-size: 0.8125rem;`;
const ReviewerType = styled.div`font-size: 0.7rem; color: ${t.colors.textMuted};`;

const CommentCell = styled.div`
  max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${t.colors.textSecondary};
  font-size: 0.8125rem;
`;

const PaginationWrap = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-top: 1px solid ${t.colors.border};
  flex-wrap: wrap; gap: 10px;
`;

const PaginationInfo = styled.span`font-size: 0.8rem; color: ${t.colors.textMuted};`;

const SkeletonRow = styled.div`
  height: 60px; background: linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; margin-bottom: 8px;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const REVIEWS_PER_PAGE = 10;

export const AdminProductDetailPage: React.FC = () => {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const dispatch   = useAdminDispatch();

  // 1a. Data state
  const [product,    setProduct]    = useState<AdminProduct | null>(null);
  const [reviews,    setReviews]    = useState<AdminReview[]>([]);
  const [revTotal,   setRevTotal]   = useState(0);
  const [liveRating, setLiveRating] = useState<number | null>(null); // synced from reviews
  const [liveCount,  setLiveCount]  = useState<number | null>(null);

  // 1b. UI / loading
  const [activeTab,   setActiveTab]   = useState<'details' | 'reviews'>('details');
  const [prodLoading, setProdLoading] = useState(true);
  const [revLoading,  setRevLoading]  = useState(false);

  // 1c. Pagination
  const [revPage, setRevPage] = useState(1);

  const totalRevPages = Math.ceil(revTotal / REVIEWS_PER_PAGE);

  /* Load product (also called after review changes to refresh aggregate) */
  // 2. Data fetch
  const loadProduct = useCallback(() => {
    if (!id) return;
    setProdLoading(true);
    adminProductsApi.getOne(id)
      .then(res => {
        const p = res.data as unknown as AdminProduct;
        setProduct(p);
        // sync live counters from the freshly loaded product
        setLiveRating((p as any).rating ?? null);
        setLiveCount((p as any).reviews ?? null);
      })
      .catch(() => dispatch(showAdminToast({ message: 'Failed to load product.', type: 'error' })))
      .finally(() => setProdLoading(false));
  }, [id, dispatch]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  /* Load reviews — also recompute live rating from the review list itself */
  const loadReviews = useCallback(async (page: number) => {
    if (!id) return;
    setRevLoading(true);
    try {
      const res = await adminReviewsApi.list(id, { page, limit: REVIEWS_PER_PAGE });
      if (res.success) {
        setReviews(res.data);
        const total = res.pagination?.total ?? 0;
        setRevTotal(total);
        setLiveCount(total);
        // recompute avg rating from current page as a quick optimistic update;
        // the real aggregate comes from loadProduct() called after mutations
        if (res.data.length > 0) {
          const avg = res.data.reduce((s: number, r: AdminReview) => s + r.rating, 0) / res.data.length;
          setLiveRating(Math.round(avg * 10) / 10);
        } else {
          setLiveRating(0);
        }
      }
    } catch {
      dispatch(showAdminToast({ message: 'Failed to load reviews.', type: 'error' }));
    } finally { setRevLoading(false); }
  }, [id, dispatch]);

  useEffect(() => {
    if (activeTab === 'reviews') loadReviews(revPage);
    // when switching BACK to details, refresh product to pick up latest aggregate
    if (activeTab === 'details') loadProduct();
  }, [activeTab, revPage, loadReviews, loadProduct]);

  // 3. Action handlers
  const handleDeleteReview = useCallback(async (reviewId: string) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    try {
      await adminReviewsApi.delete(reviewId);
      dispatch(showAdminToast({ message: 'Review deleted.', type: 'success' }));
      await loadReviews(revPage);
      loadProduct();
    } catch {
      dispatch(showAdminToast({ message: 'Failed to delete review.', type: 'error' }));
    }
  }, [dispatch, loadReviews, loadProduct, revPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effective rating and count — prefer live values once we have them
  const displayRating  = liveRating  ?? (product as any)?.rating  ?? 0;
  const displayCount   = liveCount   ?? (product as any)?.reviews  ?? 0;

  // 4. Render
  /* ── Loading state ── */
  if (prodLoading) return (
    <PageWrap>
      <BackBtn onClick={() => navigate('/admin/products')}><ArrowLeft size={16} /> Back to Products</BackBtn>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1,2,3,4].map(i => <SkeletonRow key={i} />)}
      </div>
    </PageWrap>
  );

  if (!product) return (
    <PageWrap>
      <BackBtn onClick={() => navigate('/admin/products')}><ArrowLeft size={16} /> Back to Products</BackBtn>
      <EmptyState>
        <Package size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
        <div>Product not found.</div>
      </EmptyState>
    </PageWrap>
  );

  const thumbUrl = resolveImg(product.image || (product as any).thumbnail || '');
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <PageWrap>
      {/* Back */}
      <BackBtn onClick={() => navigate('/admin/products')}>
        <ArrowLeft size={16} /> Back to Products
      </BackBtn>

      {/* Header */}
      <PageHeader>
        <ProductHero>
          {thumbUrl
            ? <HeroThumb src={thumbUrl} alt={product.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <HeroThumbPh><Package size={24} color={t.colors.textMuted} /></HeroThumbPh>
          }
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <HeroName>{product.name}</HeroName>
                <StatusPill $variant={product.status === 'active' ? 'success' : product.status === 'draft' ? 'warning' : 'neutral'}>
                    {product.status}
                </StatusPill>
            </div>
            <HeroSku>SKU: {product.sku} &nbsp;</HeroSku>
          </div>
        </ProductHero>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatusPill $variant={product.status === 'active' ? 'success' : product.status === 'draft' ? 'warning' : 'neutral'}>
            {product.status}
          </StatusPill>
        </div>
      </PageHeader>

      {/* Tab Bar */}
      <TabBar>
        <Tab $active={activeTab === 'details'} onClick={() => setActiveTab('details')}>
          <Package size={15} /> Product Details
        </Tab>
        <Tab $active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
          <MessageSquare size={15} /> Reviews
          <TabBadge $active={activeTab === 'reviews'}>{displayCount}</TabBadge>
        </Tab>
      </TabBar>

      {/* ── TAB: Details ── */}
      {activeTab === 'details' && (
        <DetailGrid>
          {/* Left: image + pricing */}
          <div>
            <DetailCard>
              {thumbUrl && (
                <FullImageWrap>
                  <img src={thumbUrl} alt={product.name}
                    onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/600x340/f0f2f5/98a2b3?text=${encodeURIComponent(product.name)}`; }} />
                </FullImageWrap>
              )}
              <SectionTitle style={{ fontSize: '0.875rem', marginBottom: 16 }}>Pricing</SectionTitle>
              <div style={{ marginBottom: 8 }}>
                <PriceBadge>${product.price.toFixed(2)}</PriceBadge>
                {product.originalPrice && <OldPriceBadge>${product.originalPrice.toFixed(2)}</OldPriceBadge>}
                {discount && (
                  <span style={{ marginLeft: 10, fontSize: '0.75rem', fontWeight: 700, color: t.colors.success,
                    background: t.colors.successBg, borderRadius: 20, padding: '2px 10px' }}>
                    {discount}% OFF
                  </span>
                )}
              </div>
              <FieldRow>
                <BarChart2 size={14} />
                <div><CardLabel>Stock</CardLabel><CardValue>{product.stock} units</CardValue></div>
              </FieldRow>
              <FieldRow>
                <Star size={14} />
                <div>
                  <CardLabel>Rating</CardLabel>
                  <CardValue>
                    <span style={{ color: '#f79009' }}>{renderStars(displayRating)}</span>
                    {' '}
                    <span style={{ fontWeight: 700, color: t.colors.textPrimary }}>{displayRating}</span>
                    <span style={{ color: t.colors.textMuted }}> ({displayCount} review{displayCount !== 1 ? 's' : ''})</span>
                  </CardValue>
                </div>
              </FieldRow>
            </DetailCard>
          </div>

          {/* Right: product info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DetailCard>
              <SectionTitle style={{ fontSize: '0.875rem', marginBottom: 16 }}>Product Info</SectionTitle>
              <FieldRow>
                <Tag size={14} />
                <div><CardLabel>Category</CardLabel><CardValue style={{ textTransform: 'capitalize' }}>{product.category || '—'}</CardValue></div>
              </FieldRow>
              <FieldRow>
                <Package size={14} />
                <div><CardLabel>SKU</CardLabel><CardValue style={{ fontFamily: t.fonts.mono }}>{product.sku}</CardValue></div>
              </FieldRow>
              <FieldRow>
                <Tag size={14} />
                <div>
                  <CardLabel>Badge / Brand</CardLabel>
                  <CardValue>
                    {(product as any).badge
                      ? <span style={{ background: t.colors.primaryGhost, color: t.colors.primary, borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 }}>{(product as any).badge}</span>
                      : '—'
                    }
                  </CardValue>
                </div>
              </FieldRow>
              <FieldRow>
                <BarChart2 size={14} />
                <div>
                  <CardLabel>Flags</CardLabel>
                  <CardValue style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(product as any).isFeatured && <span style={{ background: t.colors.warningBg, color: t.colors.warning, borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>Featured</span>}
                    {(product as any).isNew && <span style={{ background: t.colors.successBg, color: t.colors.success, borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>New</span>}
                    {!(product as any).isFeatured && !(product as any).isNew && '—'}
                  </CardValue>
                </div>
              </FieldRow>
              <FieldRow>
                <Calendar size={14} />
                <div><CardLabel>Created</CardLabel><CardValue>{formatDate(product.createdAt)}</CardValue></div>
              </FieldRow>
              <FieldRow>
                <Calendar size={14} />
                <div><CardLabel>Last Updated</CardLabel><CardValue>{formatDate(product.updatedAt)}</CardValue></div>
              </FieldRow>
            </DetailCard>

            {/* Description */}
            {(product.description || (product as any).shortDescription) && (
              <DetailCard>
                <SectionTitle style={{ fontSize: '0.875rem', marginBottom: 12 }}>Description</SectionTitle>
                {(product as any).shortDescription && (
                  <div style={{ fontSize: '0.85rem', color: t.colors.textSecondary, marginBottom: 10, fontStyle: 'italic' }}>
                    {(product as any).shortDescription}
                  </div>
                )}
                <div style={{ fontSize: '0.875rem', color: t.colors.textSecondary, lineHeight: 1.7 }}>
                  {product.description || '—'}
                </div>
              </DetailCard>
            )}

            {/* Tags */}
            {(product as any).tags?.length > 0 && (
              <DetailCard>
                <SectionTitle style={{ fontSize: '0.875rem', marginBottom: 12 }}>Tags</SectionTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(product as any).tags.map((tag: string) => (
                    <span key={tag} style={{ background: t.colors.surfaceAlt, border: `1px solid ${t.colors.border}`, borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', color: t.colors.textSecondary }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </DetailCard>
            )}
          </div>
        </DetailGrid>
      )}

      {/* ── TAB: Reviews ── */}
      {activeTab === 'reviews' && (
        <>
          {revLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : reviews.length === 0 ? (
            <ReviewsTableWrap>
              <EmptyState>
                <MessageSquare size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <div>No reviews yet for this product.</div>
              </EmptyState>
            </ReviewsTableWrap>
          ) : (
            <ReviewsTableWrap>
              <div style={{ overflowX: 'auto' }}>
                <ReviewsTable>
                  <RTHead>
                    <tr>
                      <RTH>Reviewer</RTH>
                      <RTH>Rating</RTH>
                      <RTH>Comment</RTH>
                      <RTH>Type</RTH>
                      <RTH>Date</RTH>
                      <RTH style={{ textAlign: 'center' }}>Action</RTH>
                    </tr>
                  </RTHead>
                  <tbody>
                    {reviews.map(review => (
                      <RTR key={review.id}>
                        <RTD>
                          <ReviewerCell>
                            <ReviewerAvatar>{(review.userName || 'G').slice(0, 1).toUpperCase()}</ReviewerAvatar>
                            <div>
                              <ReviewerName>{review.userName}</ReviewerName>
                              {review.userId && <ReviewerType style={{ fontFamily: t.fonts.mono, fontSize: '0.65rem' }}>ID: {review.userId.slice(0, 8)}…</ReviewerType>}
                            </div>
                          </ReviewerCell>
                        </RTD>
                        <RTD>
                          <ReviewStars>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</ReviewStars>
                          <div style={{ fontSize: '0.7rem', color: t.colors.textMuted }}>{review.rating} / 5</div>
                        </RTD>
                        <RTD>
                          <CommentCell title={review.comment}>
                            {review.comment || <span style={{ color: t.colors.textMuted, fontStyle: 'italic' }}>No comment</span>}
                          </CommentCell>
                        </RTD>
                        <RTD>
                          <StatusPill $variant={review.isGuest ? 'neutral' : 'info'}>
                            {review.isGuest ? 'Guest' : 'Registered'}
                          </StatusPill>
                        </RTD>
                        <RTD style={{ whiteSpace: 'nowrap' }}>{formatDate(review.createdAt)}</RTD>
                        <RTD style={{ textAlign: 'center' }}>
                          <IconBtn
                            $variant="danger"
                            $size="sm"
                            onClick={() => handleDeleteReview(review.id)}
                            title="Delete review"
                          >
                            <Trash2 size={14} />
                          </IconBtn>
                        </RTD>
                      </RTR>
                    ))}
                  </tbody>
                </ReviewsTable>
              </div>

              {/* Pagination */}
              <PaginationWrap>
                <PaginationInfo>
                  Showing {Math.min((revPage - 1) * REVIEWS_PER_PAGE + 1, revTotal)}–{Math.min(revPage * REVIEWS_PER_PAGE, revTotal)} of {revTotal} reviews
                </PaginationInfo>
                <PageBtns>
                  <PageBtn onClick={() => setRevPage(p => p - 1)} disabled={revPage === 1}>‹</PageBtn>
                  {Array.from({ length: totalRevPages }, (_, i) => i + 1).map(p => (
                    <PageBtn key={p} $active={p === revPage} onClick={() => setRevPage(p)}>{p}</PageBtn>
                  ))}
                  <PageBtn onClick={() => setRevPage(p => p + 1)} disabled={revPage === totalRevPages}>›</PageBtn>
                </PageBtns>
              </PaginationWrap>
            </ReviewsTableWrap>
          )}
        </>
      )}
    </PageWrap>
  );
};

export default AdminProductDetailPage;