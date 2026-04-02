import React, { useState, useMemo, useCallback } from 'react';
import { PortalDropdown, MenuItem, closeAllDropdowns } from '../components/PortalDropdown';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  Search, Trash2, Eye, Plus, Edit2,
  Mail, CreditCard, CheckCircle, Ban,
  MessageSquare, FileText, MoreHorizontal,
  Star, BookOpen, RefreshCw, Download, Filter, XCircle,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminFlex, AdminBtn, IconBtn, StatusPill,
  AdminInput, AdminSelect, AdminTextarea,
  FormGroup, FormLabel, FormGrid,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter, AdminDivider,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { useAdminUsers, useAdminOrders, useAdminCards, useAdminContacts, useAdminBlogs } from '../../hooks/useAdminApi';
import {
  adminUsersApi, adminOrdersApi, adminCardsApi, adminContactsApi, adminBlogsApi,
  AdminUser, Order, CardDetail, Contact, AdminBlogPost,
} from '../../api/admin';
import { ApiError } from '../../api/client';
import { formatDate } from '../utils/formatDate';
import AdminDataTable, { TR, TD, ColDef, CheckBox } from '../components/AdminDataTable';

const PAGE_SIZE = 10;

/* ── Shared styled ── */
const PersonCell = styled.div`display:flex;align-items:center;gap:12px;`;
const Avatar     = styled.div`width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${t.colors.primary},${t.colors.primaryDark});color:white;font-size:0.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const PersonName = styled.div`font-weight:600;color:${t.colors.textPrimary};font-size:0.875rem;`;
const PersonSub  = styled.div`font-size:0.75rem;color:${t.colors.textMuted};margin-top:1px;`;
const SBar       = styled.div`display:flex;align-items:center;gap:8px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 12px;background:white;height:40px;min-width:220px;`;
const SInp       = styled.input`border:none;outline:none;font-size:0.875rem;background:transparent;flex:1;color:${t.colors.textPrimary};&::placeholder{color:${t.colors.textMuted};}`;
const FilterBtn  = styled.button`display:flex;align-items:center;gap:6px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 14px;height:40px;background:white;font-size:0.875rem;font-weight:500;color:${t.colors.textSecondary};cursor:pointer;&:hover{background:${t.colors.surfaceAlt};}`;

/* ── Shared BulkBar ── */
const BulkBar = styled.div`
  display:flex;align-items:center;gap:6px;flex-wrap:wrap;
  padding:4px 6px 4px 12px;border-radius:10px;
  background:${t.colors.primaryGhost};border:1.5px solid ${t.colors.primary};
  box-shadow:0 2px 8px ${t.colors.primaryGhost};
  animation:bulkSlideIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
  @keyframes bulkSlideIn{from{opacity:0;transform:scale(0.95) translateY(-3px);}to{opacity:1;transform:scale(1) translateY(0);}}
`;
const BulkCount = styled.span`font-size:0.8rem;font-weight:700;color:${t.colors.primary};padding-right:10px;border-right:1.5px solid ${t.colors.border};white-space:nowrap;span{font-size:0.9rem;font-weight:800;}`;
const BulkActionBtn = styled.button<{ $variant?: 'success'|'warning'|'danger'|'ghost' }>`
  display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 12px;border-radius:7px;
  font-size:0.78rem;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all 0.15s ease;white-space:nowrap;
  ${({$variant})=>$variant==='success'&&`background:${t.colors.successBg};color:${t.colors.success};border-color:${t.colors.success};&:hover{filter:brightness(0.93);}`}
  ${({$variant})=>$variant==='warning'&&`background:${t.colors.warningBg};color:${t.colors.warning};border-color:${t.colors.warning};&:hover{filter:brightness(0.93);}`}
  ${({$variant})=>$variant==='danger'&&`background:${t.colors.dangerBg};color:${t.colors.danger};border-color:${t.colors.danger};&:hover{filter:brightness(0.93);}`}
  ${({$variant})=>(!$variant||$variant==='ghost')&&`background:${t.colors.surface};color:${t.colors.textSecondary};border-color:${t.colors.border};&:hover{background:${t.colors.surfaceAlt};color:${t.colors.textPrimary};}`}
  &:disabled{opacity:0.5;cursor:not-allowed;}
`;
// ── USERS PAGE ──────────────────────────────────────────────────────────
const userStatusV = (s:string) => s==='active'?'success':s==='banned'?'danger':'neutral';
const roleV = (r:string) => r==='admin'?'info':r==='editor'?'warning':'neutral';

const USER_COLS: ColDef[] = [
  { key: 'user',      label: 'User' },
  { key: 'role',      label: 'Role' },
  { key: 'status',    label: 'Status'},
  { key: 'joined',    label: 'Joined' },
  { key: 'lastLogin', label: 'Last Login' },
  { key: 'actions',   label: 'Actions', sortable: false, thProps: { $width: '200px' } },
];

export const UsersPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<AdminUser|null>(null);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [selIds,   setSelIds]   = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<'active'|'inactive'|'banned'|'delete'|null>(null);

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

  const allIds     = (users??[]).map(u => u.uid);
  const allChecked = allIds.length > 0 && allIds.every(id => selIds.has(id));
  const toggleAll  = () => setSelIds(allChecked ? new Set() : new Set(allIds));
  const toggleOne  = (id: string) => setSelIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleBulkAction = useCallback(async (action: 'active'|'inactive'|'banned'|'delete') => {
    if (!selIds.size) return;
    setBulkWorking(true);
    const ids = Array.from(selIds);
    try {
      if (action === 'delete') {
        await Promise.all(ids.map(id => adminUsersApi.delete(id)));
        dispatch(showAdminToast({ message: `${ids.length} user(s) deleted`, type: 'warning' }));
      } else {
        await adminUsersApi.bulkUpdateStatus(ids, action);
        dispatch(showAdminToast({ message: `${ids.length} user(s) set to ${action}`, type: 'success' }));
      }
      setSelIds(new Set()); setBulkConfirm(null); refetch();
    } catch(err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Bulk action failed', type: 'error' }));
    } finally { setBulkWorking(false); }
  }, [selIds, dispatch, refetch]);

  return (
    <>
      {error && <div style={{color:t.colors.danger,padding:'1rem',background:'#fff5f5',borderRadius:8,marginBottom:16}}>{error}</div>}
      <AdminDataTable
        title="Users List"
        subtitle="Manage user accounts and roles"
        actions={<IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn>}
        searchArea={
          <SBar>
            <Search size={14}/><SInp placeholder="Name or email…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          </SBar>
        }
        filterArea={
          <>
          {selIds.size > 0 && (
            <BulkBar>
              <BulkCount><span>{selIds.size}</span> selected</BulkCount>
              <BulkActionBtn $variant="success" disabled={bulkWorking} onClick={() => setBulkConfirm('active')}><CheckCircle size={12}/> Set Active</BulkActionBtn>
              <BulkActionBtn $variant="warning" disabled={bulkWorking} onClick={() => setBulkConfirm('inactive')}><XCircle size={12}/> Set Inactive</BulkActionBtn>
              <BulkActionBtn $variant="danger" disabled={bulkWorking} onClick={() => setBulkConfirm('banned')} style={{background:'#fff7ed',color:'#ea580c',borderColor:'#fb923c'}}><Ban size={12}/> Ban</BulkActionBtn>
              <BulkActionBtn $variant="danger" disabled={bulkWorking} onClick={() => setBulkConfirm('delete')}><Trash2 size={12}/> Delete</BulkActionBtn>
              <BulkActionBtn $variant="ghost" disabled={bulkWorking} onClick={() => setSelIds(new Set())}>✕ Clear</BulkActionBtn>
            </BulkBar>
          )}
            <FilterBtn>
              <Filter size={14}/>
              <select style={{border:'none',outline:'none',background:'transparent',fontSize:'0.875rem',cursor:'pointer',color:t.colors.textSecondary}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
                <option value="all">All Statuses</option>
                {['active','inactive','banned'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </FilterBtn>
          </>
        }
        columns={USER_COLS}
        selectable
        allChecked={allChecked}
        onToggleAll={toggleAll}
        rows={users??[]}
        loading={loading}
        emptyIcon={<MessageSquare size={36}/>}
        emptyTitle="No users found"
        renderRow={(u) => (
          <TR key={u.uid}>
            <TD><CheckBox checked={selIds.has(u.uid)} onChange={() => toggleOne(u.uid)} /></TD>
            <TD>
              <PersonCell>
                <Avatar>{u.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</Avatar>
                <div><PersonName>{u.name}</PersonName><PersonSub>{u.email}</PersonSub></div>
              </PersonCell>
            </TD>
            <TD><StatusPill $variant={roleV(u.role) as any}>{u.role}</StatusPill></TD>
            <TD><StatusPill $variant={userStatusV(u.status) as any}>{u.status}</StatusPill></TD>
            <TD style={{fontSize:'0.8rem'}}>{formatDate(u.createdAt)}</TD>
            <TD style={{fontSize:'0.8rem'}}>{formatDate(u.lastLogin)}</TD>
            <TD style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
              <PortalDropdown>
                <MenuItem onClick={()=>{closeAllDropdowns();setSelected(u);}}><Eye size={13}/> View</MenuItem>
                <MenuItem onClick={()=>cycleBan(u)}>{u.status==='banned'?<><CheckCircle size={13}/> Reactivate</>:<><Ban size={13}/> Ban</>}</MenuItem>
                <MenuItem $danger onClick={()=>{closeAllDropdowns();setDeleteId(u.uid);}}><Trash2 size={13}/> Delete</MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={`Showing ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,pagination?.total??0)} of ${pagination?.total??0}`}
        currentPage={page}
        totalPages={pagination?.totalPages??1}
        onPageChange={setPage}
      />

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
          <ModalBody><p style={{color:t.colors.textSecondary,fontSize:'0.875rem',lineHeight:1.6}}>Delete <strong>{u.name}</strong>? This action is permanent.</p></ModalBody>
          <ModalFooter><AdminBtn $variant="ghost" onClick={()=>setDeleteId(null)}>Cancel</AdminBtn><AdminBtn $variant="danger" onClick={()=>handleDelete(u.uid,u.name)}>Delete</AdminBtn></ModalFooter>
        </ModalBox></ModalBackdrop>
      );})()}

      {bulkConfirm && (
        <ModalBackdrop onClick={() => setBulkConfirm(null)}>
          <ModalBox $width="420px" onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <span style={{fontWeight:700,fontSize:'1rem',color:t.colors.textPrimary}}>
                {bulkConfirm === 'delete' ? 'Delete Selected Users' : bulkConfirm === 'banned' ? 'Ban Selected Users' : bulkConfirm === 'active' ? 'Set Users Active' : 'Set Users Inactive'}
              </span>
              <IconBtn onClick={() => setBulkConfirm(null)}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <p style={{color:t.colors.textSecondary,fontSize:'0.875rem',lineHeight:1.6,margin:0}}>
                {bulkConfirm === 'delete'
                  ? <>Permanently delete <strong>{selIds.size} user(s)</strong>? This cannot be undone.</>
                  : bulkConfirm === 'banned'
                  ? <>Ban <strong>{selIds.size} user(s)</strong>? They won't be able to access the platform.</>
                  : <>Set <strong>{selIds.size} user(s)</strong> to <strong>{bulkConfirm}</strong>?</>}
              </p>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setBulkConfirm(null)} disabled={bulkWorking}>Cancel</AdminBtn>
              <AdminBtn $variant={bulkConfirm === 'delete' || bulkConfirm === 'banned' ? 'danger' : 'primary'} disabled={bulkWorking} onClick={() => handleBulkAction(bulkConfirm)}>
                {bulkWorking ? 'Processing…' : bulkConfirm === 'delete' ? `Delete ${selIds.size}` : bulkConfirm === 'banned' ? `Ban ${selIds.size}` : `Set ${selIds.size} ${bulkConfirm}`}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </>
  );
};

// ── ORDERS PAGE ─────────────────────────────────────────────────────────
const orderStatusV=(s:string)=>{const m:Record<string,any>={delivered:'success',shipped:'info',processing:'warning',pending:'neutral',cancelled:'danger'};return m[s]??'neutral';};
const payStatusV=(s:string)=>{const m:Record<string,any>={paid:'success',failed:'danger',refunded:'warning',pending:'neutral',processing:'info',cancelled:'danger'};return m[s]??'neutral';};
const addDays = (iso: string, n: number) => {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
};

const OrderStatusSelect = styled.select<{$variant:string}>`
  appearance:none;-webkit-appearance:none;border:none;outline:none;cursor:pointer;font-family:inherit;
  font-size:0.75rem;font-weight:600;text-transform:capitalize;padding:4px 22px 4px 10px;border-radius:20px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 7px center;
  ${({$variant})=>{const s:Record<string,string>={success:'background-color:#ecfdf3;color:#027a48;',info:'background-color:#eff8ff;color:#175cd3;',warning:'background-color:#fffaeb;color:#b54708;',neutral:'background-color:#f2f4f7;color:#344054;',danger:'background-color:#fef3f2;color:#b42318;'};return s[$variant]||s.neutral;}}
  &:hover{filter:brightness(0.96);}
`;

const ORDER_COLS: ColDef[] = [
  { key: 'customer',   label: 'Customer' },
  { key: 'order',      label: 'Order' },
  { key: 'payment',    label: 'Payment Method' },
  { key: 'created',    label: 'Creation Date' },
  { key: 'due',        label: 'Due Date' },
  { key: 'total',      label: 'Total', thProps: { style: { textAlign: 'right' } } },
  { key: 'payStatus',  label: 'Pay Status', thProps: { $center: true } },
  { key: 'ordStatus',  label: 'Order Status', thProps: { $center: true } },
  { key: 'actions',    label: 'Actions', sortable: false, thProps: { $width: '150px' } },
];

const PM_ICONS: Record<string,string> = {card:'💳',apple_pay:'🍎',google_pay:'🔵',paypal:'🅿️',klarna:'🟣',revolut:'🔷',sepa_debit:'🏦',ideal:'🇳🇱',bancontact:'🇧🇪',sofort:'⚡',giropay:'🇩🇪',eps:'🇦🇹',przelewy24:'🇵🇱',blik:'📱',cod:'💵',bank:'🏦'};
const PM_LABELS: Record<string,string> = {card:'Card',apple_pay:'Apple Pay',google_pay:'Google Pay',paypal:'PayPal',klarna:'Klarna',revolut:'Revolut',sepa_debit:'SEPA Debit',ideal:'iDEAL',bancontact:'Bancontact',sofort:'SOFORT',giropay:'Giropay',eps:'EPS',przelewy24:'Przelewy24',blik:'BLIK',cod:'Cash on Delivery',bank:'Bank Transfer'};
const pmLabel = (m:string) => `${PM_ICONS[m]??'💰'} ${PM_LABELS[m]??m}`;

export const OrdersPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const navigate = useNavigate();
  const [search, setSearch]   = useState('');
  const [statusF, setStatusF] = useState('all');
  const [page, setPage]       = useState(1);

  const query = useMemo(()=>({page, limit:PAGE_SIZE, search, status: statusF==='all'?'':statusF}), [page,search,statusF]);
  const { data:orders, pagination, loading, error, refetch } = useAdminOrders(query);

  const handleUpdateOrderStatus = useCallback(async (orderId:string, status: Order['status']) => {
    try {
      await adminOrdersApi.updateStatus(orderId, status);
      dispatch(showAdminToast({message:`Order status → "${status}"`, type:'success'}));
      refetch();
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Update failed', type:'error'})); }
  }, [dispatch, refetch]);

  const handleDelete = useCallback(async (id:string) => {
    try {
      await adminOrdersApi.delete(id);
      dispatch(showAdminToast({message:'Order deleted', type:'warning'}));
      refetch();
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Delete failed', type:'error'})); }
  }, [dispatch, refetch]);

  return (
    <>
      {error && <div style={{color:t.colors.danger,padding:'1rem',background:'#fff5f5',borderRadius:8,marginBottom:16}}>{error}</div>}
      <AdminDataTable
        title="Orders List"
        subtitle="All orders with payment & card details"
        actions={
          <>
          <AdminBtn $variant="ghost"><Download size={15}/> Export</AdminBtn>
          <IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn>
          </>
        }
        searchArea={
          <SBar><Search size={14}/><SInp placeholder="Order ID or customer…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></SBar>
        }
        filterArea={
          <FilterBtn>
            <Filter size={14}/>
            <select style={{border:'none',outline:'none',background:'transparent',fontSize:'0.875rem',cursor:'pointer',color:t.colors.textSecondary}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
              <option value="all">All Statuses</option>
              {['pending','processing','shipped','delivered','cancelled'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </FilterBtn>
        }
        columns={ORDER_COLS}
        rows={orders??[]}
        loading={loading}
        emptyIcon={<BookOpen size={36}/>}
        emptyTitle="No orders found"
        renderRow={(o) => (
          <TR key={o.id}>
            <TD>
              <PersonCell>
                <Avatar style={{width:30,height:30,fontSize:'0.7rem'}}>{(o.userName||'?').charAt(0)}</Avatar>
                <div><PersonName>{o.userName||'—'}</PersonName><PersonSub>{o.userEmail||'—'}</PersonSub></div>
              </PersonCell>
            </TD>
            <TD style={{cursor:'pointer'}} onClick={()=>navigate(`/admin/orders/${o.id}`)}>
              <div style={{fontWeight:600}}>#{o.orderNumber||o.id?.slice(0,8)||'—'}</div>
              {o.trackingCode && <div style={{fontSize:'0.7rem',color:'#06b6d4',marginTop:2}}>🚚 {o.trackingCode}</div>}
            </TD>
            <TD><span style={{fontSize:'0.8rem',fontWeight:500}}>{pmLabel(o.paymentMethod||'')}</span></TD>
            <TD>{formatDate(o.createdAt)}</TD>
            <TD>{addDays(o.createdAt, 5)}</TD>
            <TD style={{fontWeight:700,color:t.colors.textPrimary,textAlign:'right'}}>${(o.total||0).toFixed(2)}</TD>
            <TD style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
              <StatusPill $variant={payStatusV(o.paymentStatus) as any} style={{textTransform:'capitalize'}}>{o.paymentStatus}</StatusPill>
            </TD>
            <TD style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
              <OrderStatusSelect $variant={orderStatusV(o.status)} value={o.status} onChange={e=>handleUpdateOrderStatus(o.id, e.target.value as Order['status'])} title="Change order status">
                {['pending','processing','shipped','delivered','cancelled'].map(s=>(<option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>))}
              </OrderStatusSelect>
            </TD>
            <TD style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
              <PortalDropdown>
                <MenuItem onClick={()=>{closeAllDropdowns(); navigate(`/admin/orders/${o.id}`);}}><Eye size={13}/> View Details</MenuItem>
                <MenuItem onClick={()=>{closeAllDropdowns(); navigate(`/admin/orders/${o.id}/invoice`);}}><Eye size={13}/> View Invoice</MenuItem>
                <MenuItem $danger onClick={()=>{closeAllDropdowns(); handleDelete(o.id);}}><Trash2 size={13}/> Delete</MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={`Showing ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,pagination?.total??0)} of ${pagination?.total??0}`}
        currentPage={page}
        totalPages={pagination?.totalPages??1}
        onPageChange={setPage}
      />
    </>
  );
};

// ── CARDS PAGE ───────────────────────────────────────────────────────────
const BRAND_COLORS: Record<string,string> = {
  visa:'#1a1f71', mastercard:'#eb001b', amex:'#007bc1',
  discover:'#ff6600', diners:'#004b87', jcb:'#003087', unionpay:'#c0392b',
};
const CardBrand = styled.div<{$type:string}>`
  display:inline-flex;align-items:center;gap:5px;padding:3px 10px;
  border-radius:6px;font-size:0.72rem;font-weight:700;letter-spacing:0.5px;
  text-transform:uppercase;color:white;
  background:${({$type})=>BRAND_COLORS[$type]||'#4b5563'};
`;
const SourceBadge = styled.span<{$auto?:boolean}>`
  display:inline-block;padding:2px 7px;border-radius:10px;font-size:0.68rem;font-weight:600;
  background:${p=>p.$auto?'rgba(130,174,70,.15)':'rgba(59,130,246,.15)'};
  color:${p=>p.$auto?'#82ae46':'#3b82f6'};
`;

const CARD_COLS: ColDef[] = [
  { key: 'card',      label: 'Card' },
  { key: 'holder',    label: 'Cardholder' },
  { key: 'customer',  label: 'Customer' },
  { key: 'expiry',    label: 'Expiry' },
  { key: 'source',    label: 'Source', thProps: { $center: true } },
  { key: 'default',   label: 'Default', thProps: { $center: true } },
  { key: 'captured',  label: 'Captured' },
  { key: 'actions',   label: '', sortable: false, thProps: { $center: true, $width: '60px' } },
];

export const CardsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const query = useMemo(()=>({page,limit:PAGE_SIZE,search}),[page,search]);
  const { data:cards, pagination, loading, error, refetch } = useAdminCards(query);

  const isExpired = (m:string, y:string) => {
    if (!m || !y) return false;
    return new Date(parseInt(y), parseInt(m) - 1) < new Date();
  };

  const handleDelete = async (c:CardDetail) => {
    try {
      await adminCardsApi.delete(c.id);
      dispatch(showAdminToast({message:`Card ••••${c.last4} removed`, type:'warning'}));
      refetch();
    } catch(err) {
      dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Delete failed', type:'error'}));
    }
  };

  return (
    <>
      {error && <div style={{color:t.colors.danger,padding:'1rem',background:'#fff5f5',borderRadius:8,marginBottom:16}}>{error}</div>}
      <AdminDataTable
        title="Saved Cards"
        subtitle="Cards are auto-saved from Stripe payments. Each physical card stored once (deduped by fingerprint)."
        actions={<IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn>}
        searchArea={
          <SBar><Search size={14}/><SInp placeholder="Name, email, or last 4 digits…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></SBar>
        }
        columns={CARD_COLS}
        rows={cards??[]}
        loading={loading}
        emptyIcon={<CreditCard size={36}/>}
        emptyTitle="No cards yet"
        emptyText="Cards appear here automatically after customers pay via Stripe"
        renderRow={(c) => {
          const expired = isExpired(c.expiryMonth, c.expiryYear);
          const isAuto  = c.source === 'stripe_order';
          return (
            <TR key={c.id}>
              <TD>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <CardBrand $type={c.cardType.toLowerCase()}><CreditCard size={11}/>{c.cardType}</CardBrand>
                  <span style={{fontFamily:t.fonts.mono,fontWeight:700,color:t.colors.textPrimary,fontSize:'0.9rem',letterSpacing:'1px'}}>•••• {c.last4||'????'}</span>
                </div>
                {c.fingerprint && <div style={{fontSize:'0.68rem',color:t.colors.textMuted,marginTop:3,fontFamily:t.fonts.mono}}>fp: {c.fingerprint.slice(0,12)}…</div>}
              </TD>
              <TD style={{fontWeight:500,color:t.colors.textPrimary}}>{c.cardholderName||<span style={{color:t.colors.textMuted}}>—</span>}</TD>
              <TD><PersonName>{c.userName||'Guest'}</PersonName><PersonSub>{c.userEmail}</PersonSub></TD>
              <TD>
                {c.expiryMonth && c.expiryYear ? (
                  <><span style={{fontFamily:t.fonts.mono,fontSize:'0.85rem',fontWeight:600,color:expired?t.colors.danger:t.colors.textPrimary}}>{c.expiryMonth}/{c.expiryYear}</span>
                  {expired && <StatusPill $variant="danger" style={{marginLeft:6,fontSize:'0.68rem'}}>Expired</StatusPill>}</>
                ) : <span style={{color:t.colors.textMuted}}>—</span>}
              </TD>
              <TD style={{textAlign:'center'}}><SourceBadge $auto={isAuto}>{isAuto?'🔒 Stripe':'✏️ Manual'}</SourceBadge></TD>
              <TD style={{textAlign:'center'}}>
                {c.isDefault ? <StatusPill $variant="success">Default</StatusPill> : <span style={{color:t.colors.textMuted,fontSize:'0.8rem'}}>—</span>}
              </TD>
              <TD style={{fontSize:'0.8rem',color:t.colors.textMuted}}>
                {formatDate(c.createdAt)}
                {c.lastOrderId && <div style={{fontSize:'0.7rem',color:t.colors.primary,cursor:'pointer',marginTop:2}} onClick={()=>navigate(`/admin/orders/${c.lastOrderId}`)} title="Go to linked order">#{c.lastOrderId.slice(0,8)}…</div>}
              </TD>
              <TD style={{textAlign:'center'}}>
                <IconBtn $variant="danger" title="Delete card" onClick={()=>handleDelete(c)}><Trash2 size={14}/></IconBtn>
              </TD>
            </TR>
          );
        }}
        showPagination
        paginationInfo={`${pagination?.total??0} card${(pagination?.total??0)!==1?'s':''} stored`}
        currentPage={page}
        totalPages={pagination?.totalPages??1}
        onPageChange={setPage}
      />
    </>
  );
};

// ── CONTACTS PAGE ────────────────────────────────────────────────────────
const contactStatusV=(s:string)=>s==='new'?'danger':s==='read'?'warning':s==='replied'?'success':'neutral';

const CONTACT_COLS: ColDef[] = [
  { key: 'from',    label: 'From' },
  { key: 'subject', label: 'Subject' },
  { key: 'status',  label: 'Status'},
  { key: 'received',label: 'Received' },
  { key: 'actions', label: 'Actions', sortable: false, thProps: { $width: '180px' } },
];

export const ContactsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<Contact|null>(null);

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
      refetch();
    } catch(err) { dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Delete failed',type:'error'})); }
  }, [dispatch, refetch]);

  return (
    <>
      {error && <div style={{color:t.colors.danger,padding:'1rem',background:'#fff5f5',borderRadius:8,marginBottom:16}}>{error}</div>}
      <AdminDataTable
        title="Messages"
        subtitle="Customer inquiries and messages"
        actions={<IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn>}
        searchArea={
          <SBar><Search size={14}/><SInp placeholder="Name or subject…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></SBar>
        }
        filterArea={
          <FilterBtn>
            <Filter size={14}/>
            <select style={{border:'none',outline:'none',background:'transparent',fontSize:'0.875rem',cursor:'pointer',color:t.colors.textSecondary}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
              <option value="all">All Statuses</option>
              {['new','read','replied','archived'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </FilterBtn>
        }
        columns={CONTACT_COLS}
        rows={contacts??[]}
        loading={loading}
        emptyIcon={<MessageSquare size={36}/>}
        emptyTitle="No messages found"
        renderRow={(c) => (
          <TR key={c.id} style={{cursor:'pointer'}} onClick={()=>{setSelected(c);if(c.status==='new')changeStatus(c,'read');}}>
            <TD><PersonName style={{fontWeight:c.status==='new'?700:500}}>{c.name}</PersonName><PersonSub>{c.email}</PersonSub></TD>
            <TD style={{maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:c.status==='new'?600:400}}>{c.subject||c.message.slice(0,60)}</TD>
            <TD><StatusPill $variant={contactStatusV(c.status) as any}>{c.status}</StatusPill></TD>
            <TD style={{fontSize:'0.8rem'}}>{formatDate(c.createdAt)}</TD>
            <TD style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
              <PortalDropdown>
                <MenuItem onClick={()=>{closeAllDropdowns();setSelected(c);}}><Eye size={13}/> View</MenuItem>
                <MenuItem onClick={()=>changeStatus(c,'replied')}><CheckCircle size={13}/> Mark Replied</MenuItem>
                <MenuItem onClick={()=>changeStatus(c,'archived')}><MoreHorizontal size={13}/> Archive</MenuItem>
                <MenuItem $danger onClick={()=>handleDelete(c.id)}><Trash2 size={13}/> Delete</MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={`Showing ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,pagination?.total??0)} of ${pagination?.total??0}`}
        currentPage={page}
        totalPages={pagination?.totalPages??1}
        onPageChange={setPage}
      />

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

// ── BLOG PAGE ────────────────────────────────────────────────────────────
const blogStatusV=(s:string)=>s==='published'?'success':s==='draft'?'warning':'neutral';
const BLOG_CATS = ['Nutrition','Recipes','Lifestyle','Gardening','Health','Tips'];
const emptyBlog=()=>({title:'',slug:'',excerpt:'',content:'',author:'',category:'Nutrition',tags:[] as string[],status:'draft' as const});

const UploadBox = styled.label`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  border:2px dashed ${t.colors.border};border-radius:10px;padding:18px;cursor:pointer;
  gap:6px;text-align:center;transition:border-color 0.15s,background 0.15s;background:${t.colors.surfaceAlt};
  &:hover{border-color:${t.colors.primary};background:${t.colors.primaryGhost};}
`;
const UploadHiddenInput = styled.input`display:none;`;
const CoverPreview = styled.img`width:100%;max-height:140px;border-radius:8px;object-fit:cover;border:1px solid ${t.colors.border};`;

type BlogModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

const BLOG_COLS: ColDef[] = [
  { key: 'cover',    label: 'Cover', thProps: { style: { width: 56 } } },
  { key: 'title',    label: 'Title' },
  { key: 'author',   label: 'Author' },
  { key: 'category', label: 'Category' },
  { key: 'status',   label: 'Status', thProps: { $center: true } },
  { key: 'views',    label: 'Views', thProps: { $center: true } },
  { key: 'updated',  label: 'Updated' },
  { key: 'actions',  label: 'Actions', sortable: false, thProps: { $width: '150px' } },
];

export const BlogsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const [search,      setSearch]      = useState('');
  const [statusF,     setStatusF]     = useState('all');
  const [page,        setPage]        = useState(1);
  const [blogModal,   setBlogModal]   = useState<BlogModalMode>(null);
  const [editTarget,  setEditTarget]  = useState<AdminBlogPost|null>(null);
  const [deleteTarget,setDeleteTarget]= useState<AdminBlogPost|null>(null);
  const [viewTarget,  setViewTarget]  = useState<AdminBlogPost|null>(null);
  const [saving,      setSaving]      = useState(false);
  const [toggling,    setToggling]    = useState<string|null>(null);
  const [form,        setForm]        = useState<ReturnType<typeof emptyBlog>>(emptyBlog());
  const [coverFile,   setCoverFile]   = useState<File|null>(null);
  const [coverPreview,setCoverPreview]= useState<string>('');
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [selIds,      setSelIds]      = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<'published'|'draft'|'delete'|null>(null);

  const query = useMemo(()=>({page,limit:PAGE_SIZE,search,status:statusF==='all'?undefined:statusF}),[page,search,statusF]);
  const { data:blogs, pagination, loading, error, refetch } = useAdminBlogs(query);

  const toggleBlogStatus = useCallback(async (b: AdminBlogPost) => {
    if (toggling) return;
    const next = b.status === 'published' ? 'draft' : 'published';
    setToggling(b.id);
    try {
      await adminBlogsApi.setStatus(b.id, next as AdminBlogPost['status']);
      dispatch(showAdminToast({ message: `"${b.title}" set to ${next}`, type: 'info' }));
      refetch();
    } catch(err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Update failed', type: 'error' }));
    } finally { setToggling(null); }
  }, [dispatch, refetch, toggling]);

  const setField=(k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>
    setForm((f:any)=>({...f,[k]:e.target.value}));

  const handleCoverChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];if(!f)return;
    setCoverFile(f);
    const r=new FileReader();r.onload=ev=>setCoverPreview(ev.target?.result as string);r.readAsDataURL(f);
  };

  const allIds     = (blogs??[]).map(b => b.id);
  const allChecked = allIds.length > 0 && allIds.every(id => selIds.has(id));
  const toggleAll  = () => setSelIds(allChecked ? new Set() : new Set(allIds));
  const toggleOne  = (id: string) => setSelIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleBulkAction = useCallback(async (action: 'published'|'draft'|'delete') => {
    if (!selIds.size) return;
    setBulkWorking(true);
    const ids = Array.from(selIds);
    try {
      if (action === 'delete') {
        await adminBlogsApi.bulkDelete(ids);
        dispatch(showAdminToast({ message: `${ids.length} post(s) deleted`, type: 'warning' }));
      } else {
        await adminBlogsApi.bulkUpdateStatus(ids, action);
        dispatch(showAdminToast({ message: `${ids.length} post(s) set to ${action}`, type: 'success' }));
      }
      setSelIds(new Set()); setBulkConfirm(null); refetch();
    } catch(err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Bulk action failed', type: 'error' }));
    } finally { setBulkWorking(false); }
  }, [selIds, dispatch, refetch]);

  const openCreate=()=>{
    closeAllDropdowns();
    setForm(emptyBlog());setCoverFile(null);setCoverPreview('');
    setEditTarget(null);setBlogModal('create');
  };

  const openEdit=(b:AdminBlogPost)=>{
    closeAllDropdowns();
    setForm({title:b.title,slug:b.slug||'',excerpt:b.excerpt||'',content:b.content||'',author:b.author,category:b.category||'Nutrition',tags:b.tags||[],status:b.status as any});
    const coverUrl = b.cover || '';
    setCoverPreview(coverUrl.startsWith('http') ? coverUrl : '');
    setCoverFile(null);
    setEditTarget(b);setBlogModal('edit');
  };

  const openView=(b:AdminBlogPost)=>{ closeAllDropdowns(); setViewTarget(b); setBlogModal('view'); };
  const openDelete=(b:AdminBlogPost)=>{ closeAllDropdowns(); setDeleteTarget(b); setBlogModal('delete'); };

  const closeModal=()=>{
    setBlogModal(null);setEditTarget(null);setDeleteTarget(null);setViewTarget(null);
    setCoverFile(null);setCoverPreview('');
  };

  const handleSave = useCallback(async () => {
    if (!form.title||!form.author){ dispatch(showAdminToast({message:'Title and author are required',type:'error'}));return; }
    setSaving(true);
    try {
      const fd=new FormData();
      fd.append('title',form.title); fd.append('author',form.author); fd.append('category',form.category);
      fd.append('status',form.status); fd.append('excerpt',form.excerpt||''); fd.append('content',form.content||'');
      if(coverFile) fd.append('cover',coverFile);
      if(blogModal==='edit' && editTarget){
        await adminBlogsApi.update(editTarget.id, fd);
        dispatch(showAdminToast({message:`"${form.title}" updated`,type:'success'}));
      } else {
        await adminBlogsApi.create(fd);
        dispatch(showAdminToast({message:`"${form.title}" created`,type:'success'}));
      }
      closeModal();refetch();
    } catch(err){
      dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Failed to save post',type:'error'}));
    } finally{setSaving(false);}
  },[dispatch,form,coverFile,blogModal,editTarget,refetch]);

  const handleDelete = useCallback(async () => {
    if(!deleteTarget) return;
    setSaving(true);
    try{
      await adminBlogsApi.delete(deleteTarget.id);
      dispatch(showAdminToast({message:`"${deleteTarget.title}" deleted`,type:'warning'}));
      closeModal();refetch();
    } catch(err){
      dispatch(showAdminToast({message:err instanceof ApiError?err.message:'Delete failed',type:'error'}));
    } finally{setSaving(false);}
  },[dispatch,deleteTarget,refetch]);

  const removeCover=()=>{setCoverFile(null);setCoverPreview('');if(fileRef.current)fileRef.current.value='';};

  const CoverUploadUI = (
    <FormGroup>
      <FormLabel>Cover Image</FormLabel>
      {coverPreview?(
        <div style={{position:'relative'}}>
          <CoverPreview src={coverPreview} alt="preview"/>
          <button onClick={removeCover} style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.55)',border:'none',borderRadius:5,color:'white',cursor:'pointer',padding:'2px 8px',fontSize:11}}>Remove</button>
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
  );

  return (
    <>
      {error && <div style={{color:t.colors.danger,padding:'1rem',background:'#fff5f5',borderRadius:8,marginBottom:16}}>{error}</div>}
      <AdminDataTable
        title="Blog Posts"
        subtitle="Create and manage blog content"
        actions={
          <>
          <AdminBtn $variant="primary" onClick={openCreate}><Plus size={15}/> New Post</AdminBtn>
          <IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16}/></IconBtn>
          </>
        }
        searchArea={
          <SBar><Search size={14}/><SInp placeholder="Search posts…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></SBar>
        }
        filterArea={
          <>
          {selIds.size > 0 && (
            <BulkBar>
              <BulkCount><span>{selIds.size}</span> selected</BulkCount>
              <BulkActionBtn $variant="success" disabled={bulkWorking} onClick={() => setBulkConfirm('published')}><CheckCircle size={12}/> Publish</BulkActionBtn>
              <BulkActionBtn $variant="warning" disabled={bulkWorking} onClick={() => setBulkConfirm('draft')}><XCircle size={12}/> Set Draft</BulkActionBtn>
              <BulkActionBtn $variant="danger" disabled={bulkWorking} onClick={() => setBulkConfirm('delete')}><Trash2 size={12}/> Delete</BulkActionBtn>
              <BulkActionBtn $variant="ghost" disabled={bulkWorking} onClick={() => setSelIds(new Set())}>✕ Clear</BulkActionBtn>
            </BulkBar>
          )}
            <FilterBtn>
              <Filter size={14}/>
              <select style={{border:'none',outline:'none',background:'transparent',fontSize:'0.875rem',cursor:'pointer',color:t.colors.textSecondary}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </FilterBtn>
          </>
        }
        columns={BLOG_COLS}
        selectable
        allChecked={allChecked}
        onToggleAll={toggleAll}
        rows={blogs??[]}
        loading={loading}
        emptyIcon={<BookOpen size={36}/>}
        emptyTitle="No posts found"
        renderRow={(b) => (
          <TR key={b.id}>
            <TD><CheckBox checked={selIds.has(b.id)} onChange={() => toggleOne(b.id)} /></TD>
            <TD style={{padding:'10px 8px 10px 16px'}}>
              {b.cover && b.cover.startsWith('http')
                ? <img src={b.cover} alt={b.title} style={{width:44,height:44,borderRadius:8,objectFit:'cover',border:`1px solid ${t.colors.border}`,display:'block'}} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                : <div style={{width:44,height:44,borderRadius:8,background:t.colors.surfaceAlt,border:`1px solid ${t.colors.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}><BookOpen size={18} color={t.colors.textMuted}/></div>
              }
            </TD>
            <TD style={{maxWidth:260}}>
              <div style={{fontWeight:600,color:t.colors.textPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</div>
              <div style={{fontSize:'0.75rem',color:t.colors.textMuted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.excerpt}</div>
            </TD>
            <TD style={{fontWeight:500,color:t.colors.textPrimary}}>{b.author}</TD>
            <TD>{b.category}</TD>
            <TD style={{textAlign:'center'}}>
              <StatusPill
                $variant={blogStatusV(b.status) as any}
                style={{cursor:toggling===b.id?'wait':'pointer',userSelect:'none',opacity:toggling===b.id?0.6:1}}
                title="Click to toggle published / draft"
                onClick={()=>toggleBlogStatus(b)}
              >{b.status}</StatusPill>
            </TD>
            <TD style={{textAlign:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'center'}}>
                <Star size={12} style={{color:'#FFC107'}}/>{b.views?.toLocaleString()||0}
              </div>
            </TD>
            <TD style={{fontSize:'0.8rem'}}>{formatDate(b.updatedAt)}</TD>
            <TD style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
              <PortalDropdown>
                <MenuItem onClick={()=>openView(b)}><Eye size={13}/> View</MenuItem>
                <MenuItem onClick={()=>openEdit(b)}><Edit2 size={13}/> Edit</MenuItem>
                <MenuItem $danger onClick={()=>openDelete(b)}><Trash2 size={13}/> Delete</MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={`${pagination?.total??0} posts`}
        currentPage={page}
        totalPages={pagination?.totalPages??1}
        onPageChange={setPage}
      />

      {(blogModal==='create'||blogModal==='edit')&&(
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="680px" onClick={e=>e.stopPropagation()}>
            <ModalHeader>
              <span style={{fontWeight:700,fontSize:'1rem',color:t.colors.textPrimary}}>{blogModal==='edit'?`Edit "${editTarget?.title}"`:'New Blog Post'}</span>
              <IconBtn onClick={closeModal}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <FormGrid $cols={2}>
                <FormGroup $span={2}><FormLabel>Title *</FormLabel><AdminInput value={form.title} onChange={setField('title')} placeholder="Post title" autoFocus/></FormGroup>
                <FormGroup><FormLabel>Author *</FormLabel><AdminInput value={form.author} onChange={setField('author')} placeholder="Author name"/></FormGroup>
                <FormGroup><FormLabel>Category</FormLabel><AdminSelect value={form.category} onChange={setField('category')}>{BLOG_CATS.map(c=><option key={c}>{c}</option>)}</AdminSelect></FormGroup>
                <FormGroup><FormLabel>Status</FormLabel><AdminSelect value={form.status} onChange={setField('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></AdminSelect></FormGroup>
                {CoverUploadUI}
                <FormGroup $span={2}><FormLabel>Excerpt</FormLabel><AdminTextarea style={{minHeight:70}} value={form.excerpt} onChange={setField('excerpt')} placeholder="Short summary…"/></FormGroup>
                <FormGroup $span={2}><FormLabel>Content</FormLabel><AdminTextarea style={{minHeight:140}} value={form.content} onChange={setField('content')} placeholder="Full article content…"/></FormGroup>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>Cancel</AdminBtn>
              <AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>{saving?'Saving…':blogModal==='edit'?'Save Changes':'Create Post'}</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {blogModal==='view'&&viewTarget&&(
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="600px" onClick={e=>e.stopPropagation()}>
            <ModalHeader>
              <span style={{fontWeight:700,fontSize:'1rem',color:t.colors.textPrimary}}>Blog Post Details</span>
              <IconBtn onClick={closeModal}>✕</IconBtn>
            </ModalHeader>
            <ModalBody style={{display:'flex',flexDirection:'column',gap:14}}>
              {viewTarget.cover&&viewTarget.cover.startsWith('http')&&(
                <img src={viewTarget.cover} alt={viewTarget.title} style={{width:'100%',maxHeight:160,objectFit:'cover',borderRadius:8,border:`1px solid ${t.colors.border}`}}/>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {([['Title',viewTarget.title],['Author',viewTarget.author],['Category',viewTarget.category||'—'],['Status',viewTarget.status],['Views',String(viewTarget.views||0)],['Updated',formatDate(viewTarget.updatedAt)]] as [string,string][]).map(([label,val])=>(
                  <div key={label}><div style={{fontSize:'0.75rem',color:t.colors.textMuted,marginBottom:2}}>{label}</div><div style={{fontSize:'0.875rem',fontWeight:500,color:t.colors.textPrimary,textTransform:'capitalize'}}>{val}</div></div>
                ))}
              </div>
              {viewTarget.excerpt&&<div><div style={{fontSize:'0.75rem',color:t.colors.textMuted,marginBottom:4}}>Excerpt</div><div style={{fontSize:'0.875rem',color:t.colors.textSecondary,lineHeight:1.6}}>{viewTarget.excerpt}</div></div>}
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>Close</AdminBtn>
              <AdminBtn $variant="primary" onClick={()=>{closeModal();openEdit(viewTarget);}}>Edit Post</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {blogModal==='delete'&&deleteTarget&&(
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="420px" onClick={e=>e.stopPropagation()}>
            <ModalHeader><span style={{fontWeight:700,fontSize:'1rem',color:t.colors.danger}}>Delete Post</span><IconBtn onClick={closeModal}>✕</IconBtn></ModalHeader>
            <ModalBody><p style={{color:t.colors.textSecondary,fontSize:'0.875rem',lineHeight:1.6}}>Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This cannot be undone.</p></ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>Cancel</AdminBtn>
              <AdminBtn $variant="danger" onClick={handleDelete} disabled={saving} style={{background:t.colors.danger,color:'white'}}>{saving?'Deleting…':'Delete Post'}</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {bulkConfirm && (
        <ModalBackdrop onClick={() => setBulkConfirm(null)}>
          <ModalBox $width="420px" onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <span style={{fontWeight:700,fontSize:'1rem',color:t.colors.textPrimary}}>
                {bulkConfirm === 'delete' ? 'Delete Selected Posts' : bulkConfirm === 'published' ? 'Publish Selected Posts' : 'Set Posts to Draft'}
              </span>
              <IconBtn onClick={() => setBulkConfirm(null)}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <p style={{color:t.colors.textSecondary,fontSize:'0.875rem',lineHeight:1.6,margin:0}}>
                {bulkConfirm === 'delete'
                  ? <>Are you sure you want to delete <strong>{selIds.size} post(s)</strong>? This cannot be undone.</>
                  : <>Set <strong>{selIds.size} post(s)</strong> to <strong>{bulkConfirm}</strong>?</>}
              </p>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setBulkConfirm(null)} disabled={bulkWorking}>Cancel</AdminBtn>
              <AdminBtn $variant={bulkConfirm === 'delete' ? 'danger' : 'primary'} disabled={bulkWorking} onClick={() => handleBulkAction(bulkConfirm)}>
                {bulkWorking ? 'Processing…' : bulkConfirm === 'delete' ? `Delete ${selIds.size}` : bulkConfirm === 'published' ? `Publish ${selIds.size}` : `Draft ${selIds.size}`}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </>
  );
};