// ============================================================
// ADMIN PAGES: Users · Orders · Cards · Contacts · Blog
// Unified with ProductsPage visual style
// ============================================================
import React, { useState, useMemo, useCallback } from 'react';
import { PortalDropdown, MenuItem } from '../components/PortalDropdown';
import styled from 'styled-components';
import {
  Search, Trash2, Eye, Plus,
  Ban, CheckCircle, Mail, CreditCard,
  MessageSquare, FileText, MoreHorizontal,
  Star, BookOpen, RefreshCw, Download, Filter,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminCard, AdminFlex, AdminBtn, IconBtn, StatusPill,
  AdminInput, AdminSelect, AdminTextarea,
  FormGroup, FormLabel, FormGrid, SearchBar, SearchInput,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter, PageBtns, PageBtn, EmptyState, AdminDivider,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { useAdminUsers, useAdminOrders, useAdminCards, useAdminContacts, useAdminBlogs } from '../../hooks/useAdminApi';
import {
  adminUsersApi, adminOrdersApi, adminCardsApi, adminContactsApi, adminBlogsApi,
  AdminUser, Order, CardDetail, Contact, AdminBlogPost,
} from '../../api/admin';
import { ApiError } from '../../api/client';
import { formatDate } from '../utils/formatDate';

const PAGE_SIZE = 10;

/* ── Shared layout components matching ProductsPage ── */
const PageHeader = styled.div`display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;`;
const PageTitle  = styled.h1`font-size:1.375rem;font-weight:700;color:${t.colors.textPrimary};margin:0 0 2px;`;
const PageSub    = styled.p`font-size:0.8125rem;color:${t.colors.textMuted};margin:0;`;
const HeaderBtns = styled.div`display:flex;gap:10px;flex-wrap:wrap;`;
const TableWrap  = styled(AdminCard)`padding:0;overflow:hidden;`;
const TableInner = styled.div`overflow-x:auto;`;
const Tbl        = styled.table`width:100%;border-collapse:collapse;font-family:${t.fonts.body};`;
const THead      = styled.thead`background:${t.colors.surfaceAlt};border-bottom:1px solid ${t.colors.border};`;
const TH         = styled.th<{$center?:boolean;$right?:boolean}>`
  padding:12px 16px;font-size:0.75rem;font-weight:600;color:${t.colors.textMuted};
  text-align:${({$center,$right})=>$center?'center':$right?'right':'left'};white-space:nowrap;
`;
const TR = styled.tr`
  border-bottom:1px solid ${t.colors.border};transition:background 0.12s;
  &:last-child{border-bottom:none;}&:hover{background:${t.colors.surfaceAlt};}
`;
const TD = styled.td<{$center?:boolean;$right?:boolean}>`
  padding:14px 16px;font-size:0.8125rem;color:${t.colors.textSecondary};vertical-align:middle;
  ${({$center})=>$center&&'text-align:center;'}${({$right})=>$right&&'text-align:right;'}
`;
const PersonCell = styled.div`display:flex;align-items:center;gap:12px;`;
const Avatar     = styled.div`width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${t.colors.primary},${t.colors.primaryDark});color:white;font-size:0.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const PersonName = styled.div`font-weight:600;color:${t.colors.textPrimary};font-size:0.875rem;`;
const PersonSub  = styled.div`font-size:0.75rem;color:${t.colors.textMuted};margin-top:1px;`;
const FilterBtn  = styled.button`display:flex;align-items:center;gap:6px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 14px;height:40px;background:white;font-size:0.875rem;font-weight:500;color:${t.colors.textSecondary};cursor:pointer;&:hover{background:${t.colors.surfaceAlt};}`;

// ── USERS PAGE ────────────────────────────────────────────────────────────────
const userStatusV = (s:string) => s==='active'?'success':s==='banned'?'danger':'neutral';
const roleV = (r:string) => r==='admin'?'info':r==='editor'?'warning':'neutral';

export const UsersPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<AdminUser|null>(null);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [openDrop, setOpenDrop] = useState<string|null>(null);

  const query = useMemo(()=>({page,limit:PAGE_SIZE,search,status:statusF==='all'?'':statusF}),[page,search,statusF]);
  const { data:users, pagination, loading, error, refetch } = useAdminUsers(query);

  const cycleBan = useCallback(async (u:AdminUser) => {
    const next = u.status==='active'?'banned':'active';
    try {
      await adminUsersApi.updateStatus(u.uid, next as AdminUser['status']);
      dispatch(showAdminToast({message:`${u.name} ${next==='banned'?'banned':'reactivated'}`,type:next==='banned'?'warning':'success'}));
      refetch();
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Update failed',type:'error'})); }
  }, [dispatch, refetch]);

  const handleDelete = useCallback(async (id:string, name:string) => {
    try {
      await adminUsersApi.delete(id);
      setDeleteId(null); refetch();
      dispatch(showAdminToast({message:`${name} deleted`,type:'warning'}));
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Delete failed',type:'error'})); }
  }, [dispatch, refetch]);

  return (
    <>
      <PageHeader>
        <div>
          <PageTitle>Users</PageTitle>
          <PageSub>Manage user accounts and roles</PageSub>
        </div>
        <HeaderBtns>
          <IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn>
        </HeaderBtns>
      </PageHeader>

      <TableWrap>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${t.colors.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontWeight:600,color:t.colors.textPrimary,fontSize:'0.9375rem'}}>Users List</div>
            <div style={{fontSize:'0.8rem',color:t.colors.textMuted}}>Manage user accounts and roles</div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <SearchBar style={{minWidth:220,height:40}}><Search size={14}/><SearchInput placeholder="Name or email…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></SearchBar>
            <FilterBtn>
              <Filter size={14}/>
              <select style={{border:'none',outline:'none',background:'transparent',fontSize:'0.875rem',cursor:'pointer',color:t.colors.textSecondary}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
                <option value="all">All Statuses</option>
                {['active','inactive','banned'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </FilterBtn>
          </div>
        </div>
        {error&&<div style={{color:t.colors.danger,padding:'12px 16px',background:'#fff5f5'}}>{error}</div>}
        {loading
          ? <div style={{padding:40,textAlign:'center',color:t.colors.textMuted}}>Loading users…</div>
          : (users??[]).length===0
            ? <EmptyState><MessageSquare size={40} strokeWidth={1} color={t.colors.textMuted}/><p style={{margin:'8px 0 0',color:t.colors.textMuted,fontSize:'0.875rem'}}>No users found</p></EmptyState>
            : <TableInner><Tbl>
                <THead><tr>
                  <TH>User</TH><TH>Role</TH><TH>Status</TH>
                  <TH>Joined</TH><TH>Last Login</TH><TH $center>Actions</TH>
                </tr></THead>
                <tbody>
                  {(users??[]).map(u=>(
                    <TR key={u.uid}>
                      <TD><PersonCell>
                        <Avatar>{u.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</Avatar>
                        <div><PersonName>{u.name}</PersonName><PersonSub>{u.email}</PersonSub></div>
                      </PersonCell></TD>
                      <TD><StatusPill $variant={roleV(u.role) as any}>{u.role}</StatusPill></TD>
                      <TD><StatusPill $variant={userStatusV(u.status) as any}>{u.status}</StatusPill></TD>
                      <TD style={{fontSize:'0.8rem'}}>{formatDate(u.createdAt)}</TD>
                      <TD style={{fontSize:'0.8rem'}}>{formatDate(u.lastLogin)}</TD>
                      <TD $center>
                        <PortalDropdown>
                          <MenuItem onClick={()=>setSelected(u)}><Eye size={13}/> View</MenuItem>
                          <MenuItem onClick={()=>cycleBan(u)}>{u.status==='banned'?<><CheckCircle size={13}/> Reactivate</>:<><Ban size={13}/> Ban</>}</MenuItem>
                          <MenuItem $danger onClick={()=>setDeleteId(u.uid)}><Trash2 size={13}/> Delete</MenuItem>
                        </PortalDropdown>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Tbl></TableInner>
        }
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderTop:`1px solid ${t.colors.border}`,flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:'0.8125rem',color:t.colors.textMuted}}>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,pagination?.total??0)} of {pagination?.total??0}</span>
            <PageBtns>
              <PageBtn disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</PageBtn>
              {Array.from({length:pagination?.totalPages??1},(_,i)=><PageBtn key={i+1} $active={page===i+1} onClick={()=>setPage(i+1)}>{i+1}</PageBtn>)}
              <PageBtn disabled={page===(pagination?.totalPages??1)} onClick={()=>setPage(p=>p+1)}>›</PageBtn>
            </PageBtns>
          </div>
      </TableWrap>
      {selected&&<ModalBackdrop onClick={()=>setSelected(null)}><ModalBox $width="520px" onClick={e=>e.stopPropagation()}>
        <ModalHeader><div style={{fontWeight:700,fontSize:'1rem',color:t.colors.textPrimary}}>User Details</div><IconBtn onClick={()=>setSelected(null)}>✕</IconBtn></ModalHeader>
        <ModalBody>
          <AdminFlex as="div" $gap="16px" style={{marginBottom:20}}>
            <Avatar style={{width:52,height:52,fontSize:'1rem'}}>{selected.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</Avatar>
            <div>
              <div style={{fontWeight:700,fontSize:'1.1rem',color:t.colors.textPrimary}}>{selected.name}</div>
              <div style={{color:t.colors.textMuted,fontSize:'0.875rem'}}>{selected.email}</div>
              <AdminFlex as="div" $gap="8px" style={{marginTop:6}}>
                <StatusPill $variant={roleV(selected.role) as any}>{selected.role}</StatusPill>
                <StatusPill $variant={userStatusV(selected.status) as any}>{selected.status}</StatusPill>
              </AdminFlex>
            </div>
          </AdminFlex>
          <AdminDivider/>
          <FormGrid $cols={2}>
            {[{label:'Phone',value:selected.phone||'—'},{label:'Joined',value:formatDate(selected.createdAt)},{label:'Last Login',value:formatDate(selected.lastLogin)}].map(({label,value})=>(
              <FormGroup key={label}><FormLabel>{label}</FormLabel><div style={{fontSize:'0.875rem',fontWeight:500,color:t.colors.textPrimary}}>{value}</div></FormGroup>
            ))}
          </FormGrid>
        </ModalBody>
        <ModalFooter><AdminBtn $variant="ghost" onClick={()=>setSelected(null)}>Close</AdminBtn></ModalFooter>
      </ModalBox></ModalBackdrop>}

      {deleteId&&(()=>{const u=(users??[]).find(x=>x.uid===deleteId); if(!u) return null; return (
        <ModalBackdrop onClick={()=>setDeleteId(null)}><ModalBox $width="400px" onClick={e=>e.stopPropagation()}>
          <ModalHeader><span style={{fontWeight:700,fontSize:'1rem',color:t.colors.danger}}>Delete User</span><IconBtn onClick={()=>setDeleteId(null)}>✕</IconBtn></ModalHeader>
          <ModalBody><p style={{color:t.colors.textSecondary,fontSize:'0.875rem',lineHeight:1.6}}>Delete <strong>{u.name}</strong>? This action is permanent and cannot be undone.</p></ModalBody>
          <ModalFooter><AdminBtn $variant="ghost" onClick={()=>setDeleteId(null)}>Cancel</AdminBtn><AdminBtn $variant="danger" onClick={()=>handleDelete(u.uid,u.name)} style={{background:t.colors.danger,color:'white'}}>Delete</AdminBtn></ModalFooter>
        </ModalBox></ModalBackdrop>
      );})()}
    </>
  );
};

// ── ORDERS PAGE ───────────────────────────────────────────────────────────────
const orderStatusV=(s:string)=>{const m:Record<string,any>={delivered:'success',shipped:'info',processing:'warning',pending:'neutral',cancelled:'danger'};return m[s]??'neutral';};

export const OrdersPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState('all');
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState<Order|null>(null);
  const [openDrop,  setOpenDrop]  = useState<string|null>(null);

  const query = useMemo(()=>({page,limit:PAGE_SIZE,search,status:statusF==='all'?'':statusF}),[page,search,statusF]);
  const { data:orders, pagination, loading, error, refetch } = useAdminOrders(query);

  const changeStatus = useCallback(async (id:string, status:Order['status']) => {
    try {
      await adminOrdersApi.updateStatus(id, status);
      dispatch(showAdminToast({message:`Order updated to ${status}`,type:'success'}));
      if(selected?.id===id) setSelected(prev=>prev?{...prev,status}:null);
      refetch();
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Update failed',type:'error'})); }
  }, [dispatch, refetch, selected]);

  const handleDelete = useCallback(async (id:string) => {
    try {
      await adminOrdersApi.delete(id);
      dispatch(showAdminToast({message:'Order deleted',type:'warning'}));
      setOpenDrop(null); refetch();
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Delete failed',type:'error'})); }
  }, [dispatch, refetch]);

  return (
    <>
      <PageHeader>
        <div>
          <PageTitle>Orders</PageTitle>
          <PageSub>Manage and track all your orders</PageSub>
        </div>
        <HeaderBtns>
          <IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn>
          <AdminBtn $variant="ghost"><Download size={15}/> Export</AdminBtn>
        </HeaderBtns>
      </PageHeader>

      <TableWrap>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${t.colors.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontWeight:600,color:t.colors.textPrimary,fontSize:'0.9375rem'}}>Orders List</div>
            <div style={{fontSize:'0.8rem',color:t.colors.textMuted}}>Manage and track all your orders</div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <SearchBar style={{minWidth:220,height:40}}><Search size={14}/><SearchInput placeholder="Order ID or customer…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></SearchBar>
            <FilterBtn>
              <Filter size={14}/>
              <select style={{border:'none',outline:'none',background:'transparent',fontSize:'0.875rem',cursor:'pointer',color:t.colors.textSecondary}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
                <option value="all">All Statuses</option>
                {['pending','processing','shipped','delivered','cancelled'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </FilterBtn>
          </div>
        </div>
        {error&&<div style={{color:t.colors.danger,padding:'12px 16px',background:'#fff5f5'}}>{error}</div>}
        {loading
          ? <div style={{padding:40,textAlign:'center',color:t.colors.textMuted}}>Loading orders…</div>
          : (orders??[]).length===0
            ? <EmptyState><BookOpen size={40} strokeWidth={1} color={t.colors.textMuted}/><p style={{margin:'8px 0 0',color:t.colors.textMuted,fontSize:'0.875rem'}}>No orders found</p></EmptyState>
            : <TableInner><Tbl>
                <THead><tr>
                  <TH>Order ID</TH><TH>Customer</TH><TH>Total</TH>
                  <TH>Payment</TH><TH>Date</TH><TH $center>Status</TH><TH $center>Actions</TH>
                </tr></THead>
                <tbody>
                  {(orders??[]).map(o=>(
                    <TR key={o.id}>
                      <TD style={{fontFamily:t.fonts.mono,fontSize:'0.8rem',fontWeight:600,color:t.colors.textMuted}}>#{o.orderNumber||o.id?.slice(0,8)||'—'}</TD>
                      <TD><PersonCell>
                        <Avatar style={{width:32,height:32,fontSize:'0.7rem'}}>{(o.userName||'?').charAt(0)}</Avatar>
                        <div><PersonName>{o.userName||'—'}</PersonName><PersonSub>{o.userEmail||'—'}</PersonSub></div>
                      </PersonCell></TD>
                      <TD style={{fontWeight:700,color:t.colors.textPrimary}}>${(o.total||0).toFixed(2)}</TD>
                      <TD><StatusPill $variant={o.paymentStatus==='paid'?'success':'warning'}>{o.paymentStatus}</StatusPill></TD>
                      <TD style={{fontSize:'0.8rem'}}>{formatDate(o.createdAt)}</TD>
                      <TD $center><StatusPill $variant={orderStatusV(o.status) as any} style={{textTransform:'capitalize'}}>{o.status}</StatusPill></TD>
                      <TD $center>
                        <PortalDropdown>
                          <MenuItem onClick={()=>setSelected(o)}><Eye size={13}/> View</MenuItem>
                          <MenuItem $danger onClick={()=>handleDelete(o.id)}><Trash2 size={13}/> Delete</MenuItem>
                        </PortalDropdown>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Tbl></TableInner>
        }
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderTop:`1px solid ${t.colors.border}`,flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:'0.8125rem',color:t.colors.textMuted}}>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,pagination?.total??0)} of {pagination?.total??0}</span>
            <PageBtns>
              <PageBtn disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</PageBtn>
              {Array.from({length:pagination?.totalPages??1},(_,i)=><PageBtn key={i+1} $active={page===i+1} onClick={()=>setPage(i+1)}>{i+1}</PageBtn>)}
              <PageBtn disabled={page===(pagination?.totalPages??1)} onClick={()=>setPage(p=>p+1)}>›</PageBtn>
            </PageBtns>
          </div>
      </TableWrap>
      {selected&&<ModalBackdrop onClick={()=>setSelected(null)}><ModalBox $width="580px" onClick={e=>e.stopPropagation()}>
        <ModalHeader>
          <div>
            <div style={{fontWeight:700,fontSize:'1rem',color:t.colors.textPrimary}}>Order #{selected.orderNumber||selected.id?.slice(0,8)}</div>
            <div style={{fontSize:'0.8rem',color:t.colors.textMuted,marginTop:2}}>{formatDate(selected.createdAt)}</div>
          </div>
          <AdminFlex as="div" $gap="8px">
            <StatusPill $variant={orderStatusV(selected.status) as any}>{selected.status}</StatusPill>
            <IconBtn onClick={()=>setSelected(null)}>✕</IconBtn>
          </AdminFlex>
        </ModalHeader>
        <ModalBody>
          <FormGrid $cols={2}>
            <FormGroup><FormLabel>Customer</FormLabel><div style={{fontWeight:600,color:t.colors.textPrimary}}>{selected.userName||'—'}</div></FormGroup>
            <FormGroup><FormLabel>Email</FormLabel><div style={{color:t.colors.textSecondary}}>{selected.userEmail||'—'}</div></FormGroup>
            <FormGroup><FormLabel>Payment</FormLabel><StatusPill $variant={selected.paymentStatus==='paid'?'success':'warning'}>{selected.paymentStatus} · {selected.paymentMethod}</StatusPill></FormGroup>
            <FormGroup><FormLabel>Total</FormLabel><div style={{fontWeight:700,fontSize:'1.1rem',color:t.colors.textPrimary}}>${(selected.total||0).toFixed(2)}</div></FormGroup>
            <FormGroup $span={2}><FormLabel>Update Status</FormLabel>
              <AdminSelect value={selected.status} onChange={e=>changeStatus(selected.id,e.target.value as Order['status'])}>
                {['pending','processing','shipped','delivered','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
              </AdminSelect>
            </FormGroup>
            <FormGroup $span={2}><FormLabel>Ship To</FormLabel><div style={{color:t.colors.textSecondary}}>{Object.values(selected.address||{}).filter(Boolean).join(', ')}</div></FormGroup>
          </FormGrid>
          <AdminDivider/>
          <FormLabel style={{marginBottom:8,display:'block'}}>Order Items</FormLabel>
          {(selected.items||[]).map((item:any,i:number)=>(
            <AdminFlex key={i} as="div" $gap="12px" style={{padding:'10px 0',borderBottom:`1px solid ${t.colors.border}`}}>
              <img src={item.image||''} alt={item.name||''} style={{width:40,height:40,borderRadius:8,objectFit:'cover'}} onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/40x40/e8f5e9/4CAF50?text=P';}}/>
              <div style={{flex:1}}><div style={{fontWeight:600,color:t.colors.textPrimary}}>{item.name}</div><div style={{fontSize:'0.75rem',color:t.colors.textMuted}}>× {item.quantity||1}</div></div>
              <div style={{fontWeight:700,color:t.colors.textPrimary}}>${((item.price||0)*(item.quantity||1)).toFixed(2)}</div>
            </AdminFlex>
          ))}
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:12,gap:24,fontSize:'0.875rem'}}>
            <span style={{color:t.colors.textMuted}}>Shipping: ${(selected.shipping||0).toFixed(2)}</span>
            <span style={{fontWeight:700,fontSize:'1rem',color:t.colors.textPrimary}}>Total: ${(selected.total||0).toFixed(2)}</span>
          </div>
        </ModalBody>
        <ModalFooter><AdminBtn $variant="ghost" onClick={()=>setSelected(null)}>Close</AdminBtn></ModalFooter>
      </ModalBox></ModalBackdrop>}
    </>
  );
};

// ── CARDS PAGE ────────────────────────────────────────────────────────────────
const CardBrand = styled.div<{$type:string}>`display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:6px;font-size:0.72rem;font-weight:700;background:${({$type})=>$type==='visa'?'#1a1f71':$type==='mastercard'?'#eb001b':$type==='amex'?'#007bc1':'#ff6600'};color:white;text-transform:uppercase;letter-spacing:0.5px;`;

export const CardsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const query = useMemo(()=>({page,limit:PAGE_SIZE,search}),[page,search]);
  const { data:cards, pagination, loading, error, refetch } = useAdminCards(query);

  const isExpired=(m:string,y:string)=>new Date(parseInt(y),parseInt(m)-1)<new Date();

  const handleDelete = async (c:CardDetail) => {
    try {
      await adminCardsApi.delete(c.id);
      dispatch(showAdminToast({message:`Card ••••${c.last4} removed`,type:'warning'}));
      refetch();
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Delete failed',type:'error'})); }
  };

  return (
    <>
      <PageHeader>
        <div>
          <PageTitle>Card Details</PageTitle>
          <PageSub>Customer payment methods</PageSub>
        </div>
        <HeaderBtns><IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn></HeaderBtns>
      </PageHeader>

      <TableWrap>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${t.colors.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontWeight:600,color:t.colors.textPrimary,fontSize:'0.9375rem'}}>Saved Cards</div>
            <div style={{fontSize:'0.8rem',color:t.colors.textMuted}}>Customer payment methods</div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <SearchBar style={{minWidth:260,height:40}}><Search size={14}/><SearchInput placeholder="Name, email or last 4…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></SearchBar>
          </div>
        </div>
        {error&&<div style={{color:t.colors.danger,padding:'12px 16px',background:'#fff5f5'}}>{error}</div>}
        {loading
          ? <div style={{padding:40,textAlign:'center',color:t.colors.textMuted}}>Loading cards…</div>
          : (cards??[]).length===0
            ? <EmptyState><CreditCard size={40} strokeWidth={1} color={t.colors.textMuted}/><p style={{margin:'8px 0 0',color:t.colors.textMuted,fontSize:'0.875rem'}}>No cards found</p></EmptyState>
            : <TableInner><Tbl>
                <THead><tr>
                  <TH>Card</TH><TH>Cardholder</TH><TH>User</TH>
                  <TH>Expiry</TH><TH $center>Default</TH><TH>Added</TH><TH $center>Actions</TH>
                </tr></THead>
                <tbody>
                  {(cards??[]).map(c=>{
                    const expired=isExpired(c.expiryMonth,c.expiryYear);
                    return (
                      <TR key={c.id}>
                        <TD><div style={{display:'flex',alignItems:'center',gap:10}}><CardBrand $type={c.cardType}><CreditCard size={11}/>{c.cardType}</CardBrand><span style={{fontFamily:t.fonts.mono,fontWeight:600,color:t.colors.textPrimary}}>•••• {c.last4}</span></div></TD>
                        <TD style={{fontWeight:500,color:t.colors.textPrimary}}>{c.cardholderName}</TD>
                        <TD><PersonName>{c.userName}</PersonName><PersonSub>{c.userEmail}</PersonSub></TD>
                        <TD><span style={{fontFamily:t.fonts.mono,fontSize:'0.8rem',color:expired?t.colors.danger:t.colors.textPrimary,fontWeight:600}}>{c.expiryMonth}/{c.expiryYear}</span>{expired&&<StatusPill $variant="danger" style={{marginLeft:6,fontSize:'0.7rem'}}>Expired</StatusPill>}</TD>
                        <TD $center>{c.isDefault?<StatusPill $variant="success">Default</StatusPill>:<span style={{color:t.colors.textMuted,fontSize:'0.8rem'}}>—</span>}</TD>
                        <TD style={{fontSize:'0.8rem'}}>{formatDate(c.createdAt)}</TD>
                        <TD $center><IconBtn $variant="danger" title="Delete" onClick={()=>handleDelete(c)}><Trash2 size={14}/></IconBtn></TD>
                      </TR>
                    );
                  })}
                </tbody>
              </Tbl></TableInner>
        }
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderTop:`1px solid ${t.colors.border}`,flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:'0.8125rem',color:t.colors.textMuted}}>{pagination?.total??0} total cards</span>
            <PageBtns>
              <PageBtn disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</PageBtn>
              {Array.from({length:pagination?.totalPages??1},(_,i)=><PageBtn key={i+1} $active={page===i+1} onClick={()=>setPage(i+1)}>{i+1}</PageBtn>)}
              <PageBtn disabled={page===(pagination?.totalPages??1)} onClick={()=>setPage(p=>p+1)}>›</PageBtn>
            </PageBtns>
          </div>
      </TableWrap>
    </>
  );
};

// ── CONTACTS PAGE ─────────────────────────────────────────────────────────────
const contactStatusV=(s:string)=>s==='new'?'danger':s==='read'?'warning':s==='replied'?'success':'neutral';

export const ContactsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<Contact|null>(null);
  const [openDrop, setOpenDrop] = useState<string|null>(null);

  const query = useMemo(()=>({page,limit:PAGE_SIZE,search,status:statusF==='all'?'':statusF}),[page,search,statusF]);
  const { data:contacts, pagination, loading, error, refetch } = useAdminContacts(query);

  const changeStatus = useCallback(async (c:Contact, status:Contact['status']) => {
    try {
      await adminContactsApi.updateStatus(c.id, status);
      dispatch(showAdminToast({message:`Marked as "${status}"`,type:'success'}));
      if(selected?.id===c.id) setSelected({...c,status});
      refetch();
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Update failed',type:'error'})); }
  }, [dispatch, refetch, selected]);

  const handleDelete = useCallback(async (id:string) => {
    try {
      await adminContactsApi.delete(id);
      dispatch(showAdminToast({message:'Message deleted',type:'warning'}));
      setOpenDrop(null); refetch();
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Delete failed',type:'error'})); }
  }, [dispatch, refetch]);

  return (
    <>
      <PageHeader>
        <div>
          <PageTitle>Contacts</PageTitle>
          <PageSub>Customer inquiries and messages</PageSub>
        </div>
        <HeaderBtns><IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn></HeaderBtns>
      </PageHeader>

      <TableWrap>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${t.colors.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontWeight:600,color:t.colors.textPrimary,fontSize:'0.9375rem'}}>Messages</div>
            <div style={{fontSize:'0.8rem',color:t.colors.textMuted}}>Customer inquiries and messages</div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <SearchBar style={{minWidth:220,height:40}}><Search size={14}/><SearchInput placeholder="Name or subject…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></SearchBar>
            <FilterBtn>
              <Filter size={14}/>
              <select style={{border:'none',outline:'none',background:'transparent',fontSize:'0.875rem',cursor:'pointer',color:t.colors.textSecondary}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
                <option value="all">All Statuses</option>
                {['new','read','replied','archived'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </FilterBtn>
          </div>
        </div>
        {error&&<div style={{color:t.colors.danger,padding:'12px 16px',background:'#fff5f5'}}>{error}</div>}
        {loading
          ? <div style={{padding:40,textAlign:'center',color:t.colors.textMuted}}>Loading messages…</div>
          : (contacts??[]).length===0
            ? <EmptyState><MessageSquare size={40} strokeWidth={1} color={t.colors.textMuted}/><p style={{margin:'8px 0 0',color:t.colors.textMuted,fontSize:'0.875rem'}}>No messages found</p></EmptyState>
            : <TableInner><Tbl>
                <THead><tr>
                  <TH>From</TH><TH>Subject</TH><TH $center>Status</TH>
                  <TH>Received</TH><TH $center>Actions</TH>
                </tr></THead>
                <tbody>
                  {(contacts??[]).map(c=>(
                    <TR key={c.id} style={{cursor:'pointer'}} onClick={()=>{setSelected(c);if(c.status==='new')changeStatus(c,'read');}}>
                      <TD><PersonName style={{fontWeight:c.status==='new'?700:500}}>{c.name}</PersonName><PersonSub>{c.email}</PersonSub></TD>
                      <TD style={{maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:c.status==='new'?600:400}}>{c.subject||c.message.slice(0,60)}</TD>
                      <TD $center><StatusPill $variant={contactStatusV(c.status) as any}>{c.status}</StatusPill></TD>
                      <TD style={{fontSize:'0.8rem'}}>{formatDate(c.createdAt)}</TD>
                      <TD $center onClick={e=>e.stopPropagation()}>
                        <PortalDropdown>
                          <MenuItem onClick={()=>setSelected(c)}><Eye size={13}/> View</MenuItem>
                          <MenuItem onClick={()=>changeStatus(c,'replied')}><CheckCircle size={13}/> Mark Replied</MenuItem>
                          <MenuItem onClick={()=>changeStatus(c,'archived')}><MoreHorizontal size={13}/> Archive</MenuItem>
                          <MenuItem $danger onClick={()=>handleDelete(c.id)}><Trash2 size={13}/> Delete</MenuItem>
                        </PortalDropdown>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Tbl></TableInner>
        }
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderTop:`1px solid ${t.colors.border}`,flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:'0.8125rem',color:t.colors.textMuted}}>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,pagination?.total??0)} of {pagination?.total??0}</span>
            <PageBtns>
              <PageBtn disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</PageBtn>
              {Array.from({length:pagination?.totalPages??1},(_,i)=><PageBtn key={i+1} $active={page===i+1} onClick={()=>setPage(i+1)}>{i+1}</PageBtn>)}
              <PageBtn disabled={page===(pagination?.totalPages??1)} onClick={()=>setPage(p=>p+1)}>›</PageBtn>
            </PageBtns>
          </div>
      </TableWrap>
      {selected&&<ModalBackdrop onClick={()=>setSelected(null)}><ModalBox $width="540px" onClick={e=>e.stopPropagation()}>
        <ModalHeader>
          <div>
            <div style={{fontWeight:700,fontSize:'1rem',color:t.colors.textPrimary}}>{selected.subject||'(No subject)'}</div>
            <div style={{fontSize:'0.8rem',color:t.colors.textMuted,marginTop:2}}>From {selected.name} &lt;{selected.email}&gt;</div>
          </div>
          <AdminFlex as="div" $gap="8px">
            <StatusPill $variant={contactStatusV(selected.status) as any}>{selected.status}</StatusPill>
            <IconBtn onClick={()=>setSelected(null)}>✕</IconBtn>
          </AdminFlex>
        </ModalHeader>
        <ModalBody>
          <p style={{lineHeight:1.8,marginBottom:16,color:t.colors.textSecondary,fontSize:'0.9375rem'}}>{selected.message}</p>
          {selected.phone&&<p style={{fontSize:'0.8rem',color:t.colors.textMuted,marginBottom:4}}>Phone: {selected.phone}</p>}
          <p style={{fontSize:'0.8rem',color:t.colors.textMuted}}>Received: {formatDate(selected.createdAt)}</p>
          {selected.repliedAt&&<p style={{fontSize:'0.8rem',color:t.colors.textMuted}}>Replied: {formatDate(selected.repliedAt)}</p>}
        </ModalBody>
        <ModalFooter>
          <AdminBtn $variant="ghost" onClick={()=>setSelected(null)}>Close</AdminBtn>
          <AdminBtn $variant="primary" onClick={()=>{changeStatus(selected,'replied');setSelected(null);}}><Mail size={14}/> Mark Replied</AdminBtn>
        </ModalFooter>
      </ModalBox></ModalBackdrop>}
    </>
  );
};

// ── BLOG PAGE ─────────────────────────────────────────────────────────────────
const blogStatusV=(s:string)=>s==='published'?'success':s==='draft'?'warning':'neutral';
const emptyBlog=()=>({title:'',slug:'',excerpt:'',content:'',author:'',category:'Nutrition',tags:[],status:'draft'});

const UploadBox = styled.label`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  border:2px dashed ${t.colors.border};border-radius:10px;padding:18px;cursor:pointer;
  gap:6px;text-align:center;transition:border-color 0.15s,background 0.15s;background:${t.colors.surfaceAlt};
  &:hover{border-color:${t.colors.primary};background:${t.colors.primaryGhost};}
`;
const UploadHiddenInput = styled.input`display:none;`;
const CoverPreview = styled.img`width:100%;max-height:140px;border-radius:8px;object-fit:cover;border:1px solid ${t.colors.border};`;

export const BlogsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [search,      setSearch]      = useState('');
  const [statusF,     setStatusF]     = useState('all');
  const [page,        setPage]        = useState(1);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toggling,    setToggling]    = useState<string|null>(null);
  const [form,        setForm]        = useState<any>(emptyBlog());
  const [coverFile,   setCoverFile]   = useState<File|null>(null);
  const [coverPreview,setCoverPreview]= useState<string>('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const query = useMemo(()=>({page,limit:PAGE_SIZE,search,status:statusF==='all'?undefined:statusF}),[page,search,statusF]);
  const { data:blogs, pagination, loading, error, refetch } = useAdminBlogs(query);

  const toggleBlogStatus = useCallback(async (b: AdminBlogPost) => {
    if (toggling) return;
    const next = b.status === 'published' ? 'draft' : 'published';
    setToggling(b.id);
    try {
      await adminBlogsApi.setStatus(b.id, next as AdminBlogPost['status']);
      dispatch(showAdminToast({ message: '"' + b.title + '" set to ' + next, type: 'info' }));
      refetch();
    } catch(err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Update failed', type: 'error' }));
    } finally { setToggling(null); }
  }, [dispatch, refetch, toggling]);

  const setField=(k:string)=>(e:React.ChangeEvent<any>)=>setForm((f:any)=>({...f,[k]:e.target.value}));
  const handleCoverChange=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;setCoverFile(f);const r=new FileReader();r.onload=ev=>setCoverPreview(ev.target?.result as string);r.readAsDataURL(f);};
  const openModal=()=>{setForm(emptyBlog());setCoverFile(null);setCoverPreview('');setModalOpen(true);};
  const closeModal=()=>{setModalOpen(false);setCoverFile(null);setCoverPreview('');};

  const handleSave = useCallback(async () => {
    if (!form.title||!form.author){dispatch(showAdminToast({message:'Title and author are required',type:'error'}));return;}
    setSaving(true);
    try {
      const fd=new FormData();
      fd.append('title',form.title);fd.append('author',form.author);fd.append('category',form.category);
      fd.append('status',form.status);fd.append('excerpt',form.excerpt||'');fd.append('content',form.content||'');
      if(coverFile)fd.append('cover',coverFile);
      await adminBlogsApi.create(fd);
      dispatch(showAdminToast({message:`"${form.title}" created`,type:'success'}));
      closeModal();refetch();
    } catch(err){dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Failed to create post',type:'error'}));}
    finally{setSaving(false);}
  },[dispatch,form,coverFile,refetch]);

  const publish=useCallback(async(b:AdminBlogPost)=>{
    try{await adminBlogsApi.setStatus(b.id,'published');dispatch(showAdminToast({message:`"${b.title}" published`,type:'success'}));refetch();}
    catch(err){dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Failed to publish',type:'error'}));}
  },[dispatch,refetch]);

  const remove=useCallback(async(b:AdminBlogPost)=>{
    try{await adminBlogsApi.delete(b.id);dispatch(showAdminToast({message:`"${b.title}" deleted`,type:'warning'}));refetch();}
    catch(err){dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Delete failed',type:'error'}));}
  },[dispatch,refetch]);

  return (
    <>
      <PageHeader>
        <div>
          <PageTitle>Blog</PageTitle>
          <PageSub>Create and manage blog content</PageSub>
        </div>
        <HeaderBtns>
          <IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn>
          <AdminBtn $variant="primary" onClick={openModal}><Plus size={15}/> New Post</AdminBtn>
        </HeaderBtns>
      </PageHeader>

      <TableWrap>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${t.colors.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontWeight:600,color:t.colors.textPrimary,fontSize:'0.9375rem'}}>Blog Posts</div>
            <div style={{fontSize:'0.8rem',color:t.colors.textMuted}}>Create and manage blog content</div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <SearchBar style={{minWidth:220,height:40}}><Search size={14}/><SearchInput placeholder="Search posts…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></SearchBar>
            <FilterBtn>
              <Filter size={14}/>
              <select style={{border:'none',outline:'none',background:'transparent',fontSize:'0.875rem',cursor:'pointer',color:t.colors.textSecondary}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
                <option value="all">All Statuses</option>
                <option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option>
              </select>
            </FilterBtn>
          </div>
        </div>
        {error&&<div style={{color:t.colors.danger,padding:'12px 16px',background:'#fff5f5'}}>{error}</div>}
        {loading
          ? <div style={{padding:40,textAlign:'center',color:t.colors.textMuted}}>Loading posts…</div>
          : (blogs??[]).length===0
            ? <EmptyState><BookOpen size={40} strokeWidth={1} color={t.colors.textMuted}/><p style={{margin:'8px 0 0',color:t.colors.textMuted,fontSize:'0.875rem'}}>No posts found</p></EmptyState>
            : <TableInner><Tbl>
                <THead><tr>
                  <TH>Title</TH><TH>Author</TH><TH>Category</TH>
                  <TH $center>Status</TH><TH $center>Views</TH><TH>Updated</TH><TH $right>Actions</TH>
                </tr></THead>
                <tbody>
                  {(blogs??[]).map(b=>(
                    <TR key={b.id}>
                      <TD style={{maxWidth:280}}><div style={{fontWeight:600,color:t.colors.textPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</div><div style={{fontSize:'0.75rem',color:t.colors.textMuted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.excerpt}</div></TD>
                      <TD style={{fontWeight:500,color:t.colors.textPrimary}}>{b.author}</TD>
                      <TD>{b.category}</TD>
                      <TD $center><StatusPill
                        $variant={blogStatusV(b.status) as any}
                        style={{ cursor: toggling===b.id?'wait':'pointer', userSelect:'none', opacity: toggling===b.id?0.6:1 }}
                        title="Click to toggle published / draft"
                        onClick={()=>toggleBlogStatus(b)}
                      >{b.status}</StatusPill></TD>
                      <TD $center><div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'center'}}><Star size={12} style={{color:'#FFC107'}}/>{b.views?.toLocaleString()}</div></TD>
                      <TD style={{fontSize:'0.8rem'}}>{formatDate(b.updatedAt)}</TD>
                      <TD $right>
                        <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                          {b.status!=='published'&&<AdminBtn $variant="success" $size="sm" onClick={()=>publish(b)}>Publish</AdminBtn>}
                          <IconBtn $variant="danger" title="Delete" onClick={()=>remove(b)}><Trash2 size={14}/></IconBtn>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Tbl></TableInner>
        }
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderTop:`1px solid ${t.colors.border}`,flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:'0.8125rem',color:t.colors.textMuted}}>{pagination?.total??0} posts</span>
            <PageBtns>
              <PageBtn disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</PageBtn>
              {Array.from({length:pagination?.totalPages??1},(_,i)=><PageBtn key={i+1} $active={page===i+1} onClick={()=>setPage(i+1)}>{i+1}</PageBtn>)}
              <PageBtn disabled={page===(pagination?.totalPages??1)} onClick={()=>setPage(p=>p+1)}>›</PageBtn>
            </PageBtns>
          </div>
      </TableWrap>
      {modalOpen&&<ModalBackdrop onClick={closeModal}><ModalBox $width="660px" onClick={e=>e.stopPropagation()}>
        <ModalHeader><span style={{fontWeight:700,fontSize:'1rem',color:t.colors.textPrimary}}>New Blog Post</span><IconBtn onClick={closeModal}>✕</IconBtn></ModalHeader>
        <ModalBody>
          <FormGrid $cols={2}>
            <FormGroup $span={2}><FormLabel>Title *</FormLabel><AdminInput value={form.title} onChange={setField('title')} placeholder="Post title"/></FormGroup>
            <FormGroup><FormLabel>Author *</FormLabel><AdminInput value={form.author} onChange={setField('author')} placeholder="Author name"/></FormGroup>
            <FormGroup><FormLabel>Category</FormLabel><AdminSelect value={form.category} onChange={setField('category')}>{['Nutrition','Recipes','Lifestyle','Gardening','Health','Tips'].map(c=><option key={c}>{c}</option>)}</AdminSelect></FormGroup>
            <FormGroup><FormLabel>Status</FormLabel><AdminSelect value={form.status} onChange={setField('status')}><option value="draft">Draft</option><option value="published">Published</option></AdminSelect></FormGroup>
            <FormGroup>
              <FormLabel>Cover Image</FormLabel>
              {coverPreview?(
                <div style={{position:'relative'}}>
                  <CoverPreview src={coverPreview} alt="preview"/>
                  <button onClick={()=>{setCoverFile(null);setCoverPreview('');if(fileRef.current)fileRef.current.value='';}} style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.55)',border:'none',borderRadius:5,color:'white',cursor:'pointer',padding:'2px 8px',fontSize:11}}>Remove</button>
                </div>
              ):(
                <UploadBox>
                  <UploadHiddenInput ref={fileRef} type="file" accept="image/*" onChange={handleCoverChange}/>
                  <FileText size={22} color={t.colors.textMuted}/>
                  <span style={{fontSize:'0.8rem',color:t.colors.textMuted}}>Click to upload cover image</span>
                  <span style={{fontSize:'0.72rem',color:t.colors.textMuted}}>PNG, JPG, WEBP up to 5MB</span>
                </UploadBox>
              )}
            </FormGroup>
            <FormGroup $span={2}><FormLabel>Excerpt</FormLabel><AdminTextarea style={{minHeight:70}} value={form.excerpt} onChange={setField('excerpt')} placeholder="Short summary…"/></FormGroup>
            <FormGroup $span={2}><FormLabel>Content</FormLabel><AdminTextarea style={{minHeight:120}} value={form.content} onChange={setField('content')} placeholder="Full article content…"/></FormGroup>
          </FormGrid>
        </ModalBody>
        <ModalFooter><AdminBtn $variant="ghost" onClick={closeModal}>Cancel</AdminBtn><AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>{saving?'Saving…':'Create Post'}</AdminBtn></ModalFooter>
      </ModalBox></ModalBackdrop>}
    </>
  );
};
