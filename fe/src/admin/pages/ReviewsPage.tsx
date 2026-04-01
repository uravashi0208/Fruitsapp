import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Search, Trash2, Star, RefreshCw, Package } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminCard, AdminFlex, AdminBtn, IconBtn, StatusPill,
  SearchBar, SearchInput,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { adminReviewsApi, AdminReview } from '../../api/admin';
import { adminProductsApi, AdminProduct } from '../../api/admin';
import { ApiError } from '../../api/client';
import { formatDate } from '../utils/formatDate';
import AdminDataTable, { TR, TD, ColDef } from '../components/AdminDataTable';

const ProductSearch = styled.div`display:flex;gap:10px;margin-bottom:20px;`;
const RatingFilter  = styled.div`display:flex;gap:6px;align-items:center;flex-wrap:wrap;`;
const RatingBtn = styled.button<{$active:boolean}>`
  padding:4px 12px;border-radius:20px;
  border:1px solid ${({$active})=>$active?t.colors.primary:t.colors.border};
  background:${({$active})=>$active?t.colors.primaryGhost:'white'};
  color:${({$active})=>$active?t.colors.primary:t.colors.textSecondary};
  font-size:0.75rem;font-weight:600;cursor:pointer;font-family:${t.fonts.body};
  transition:all 0.15s;display:flex;align-items:center;gap:4px;
  &:hover{border-color:${t.colors.primary};}
`;
const CommentCell = styled.div`
  max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  color:${t.colors.textSecondary};font-size:0.8125rem;
`;

const PAGE_SIZE = 10;

const Stars: React.FC<{rating:number}> = ({rating}) => (
  <div style={{display:'flex',gap:1}}>
    {[1,2,3,4,5].map(i=><span key={i} style={{color:i<=rating?'#f59e0b':'#d1d5db',fontSize:13}}>★</span>)}
  </div>
);

const REVIEW_COLS: ColDef[] = [
  { key: 'reviewer', label: 'Reviewer' },
  { key: 'rating',   label: 'Rating' },
  { key: 'comment',  label: 'Comment' },
  { key: 'type',     label: 'Type' },
  { key: 'date',     label: 'Date' },
  { key: 'actions',  label: '', sortable: false, thProps: { $width: '60px' } },
];

export const ReviewsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [productSearch, setProductSearch] = useState('');
  const [products,      setProducts]      = useState<AdminProduct[]>([]);
  const [productLoading,setProductLoading]= useState(false);
  const [selectedProd,  setSelectedProd]  = useState<AdminProduct|null>(null);
  const [reviews,  setReviews]  = useState<AdminReview[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchProducts = useCallback(async () => {
    if (!productSearch.trim()) return;
    setProductLoading(true);
    try {
      const res = await adminProductsApi.list({ search: productSearch, limit: 10 });
      setProducts(res.success ? res.data : []);
    } catch { setProducts([]); }
    finally { setProductLoading(false); }
  }, [productSearch]);

  const loadReviews = useCallback(async (prodId: string, pg: number) => {
    setLoading(true);
    try {
      const res = await adminReviewsApi.list(prodId, { page: pg, limit: PAGE_SIZE });
      setReviews(res.success ? res.data : []);
      setTotal(res.pagination?.total ?? 0);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  }, []);

  const selectProduct = (prod: AdminProduct) => {
    setSelectedProd(prod); setProducts([]); setProductSearch(prod.name);
    setPage(1); setRatingFilter(0); loadReviews(prod.id, 1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminReviewsApi.delete(deleteId);
      setReviews(prev => prev.filter(r => r.id !== deleteId));
      setTotal(t => t - 1);
      dispatch(showAdminToast({ message: 'Review deleted', type: 'success' }));
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Delete failed', type: 'error' }));
    } finally { setDeleting(false); setDeleteId(null); }
  };

  const changePage = (p: number) => { setPage(p); if (selectedProd) loadReviews(selectedProd.id, p); };
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filtered = ratingFilter > 0 ? reviews.filter(r => r.rating === ratingFilter) : reviews;
  const avgRating = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : '—';

  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:24}}>
        <div>
          <h1 style={{fontSize:'1.375rem',fontWeight:700,color:t.colors.textPrimary,margin:'0 0 2px'}}>Product Reviews</h1>
          <p style={{fontSize:'0.8125rem',color:t.colors.textMuted,margin:0}}>Moderate customer reviews by product</p>
        </div>
      </div>

      {/* Product search */}
      <AdminCard style={{marginBottom:24}}>
        <div style={{fontWeight:600,fontSize:'0.875rem',marginBottom:12,color:t.colors.textPrimary}}>Select a Product</div>
        <ProductSearch>
          <SearchBar style={{flex:1,border:`1px solid ${t.colors.border}`,borderRadius:10,background:t.colors.surfaceAlt}}>
            <Search size={16} color={t.colors.textMuted}/>
            <SearchInput placeholder="Search product by name…" value={productSearch} onChange={e=>setProductSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchProducts()}/>
          </SearchBar>
          <AdminBtn $variant="primary" onClick={searchProducts} disabled={productLoading}>
            {productLoading?<RefreshCw size={14} style={{animation:'adminSpin 0.8s linear infinite'}}/>:<Search size={14}/>} Search
          </AdminBtn>
        </ProductSearch>
        {products.length>0&&(
          <div style={{border:`1px solid ${t.colors.border}`,borderRadius:8,overflow:'hidden',marginTop:8}}>
            {products.map((p,i)=>(
              <div key={p.id} onClick={()=>selectProduct(p)}
                style={{padding:'10px 16px',cursor:'pointer',borderBottom:i<products.length-1?`1px solid ${t.colors.border}`:'none',display:'flex',alignItems:'center',gap:10,fontSize:'0.875rem',color:t.colors.textPrimary,transition:'background 0.1s'}}
                onMouseEnter={e=>(e.currentTarget.style.background=t.colors.surfaceAlt)}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <Package size={14} color={t.colors.textMuted}/>
                <span style={{flex:1}}>{p.name}</span>
                <span style={{fontSize:'0.75rem',color:t.colors.textMuted}}>{p.categoryName}</span>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {selectedProd&&(
        <>
          <AdminFlex $justify="space-between" $wrap style={{marginBottom:16,gap:12}}>
            <div>
              <div style={{fontWeight:700,fontSize:'0.9375rem',color:t.colors.textPrimary}}>Reviews for: {selectedProd.name}</div>
              <div style={{fontSize:'0.8125rem',color:t.colors.textMuted,marginTop:2}}>{total} review(s) · Avg rating: {avgRating} ★</div>
            </div>
            <RatingFilter>
              <span style={{fontSize:'0.8125rem',color:t.colors.textMuted}}>Filter:</span>
              {[0,5,4,3,2,1].map(r=>(
                <RatingBtn key={r} $active={ratingFilter===r} onClick={()=>setRatingFilter(r)}>
                  {r===0?'All':<>{r}★</>}
                </RatingBtn>
              ))}
            </RatingFilter>
          </AdminFlex>

          <AdminDataTable
            columns={REVIEW_COLS}
            rows={filtered}
            loading={loading}
            emptyIcon={<Star size={32}/>}
            emptyTitle={`No reviews found${ratingFilter>0?` with ${ratingFilter} stars`:''}`}
            renderRow={(review) => (
              <TR key={review.id}>
                <TD>
                  <div style={{fontWeight:600,color:t.colors.textPrimary,fontSize:'0.875rem'}}>{review.userName}</div>
                  {review.userId&&<div style={{fontSize:'0.75rem',color:t.colors.textMuted}}>uid: {review.userId.slice(0,8)}…</div>}
                </TD>
                <TD><Stars rating={review.rating}/></TD>
                <TD><CommentCell title={review.comment}>{review.comment||<span style={{color:t.colors.textMuted,fontStyle:'italic'}}>No comment</span>}</CommentCell></TD>
                <TD><StatusPill $variant={review.isGuest?'neutral':'success'}>{review.isGuest?'Guest':'Member'}</StatusPill></TD>
                <TD style={{whiteSpace:'nowrap'}}>{formatDate(review.createdAt)}</TD>
                <TD>
                  <IconBtn $variant="danger" title="Delete review" onClick={()=>setDeleteId(review.id)}><Trash2 size={14}/></IconBtn>
                </TD>
              </TR>
            )}
            showPagination
            paginationInfo={`${total} reviews`}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={changePage}
          />
        </>
      )}

      {deleteId&&(
        <ModalBackdrop onClick={()=>setDeleteId(null)}>
          <ModalBox onClick={e=>e.stopPropagation()}>
            <ModalHeader><span>Delete Review</span><IconBtn onClick={()=>setDeleteId(null)}>✕</IconBtn></ModalHeader>
            <ModalBody><p style={{color:t.colors.textSecondary,fontSize:'0.9375rem'}}>Are you sure you want to delete this review? This cannot be undone.</p></ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={()=>setDeleteId(null)}>Cancel</AdminBtn>
              <AdminBtn $variant="danger" onClick={handleDelete} disabled={deleting}>{deleting?'Deleting…':'Delete Review'}</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </div>
  );
};