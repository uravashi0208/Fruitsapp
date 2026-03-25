import React, { useState } from 'react';
import styled from 'styled-components';
import { Heart, Search, Trash2, User, ShoppingCart, Package, RefreshCw } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminCard, AdminFlex, AdminTable, AdminTHead, AdminTh, AdminTr, AdminTd,
  AdminBtn, IconBtn, SearchBar, SearchInput,
  SectionTitle, EmptyState, AdminGrid,
} from '../styles/adminShared';
import { adminWishlistApi, WishlistByUser, WishlistAdminEntry } from '../../api/admin';
import { useAdminWishlist } from '../../hooks/useAdminApi';
import { useAdminDispatch, showAdminToast } from '../store';
import { ApiError } from '../../api/client';
import { formatDate } from '../utils/formatDate';

const Toolbar    = styled(AdminFlex)`justify-content:space-between;flex-wrap:wrap;gap:${t.spacing.md};margin-bottom:${t.spacing.lg};`;
const FilterRow  = styled(AdminFlex)`gap:${t.spacing.sm};flex-wrap:wrap;`;
const StatCard   = styled(AdminCard)`display:flex;align-items:center;gap:14px;padding:1.25rem 1.5rem;`;
const StatIcon   = styled.div<{$color:string}>`width:44px;height:44px;border-radius:10px;background:${({$color})=>$color};display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const StatVal    = styled.div`font-size:1.5rem;font-weight:700;color:${t.colors.textPrimary};line-height:1;`;
const StatLbl    = styled.div`font-size:0.75rem;color:${t.colors.textMuted};margin-top:2px;`;
const PThumb     = styled.img`width:38px;height:38px;border-radius:6px;object-fit:cover;border:1px solid ${t.colors.border};flex-shrink:0;`;
const Avatar     = styled.div`width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,${t.colors.primary},${t.colors.primaryDark});color:white;font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const CatTag     = styled.span`display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;text-transform:capitalize;background:${t.colors.primaryGhost};color:${t.colors.primary};`;
const Skeleton   = styled.div`height:60px;background:linear-gradient(90deg,${t.colors.border} 25%,${t.colors.surfaceAlt} 50%,${t.colors.border} 75%);background-size:200%;animation:adminPulse 1.5s ease infinite;border-radius:${t.radii.md};margin-bottom:8px;`;

export const AdminWishlistPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [search,     setSearch]     = useState('');
  const [userFilter, setUserFilter] = useState('');

  const { data, loading, error, refetch } = useAdminWishlist({ search, userId: userFilter || undefined });

  const entries  = data?.entries || [];
  const byUser   = data?.byUser  || [];
  const total    = data?.total   || 0;

  // Stats
  const uniqueUsers    = byUser.length;
  const uniqueProds    = new Set(entries.map(e => String(e.productId))).size;
  const topProduct     = entries.reduce<Record<string,number>>((acc,e)=>{ acc[e.productName]=(acc[e.productName]||0)+1; return acc; },{});
  const topProductName = Object.entries(topProduct).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '—';

  const handleRemove = async (id: string) => {
    try {
      await adminWishlistApi.remove(id);
      dispatch(showAdminToast({ message: 'Wishlist entry removed', type: 'warning' }));
      refetch();
    } catch(err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Remove failed', type: 'error' }));
    }
  };

  return (
    <section>
      {/* Stats */}
      <AdminGrid $cols={4} $colsMd={2} $gap={t.spacing.lg} style={{marginBottom:t.spacing.xl}}>
        <StatCard><StatIcon $color="rgba(76,175,80,0.12)"><Heart size={20} color={t.colors.primary}/></StatIcon><div><StatVal>{total}</StatVal><StatLbl>Total Wishlist Items</StatLbl></div></StatCard>
        <StatCard><StatIcon $color="rgba(59,130,246,0.12)"><User size={20} color={t.colors.info}/></StatIcon><div><StatVal>{uniqueUsers}</StatVal><StatLbl>Users with Wishlists</StatLbl></div></StatCard>
        <StatCard><StatIcon $color="rgba(245,158,11,0.12)"><Package size={20} color={t.colors.warning}/></StatIcon><div><StatVal>{uniqueProds}</StatVal><StatLbl>Unique Products</StatLbl></div></StatCard>
        <StatCard><StatIcon $color="rgba(239,68,68,0.12)"><Heart size={20} color={t.colors.danger}/></StatIcon><div><StatVal style={{fontSize:'1rem'}}>{topProductName}</StatVal><StatLbl>Most Wishlisted</StatLbl></div></StatCard>
      </AdminGrid>

      {/* Toolbar */}
      <Toolbar as="div">
        <SectionTitle>{total} Wishlist Entries</SectionTitle>
        <FilterRow as="div">
          <SearchBar style={{maxWidth:280}}>
            <Search size={14}/>
            <SearchInput placeholder="User name, email or product…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </SearchBar>
          {byUser.length>0&&(
            <select value={userFilter} onChange={e=>setUserFilter(e.target.value)}
              style={{padding:'0.55rem 1.5rem 0.55rem 0.75rem',border:`1.5px solid ${t.colors.border}`,borderRadius:t.radii.md,fontFamily:t.fonts.body,fontSize:'0.875rem',outline:'none',cursor:'pointer',background:`white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 6px center / 16px`,appearance:'none'}}>
              <option value="">All Users</option>
              {byUser.map(u=><option key={u.userId} value={u.userId}>{u.userName}</option>)}
            </select>
          )}
          <IconBtn onClick={refetch} title="Refresh"><RefreshCw size={14}/></IconBtn>
        </FilterRow>
      </Toolbar>

      {error && <div style={{color:t.colors.danger,padding:'1rem',marginBottom:'1rem'}}>{error}</div>}

      {loading ? (
        <div>{[1,2,3].map(i=><Skeleton key={i}/>)}</div>
      ) : byUser.length === 0 ? (
        <AdminCard><EmptyState><Heart size={40}/><h3>No wishlist entries</h3><p>No items match your current filters.</p></EmptyState></AdminCard>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:t.spacing.lg}}>
          {byUser.map((group: WishlistByUser) => (
            <AdminCard key={group.userId} $p="0">
              {/* User header */}
              <div style={{padding:'1rem 1.5rem',borderBottom:`1px solid ${t.colors.border}`,background:t.colors.surfaceAlt,borderRadius:`${t.radii.lg} ${t.radii.lg} 0 0`}}>
                <AdminFlex as="div" $gap="12px" style={{justifyContent:'space-between'}}>
                  <AdminFlex as="div" $gap="10px">
                    <Avatar>{group.userName.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</Avatar>
                    <div>
                      <div style={{fontWeight:600,fontSize:'0.9rem'}}>{group.userName}</div>
                      <div style={{fontSize:'0.75rem',color:t.colors.textMuted}}>{group.userEmail}</div>
                    </div>
                  </AdminFlex>
                  <div style={{textAlign:'right',fontSize:'0.8rem',color:t.colors.textMuted}}>
                    <strong style={{color:t.colors.primary,fontSize:'1rem'}}>{group.items.length}</strong> item{group.items.length!==1?'s':''}
                  </div>
                </AdminFlex>
              </div>
              {/* Items table */}
              <div style={{overflowX:'auto'}}>
                <AdminTable>
                  <AdminTHead><tr>
                    <AdminTh>Product</AdminTh><AdminTh>Category</AdminTh><AdminTh>Price</AdminTh>
                    <AdminTh>Added</AdminTh><AdminTh style={{textAlign:'right'}}>Actions</AdminTh>
                  </tr></AdminTHead>
                  <tbody>
                    {group.items.map((w: WishlistAdminEntry) => (
                      <AdminTr key={w.id}>
                        <AdminTd>
                          <AdminFlex as="div" $gap="10px">
                            <PThumb src={w.productImage} alt={w.productName} onError={e=>{(e.target as HTMLImageElement).src=`https://placehold.co/38x38/e8f5e9/4CAF50?text=${w.productName[0]}`;}}/>
                            <span style={{fontWeight:600,fontSize:'0.875rem'}}>{w.productName}</span>
                          </AdminFlex>
                        </AdminTd>
                        <AdminTd><CatTag>{w.productCategory}</CatTag></AdminTd>
                        <AdminTd style={{fontWeight:700,color:t.colors.primary}}>${w.productPrice}</AdminTd>
                        <AdminTd style={{fontSize:'0.8rem',color:t.colors.textMuted}}>{formatDate(w.addedAt)}</AdminTd>
                        <AdminTd>
                          <AdminFlex as="div" $gap="4px" style={{justifyContent:'flex-end'}}>
                            <AdminBtn $variant="ghost" $size="sm" as="a" href={`/product/${w.productId}`} target="_blank"><ShoppingCart size={13}/> View</AdminBtn>
                            <IconBtn $variant="danger" title="Remove" onClick={()=>handleRemove(w.id)}><Trash2 size={14}/></IconBtn>
                          </AdminFlex>
                        </AdminTd>
                      </AdminTr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </section>
  );
};
