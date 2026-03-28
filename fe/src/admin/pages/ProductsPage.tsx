import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalDropdown, MenuItem, closeAllDropdowns } from '../components/PortalDropdown';
import styled from 'styled-components';
import {
  Plus, Search, Trash2, Package, RefreshCw, Edit2, Eye, Download, Filter, Upload,
  AlertTriangle, TrendingDown, CheckCircle,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminCard, AdminBtn, IconBtn, StatusPill, AdminInput, AdminSelect, AdminTextarea,
  FormGroup, FormLabel, FormGrid,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter, PageBtns, PageBtn, SectionTitle, EmptyState,
} from '../styles/adminShared';
import { adminProductsApi } from '../../api/admin';
import { API_BASE } from '../../api/client';
import { useAdminProducts, useAdminCategories } from '../../hooks/useAdminApi';
import { useAdminDispatch, showAdminToast } from '../store';
import { AdminProduct } from '../../api/admin';
import { ApiError } from '../../api/client';
import { formatDate } from '../utils/formatDate';

/* ── Styled ─────────────────────────────────────────────────── */
const PageHeader = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
`;
const PageTitle = styled.h1`
  font-size: 1.375rem; font-weight: 700; color: ${t.colors.textPrimary};
  margin: 0 0 2px;
`;
const PageSub = styled.p`font-size: 0.8125rem; color: ${t.colors.textMuted}; margin: 0;`;
const HeaderBtns = styled.div`display: flex; gap: 10px; flex-wrap: wrap;`;

const TableWrap = styled(AdminCard)`padding: 0; overflow: hidden;`;
const TableInner = styled.div`overflow-x: auto;`;

const Tbl = styled.table`width: 100%; border-collapse: collapse; font-family: ${t.fonts.body};`;
const THead = styled.thead`background: ${t.colors.surfaceAlt}; border-bottom: 1px solid ${t.colors.border};`;
const TH = styled.th<{ $check?: boolean; $center?: boolean }>`
  padding: 12px 16px;
  font-size: 0.75rem; font-weight: 600; color: ${t.colors.textMuted};
  text-align: ${({ $center }) => $center ? 'center' : 'left'};
  white-space: nowrap;
  ${({ $check }) => $check && 'width: 40px; padding: 12px 8px 12px 16px;'}
`;
const TR = styled.tr`
  border-bottom: 1px solid ${t.colors.border};
  transition: background 0.12s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${t.colors.surfaceAlt}; }
`;
const TD = styled.td<{ $check?: boolean; $center?: boolean }>`
  padding: 14px 16px;
  font-size: 0.8125rem; color: ${t.colors.textSecondary};
  vertical-align: middle;
  ${({ $check }) => $check && 'padding: 14px 8px 14px 16px; width: 40px;'}
  ${({ $center }) => $center && 'text-align: center;'}
`;

const ProductCell = styled.div`display: flex; align-items: center; gap: 12px;`;
const ProductThumb = styled.img`
  width: 44px; height: 44px; border-radius: 8px; object-fit: cover;
  border: 1px solid ${t.colors.border}; flex-shrink: 0;
`;
const ProductThumbPh = styled.div`
  width: 44px; height: 44px; border-radius: 8px;
  background: ${t.colors.surfaceAlt}; border: 1px solid ${t.colors.border};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;
const ProductName = styled.div`font-weight: 600; color: ${t.colors.textPrimary}; font-size: 0.875rem;`;
const ProductSku  = styled.div`font-size: 0.75rem; color: ${t.colors.textMuted}; margin-top: 2px;`;

let LOW_STOCK_THRESHOLD = 5;

const StockBadge = styled.span<{ $out: boolean; $low?: boolean }>`
  font-size: 0.75rem; font-weight: 600;
  color: ${({ $out, $low }) => $out ? t.colors.danger : $low ? '#ea580c' : t.colors.success};
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 20px;
  background: ${({ $out, $low }) => $out ? t.colors.dangerBg : $low ? '#fff7ed' : t.colors.successBg};
  border: 1px solid ${({ $out, $low }) => $out ? t.colors.danger : $low ? '#fb923c' : t.colors.success};
  transition: opacity 0.15s;
  user-select: none;
  display: inline-flex; align-items: center; gap: 4px;
  &:hover { opacity: 0.75; }
  &:active { opacity: 0.55; }
`;

const CheckBox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px; height: 16px; cursor: pointer; accent-color: ${t.colors.primary};
`;


const SearchBar2  = styled.div`display:flex;align-items:center;gap:8px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 12px;background:white;height:40px;min-width:200px;`;
const SearchInput2= styled.input`border:none;outline:none;font-size:0.875rem;background:transparent;flex:1;color:${t.colors.textPrimary};&::placeholder{color:${t.colors.textMuted};}`;
const FilterBtn   = styled.button`display:flex;align-items:center;gap:6px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 14px;height:40px;background:white;font-size:0.875rem;font-weight:500;color:${t.colors.textSecondary};cursor:pointer;&:hover{background:${t.colors.surfaceAlt};}`;
const ExportBtn   = styled(FilterBtn)``;

/* Image upload */
const UploadBox = styled.label`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 2px dashed ${t.colors.border}; border-radius: 12px;
  padding: 24px; cursor: pointer; gap: 8px; text-align: center;
  transition: border-color 0.15s, background 0.15s;
  &:hover { border-color: ${t.colors.primary}; background: ${t.colors.primaryGhost}; }
`;
const UploadInput = styled.input`display: none;`;
const PreviewImg  = styled.img`width: 80px; height: 80px; border-radius: 10px; object-fit: cover; border: 1px solid ${t.colors.border};`;

const PAGE_SIZE = 7;

const emptyForm = (): Partial<AdminProduct> & { imageFile?: File | null } => ({
  name: '', category: '' as string, price: 0, stock: 0, sku: '',
  description: '', image: '', status: 'active', rating: 4.0, reviews: 0,
  badge: '', imageFile: null,
});

export const ProductsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const navigate = useNavigate();
  const { data: categoriesData, loading: catsLoading, refetch: refetchCats } = useAdminCategories();
  // Only show active categories in filters and form dropdowns
  const categories = (categoriesData ?? []).filter(c => c.status === 'active');

  // Refetch categories every time this page mounts (in case new ones were added)
  React.useEffect(() => { refetchCats(); }, [refetchCats]);

  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page,         setPage]         = useState(1);
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [modalOpen,    setModalOpen]    = useState(false);
  const [viewId,       setViewId]       = useState<string|null>(null);
  const [deleteId,     setDeleteId]     = useState<string|null>(null);
  const [editTarget,   setEditTarget]   = useState<AdminProduct|null>(null);
  const [form,         setForm]         = useState<Partial<AdminProduct> & { imageFile?: File|null }>(emptyForm());
  const [saving,       setSaving]       = useState(false);
  const [toggling,     setToggling]     = useState<string | null>(null); // productId being toggled
  const [, setOpenMenuId]   = useState<string|null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const query = useMemo(() => ({
    page, limit: PAGE_SIZE, search,
    category: catFilter === 'all' ? '' : catFilter,
    status:   statusFilter === 'all' ? '' : statusFilter,
  }), [page, search, catFilter, statusFilter]);

  const { data: products, pagination, loading, error, refetch } = useAdminProducts(query);
  const allIds = (products ?? []).map(p => p.id);
  const allChecked = allIds.length > 0 && allIds.every(id => selected.has(id));

  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allIds));
  const toggleOne = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openAdd = () => {
    closeAllDropdowns();
    setEditTarget(null);
    setForm({ ...emptyForm(), category: categories[0]?.name ?? '' });
    setImagePreview('');
    setModalOpen(true);
  };
  const openEdit = (p: AdminProduct) => {
    closeAllDropdowns();
    setEditTarget(p);
    setForm({ ...p, imageFile: null });
    const rawUrl = p.image || p.thumbnail || '';
    setImagePreview(rawUrl.startsWith('http') ? rawUrl : rawUrl ? `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${rawUrl}` : '');
    setModalOpen(true);
    setOpenMenuId(null);
  };
  const close = () => { setModalOpen(false); setEditTarget(null); setForm(emptyForm()); setImagePreview(''); };

  const setField = (k: keyof AdminProduct) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, imageFile: file }));
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.price) {
      dispatch(showAdminToast({ message: 'Name, SKU and price are required', type: 'error' })); return;
    }
    setSaving(true);
    try {
      // If there's a file, upload via multipart; otherwise JSON
      const { imageFile, ...rest } = form;
      if (imageFile) {
        // Fields the server owns — never send these back or validation breaks
        const SERVER_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'image', 'thumbnail', 'images', 'reviewCount']);
        const fd = new FormData();
        Object.entries(rest).forEach(([k, v]) => {
          if (SERVER_FIELDS.has(k)) return;     // skip read-only / computed fields
          if (v === undefined) return;
          if (v === null) return;
          if (k === 'tags') {
            const arr = Array.isArray(v) ? v : String(v).split(',').map((s:string) => s.trim()).filter(Boolean);
            arr.forEach((tag:string) => fd.append('tags', tag));
            return;
          }
          fd.append(k, String(v));
        });
        // Always send badge explicitly so an empty value clears it in the database
        if (!fd.has('badge')) fd.append('badge', '');
        fd.append('thumbnail', imageFile);
        const token = sessionStorage.getItem('vf_access');
        const url   = editTarget
          ? `${API_BASE}/api/admin/products/${editTarget.id}`
          : `${API_BASE}/api/admin/products`;
        const res = await fetch(url, {
          method: editTarget ? 'PUT' : 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      } else {
        // Ensure badge is always sent so an empty value clears it in the database
        const payload = { ...rest, badge: rest.badge ?? '' };
        if (editTarget) {
          await adminProductsApi.update(editTarget.id, payload as AdminProduct);
        } else {
          await adminProductsApi.create(payload as AdminProduct);
        }
      }
      dispatch(showAdminToast({ message: `"${form.name}" ${editTarget ? 'updated' : 'created'}`, type: 'success' }));
      close(); refetch();
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : String(err), type: 'error' }));
    } finally { setSaving(false); }
  };

  const handleDelete = useCallback(async (id: string, name: string) => {
    try {
      await adminProductsApi.delete(id);
      setDeleteId(null); setOpenMenuId(null); refetch();
      dispatch(showAdminToast({ message: `"${name}" deleted`, type: 'warning' }));
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Delete failed', type: 'error' }));
    }
  }, [dispatch, refetch]);

  const toggleStatus = useCallback(async (p: AdminProduct) => {
    if (toggling) return;
    const next = p.status === 'active' ? 'inactive'
               : p.status === 'inactive' ? 'active'
               : p.status === 'out_of_stock' ? 'active'
               : 'active';
    setToggling(p.id);
    try {
      await adminProductsApi.updateStatus(p.id, next as AdminProduct['status']);
      dispatch(showAdminToast({ message: `"${p.name}" set to ${next}`, type: 'info' }));
      refetch();
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Update failed', type: 'error' }));
    } finally { setToggling(null); }
  }, [dispatch, refetch, toggling]);

  // ── Restock modal ────────────────────────────────────────
  const [restockTarget, setRestockTarget] = useState<AdminProduct | null>(null);
  const [restockQty,    setRestockQty]    = useState('');
  const [restocking,    setRestocking]    = useState(false);

  const openRestock  = (p: AdminProduct) => { setRestockTarget(p); setRestockQty(String(p.stock ?? 0)); };
  const closeRestock = () => { setRestockTarget(null); setRestockQty(''); };

  const handleRestock = useCallback(async () => {
    if (!restockTarget) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty < 0) {
      dispatch(showAdminToast({ message: 'Enter a valid stock quantity (≥ 0)', type: 'error' }));
      return;
    }
    setRestocking(true);
    try {
      await adminProductsApi.update(restockTarget.id, { stock: qty } as Partial<AdminProduct>);
      dispatch(showAdminToast({
        message: qty === 0
          ? `"${restockTarget.name}" marked Out of Stock`
          : `"${restockTarget.name}" stock updated to ${qty} units`,
        type: qty === 0 ? 'warning' : 'success',
      }));
      closeRestock();
      refetch();
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Restock failed', type: 'error' }));
    } finally { setRestocking(false); }
  }, [restockTarget, restockQty, dispatch, refetch]);

  const toggleStock = useCallback(async (p: AdminProduct) => {
    openRestock(p);
  }, []);

  const viewProduct = (products ?? []).find(p => p.id === viewId);

  // ── Import ─────────────────────────────────────────────────
  const importRef = React.useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!importRef.current) return;
    importRef.current.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = sessionStorage.getItem('vf_access');
      const res = await fetch(`${API_BASE}/api/admin/products/import`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        dispatch(showAdminToast({ message: data.message || `Import complete: ${data.data?.created} products added`, type: 'success' }));
        refetch();
      } else {
        dispatch(showAdminToast({ message: data.message || 'Import failed', type: 'error' }));
      }
    } catch (err) {
      dispatch(showAdminToast({ message: 'Import failed. Check file format.', type: 'error' }));
    } finally { setImporting(false); }
  };

  return (
    <section onClick={() => setOpenMenuId(null)}>
      {/* Header */}
      <PageHeader>
        <div>
          <PageTitle>Products</PageTitle>
          <PageSub>Track and manage your store products</PageSub>
        </div>
        <HeaderBtns>
          <ExportBtn><Download size={15} /> Export</ExportBtn>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={handleImport} />
          <ExportBtn onClick={() => importRef.current?.click()} style={{ cursor:'pointer' }} title="Import products from Excel/CSV">
            {importing ? <><RefreshCw size={14} style={{ animation:'spin 0.8s linear infinite' }}/> Importing…</> : <><Upload size={15} /> Import</>}
          </ExportBtn>
          <AdminBtn $variant="primary" onClick={openAdd}><Plus size={15} /> Add Product</AdminBtn>
        </HeaderBtns>
      </PageHeader>

      <TableWrap>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: t.colors.textPrimary, fontSize: '0.9375rem' }}>Products List</div>
            <div style={{ fontSize: '0.8rem', color: t.colors.textMuted }}>Track your store's progress to boost your sales.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <SearchBar2>
              <Search size={15} color={t.colors.textMuted} />
              <SearchInput2 placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </SearchBar2>
            <AdminSelect style={{ height: 40, borderRadius: 10, width: 150 }} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
              <option value="all">{catsLoading ? 'Loading…' : 'All Categories'}</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </AdminSelect>
            <AdminSelect style={{ height: 40, borderRadius: 10, width: 130 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </AdminSelect>
            <FilterBtn onClick={refetch}><Filter size={15} /> Filter</FilterBtn>
          </div>
        </div>

        {error && <div style={{ color: t.colors.danger, padding: '1rem', background: '#fff5f5' }}>{error}</div>}

        <TableInner>
          <Tbl>
            <THead>
              <tr>
                <TH $check><CheckBox checked={allChecked} onChange={toggleAll} /></TH>
                <TH>Products</TH>
                <TH>Category</TH>
                <TH>Brand</TH>
                <TH>Price</TH>
                <TH $center>Status</TH>
                <TH $center>Stock</TH>
                <TH>Created At</TH>
                <TH $center style={{ width: 60 }}></TH>
              </tr>
            </THead>
            <tbody>
              {loading ? (
                <tr><TD colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: t.colors.textMuted }}>Loading…</TD></tr>
              ) : (products ?? []).length === 0 ? (
                <tr><TD colSpan={9}>
                  <EmptyState><Package size={36} /><h3>No products found</h3><p>Try adjusting your filters or add a new product.</p></EmptyState>
                </TD></tr>
              ) : (products ?? []).map(p => (
                <TR key={p.id}>
                  <TD $check><CheckBox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} /></TD>
                  <TD>
                    <ProductCell>
                      {p.image || p.thumbnail
                        ? <ProductThumb src={(() => { const u = p.image || p.thumbnail || ''; return u.startsWith('http') ? u : `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${u}`; })()} alt={p.name} />
                        : <ProductThumbPh><Package size={18} color={t.colors.textMuted} /></ProductThumbPh>
                      }
                      <div>
                        <ProductName>{p.name}</ProductName>
                        <ProductSku>{p.sku}</ProductSku>
                      </div>
                    </ProductCell>
                  </TD>
                  <TD style={{ textTransform: 'capitalize' }}>{p.category || '—'}</TD>
                  <TD style={{ color: t.colors.textMuted }}>{p.badge || '—'}</TD>
                  <TD style={{ fontWeight: 700, color: t.colors.textPrimary }}>${p.price}</TD>
                  <TD $center>
                    <StatusPill
                      $variant={
                        p.status === 'active' ? 'success' :
                        p.status === 'out_of_stock' ? 'danger' :
                        p.status === 'draft' ? 'warning' : 'neutral'
                      }
                      style={{ cursor: toggling === p.id ? 'wait' : 'pointer', userSelect: 'none', opacity: toggling === p.id ? 0.6 : 1 }}
                      title="Click to toggle status"
                      onClick={e => { e.stopPropagation(); toggleStatus(p); }}
                    >
                      {p.status === 'out_of_stock' ? 'out of stock' : p.status}
                    </StatusPill>
                  </TD>
                  <TD $center>
                    <StockBadge
                      $out={(p.stock ?? 0) === 0 || p.status === 'out_of_stock'}
                      $low={(p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD}
                      title="Click to update stock"
                      onClick={e => { e.stopPropagation(); toggleStock(p); }}
                    >
                      {(p.stock ?? 0) === 0 || p.status === 'out_of_stock' ? (
                        <><AlertTriangle size={11} /> Out of Stock</>
                      ) : (p.stock ?? 0) <= LOW_STOCK_THRESHOLD ? (
                        <><TrendingDown size={11} /> {p.stock} left</>
                      ) : (
                        <><CheckCircle size={11} /> {p.stock} in stock</>
                      )}
                    </StockBadge>
                  </TD>
                  <TD>{formatDate(p.createdAt)}</TD>
                  <TD $center onClick={e => e.stopPropagation()}>
                    <PortalDropdown>
                      <MenuItem onClick={() => { closeAllDropdowns(); navigate(`/admin/products/${p.id}`); }}><Eye size={14} /> View More</MenuItem>
                      <MenuItem onClick={() => openEdit(p)}><Edit2 size={14} /> Edit</MenuItem>
                      <MenuItem $danger onClick={() => setDeleteId(p.id)}><Trash2 size={14} /> Delete</MenuItem>
                    </PortalDropdown>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Tbl>
        </TableInner>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${t.colors.border}`, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.8125rem', color: t.colors.textMuted }}>
            Showing 1 to {Math.min(page * PAGE_SIZE, pagination?.total ?? 0)} of {pagination?.total ?? 0}
          </span>
          <PageBtns>
            <PageBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</PageBtn>
            {Array.from({ length: pagination?.totalPages ?? 1 }, (_, i) => (
              <PageBtn key={i + 1} $active={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PageBtn>
            ))}
            <PageBtn disabled={page === (pagination?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>›</PageBtn>
          </PageBtns>
        </div>
      </TableWrap>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <ModalBackdrop onClick={close}>
          <ModalBox $width="660px" onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <SectionTitle>{editTarget ? `Edit "${editTarget.name}"` : 'Add New Product'}</SectionTitle>
              <IconBtn onClick={close}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <FormGrid $cols={2}>
                <FormGroup $span={2}>
                  <FormLabel>Product Name *</FormLabel>
                  <AdminInput value={form.name ?? ''} onChange={setField('name')} placeholder="e.g. Cherry Tomatoes" autoFocus />
                </FormGroup>

                <FormGroup>
                  <FormLabel>SKU *</FormLabel>
                  <AdminInput value={form.sku ?? ''} onChange={setField('sku')} placeholder="VEG-013" />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Category</FormLabel>
                  <AdminSelect value={form.category ?? ''} onChange={setField('category')}>
                    <option value="">
                      {catsLoading ? 'Loading categories…' : '— Select category —'}
                    </option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </AdminSelect>
                  {!catsLoading && categories.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#f79009', marginTop: 4, display: 'block' }}>
                      ⚠️ No categories yet — add them in <strong>Products → Product Categories</strong> first.
                    </span>
                  )}
                </FormGroup>

                <FormGroup>
                  <FormLabel>Price ($) *</FormLabel>
                  <AdminInput type="number" min={0} step={0.01} value={form.price ?? ''} onChange={setField('price')} />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Original Price ($)</FormLabel>
                  <AdminInput type="number" min={0} step={0.01} value={form.originalPrice ?? ''} onChange={setField('originalPrice')} placeholder="Leave empty if no discount" />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Stock (units)</FormLabel>
                  <AdminInput type="number" min={0} value={form.stock ?? ''} onChange={setField('stock')} />
                </FormGroup>

                {/* Availability Status — In Stock / Out of Stock */}
                <FormGroup>
                  <FormLabel>Availability</FormLabel>
                  <AdminSelect
                    value={(form.stock ?? 0) > 0 ? 'instock' : 'outofstock'}
                    onChange={e => {
                      if (e.target.value === 'outofstock') setForm(f => ({ ...f, stock: 0 }));
                      else if ((form.stock ?? 0) === 0) setForm(f => ({ ...f, stock: 1 }));
                    }}
                  >
                    <option value="instock">In Stock</option>
                    <option value="outofstock">Out of Stock</option>
                  </AdminSelect>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Status</FormLabel>
                  <AdminSelect value={form.status ?? 'active'} onChange={setField('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </AdminSelect>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Brand / Badge</FormLabel>
                  <AdminInput value={form.badge ?? ''} onChange={setField('badge')} placeholder="e.g. SALE, Organic" />
                </FormGroup>

                {/* Product Image Upload */}
                <FormGroup $span={2}>
                  <FormLabel>Product Image</FormLabel>
                  <UploadBox htmlFor="product-img-upload">
                    <UploadInput
                      id="product-img-upload"
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      onChange={handleImageFile}
                    />
                    {imagePreview ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <PreviewImg src={imagePreview} alt="preview"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>Click to change image</span>
                      </div>
                    ) : (
                      <>
                        <Package size={32} color={t.colors.textMuted} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: t.colors.textSecondary }}>
                          Click to upload image
                        </span>
                        <span style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>PNG, JPG, WebP up to 5MB</span>
                      </>
                    )}
                  </UploadBox>
                </FormGroup>

                <FormGroup $span={2}>
                  <FormLabel>Description</FormLabel>
                  <AdminTextarea value={form.description ?? ''} onChange={setField('description')} placeholder="Describe the product…" style={{ minHeight: 80 }} />
                </FormGroup>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={close}>Cancel</AdminBtn>
              <AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Product'}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── View Modal ── */}
      {viewProduct && (
        <ModalBackdrop onClick={() => setViewId(null)}>
          <ModalBox $width="520px" onClick={e => e.stopPropagation()}>
            <ModalHeader><SectionTitle>{viewProduct.name}</SectionTitle><IconBtn onClick={() => setViewId(null)}>✕</IconBtn></ModalHeader>
            <ModalBody>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <ProductThumb src={(() => { const u = viewProduct.image || viewProduct.thumbnail || ''; return u ? (u.startsWith('http') ? u : `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${u}`) : 'https://placehold.co/80x80/e8f5e9/4CAF50?text=P'; })()} alt={viewProduct.name}
                  style={{ width: 80, height: 80 }}
                  onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/80x80/e8f5e9/4CAF50?text=P`; }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: t.colors.textPrimary }}>{viewProduct.name}</div>
                  <div style={{ color: t.colors.textMuted, fontSize: '0.8rem' }}>SKU: {viewProduct.sku}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                    <StatusPill $variant={viewProduct.status === 'active' ? 'success' : 'neutral'}>{viewProduct.status}</StatusPill>
                    <StockBadge $out={(viewProduct.stock ?? 0) === 0} style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {(viewProduct.stock ?? 0) === 0 ? 'Out of Stock' : 'In Stock'}
                    </StockBadge>
                  </div>
                </div>
              </div>
              <FormGrid $cols={2}>
                <FormGroup><FormLabel>Category</FormLabel><div style={{ textTransform: 'capitalize' }}>{viewProduct.category || '—'}</div></FormGroup>
                <FormGroup><FormLabel>Price</FormLabel><div style={{ fontWeight: 700 }}>${viewProduct.price}</div></FormGroup>
                <FormGroup><FormLabel>Stock</FormLabel><div>{viewProduct.stock} units</div></FormGroup>
                <FormGroup><FormLabel>Rating</FormLabel><div>⭐ {viewProduct.rating} ({viewProduct.reviews} reviews)</div></FormGroup>
                <FormGroup><FormLabel>Created</FormLabel><div>{formatDate(viewProduct.createdAt)}</div></FormGroup>
                <FormGroup><FormLabel>Updated</FormLabel><div>{formatDate(viewProduct.updatedAt)}</div></FormGroup>
                {viewProduct.description && <FormGroup $span={2}><FormLabel>Description</FormLabel><div style={{ color: t.colors.textSecondary, lineHeight: 1.6 }}>{viewProduct.description}</div></FormGroup>}
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setViewId(null)}>Close</AdminBtn>
              <AdminBtn $variant="primary" onClick={() => { setViewId(null); openEdit(viewProduct); }}>Edit Product</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Restock / Stock Update Modal ── */}
      {restockTarget && (
        <ModalBackdrop onClick={closeRestock}>
          <ModalBox $width="460px" onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <SectionTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={18} />
                Update Stock — {restockTarget.name}
              </SectionTitle>
              <IconBtn onClick={closeRestock}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              {/* Current status summary */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 8, marginBottom: 20,
                background: (restockTarget.stock ?? 0) === 0 ? t.colors.dangerBg : (restockTarget.stock ?? 0) <= LOW_STOCK_THRESHOLD ? '#fff7ed' : t.colors.successBg,
                border: `1px solid ${(restockTarget.stock ?? 0) === 0 ? t.colors.danger : (restockTarget.stock ?? 0) <= LOW_STOCK_THRESHOLD ? '#fb923c' : t.colors.success}`,
              }}>
                {(restockTarget.stock ?? 0) === 0
                  ? <AlertTriangle size={16} color={t.colors.danger} />
                  : (restockTarget.stock ?? 0) <= LOW_STOCK_THRESHOLD
                    ? <TrendingDown size={16} color="#ea580c" />
                    : <CheckCircle size={16} color={t.colors.success} />}
                <span style={{ fontSize: '0.875rem', fontWeight: 600,
                  color: (restockTarget.stock ?? 0) === 0 ? t.colors.danger : (restockTarget.stock ?? 0) <= LOW_STOCK_THRESHOLD ? '#ea580c' : t.colors.success }}>
                  Current stock: {restockTarget.stock ?? 0} units
                  {(restockTarget.stock ?? 0) === 0 ? ' — Out of Stock' : (restockTarget.stock ?? 0) <= LOW_STOCK_THRESHOLD ? ' — Low Stock' : ' — In Stock'}
                </span>
              </div>

              <FormGroup>
                <FormLabel>New Stock Quantity</FormLabel>
                <AdminInput
                  type="number"
                  min="0"
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  placeholder="Enter new stock level"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleRestock()}
                  style={{ fontSize: '1.1rem', padding: '10px 14px' }}
                />
                <p style={{ fontSize: '0.75rem', color: t.colors.textMuted, marginTop: 6 }}>
                  Set to <strong>0</strong> to mark as out of stock. Setting a positive value will mark the product as active.
                </p>
              </FormGroup>

              {/* Quick presets */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {[0, 10, 25, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => setRestockQty(String(n))}
                    style={{
                      padding: '4px 12px', borderRadius: 20, border: `1px solid ${t.colors.border}`,
                      background: restockQty === String(n) ? t.colors.primary : 'white',
                      color: restockQty === String(n) ? 'white' : t.colors.textSecondary,
                      fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 500,
                    }}
                  >
                    {n === 0 ? 'Out of Stock' : `+${n}`}
                  </button>
                ))}
              </div>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeRestock}>Cancel</AdminBtn>
              <AdminBtn
                $variant={restockQty === '0' ? 'danger' : 'primary'}
                onClick={handleRestock}
                disabled={restocking}
              >
                {restocking ? 'Saving…' : restockQty === '0' ? 'Mark Out of Stock' : 'Update Stock'}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId !== null && (() => {
        const target = (products ?? []).find(p => p.id === deleteId);
        if (!target) return null;
        return (
          <ModalBackdrop onClick={() => setDeleteId(null)}>
            <ModalBox $width="420px" onClick={e => e.stopPropagation()}>
              <ModalHeader><SectionTitle>Delete Product</SectionTitle><IconBtn onClick={() => setDeleteId(null)}>✕</IconBtn></ModalHeader>
              <ModalBody>
                <p style={{ fontSize: '0.9rem', color: t.colors.textSecondary, lineHeight: 1.6 }}>
                  Are you sure you want to delete <strong>"{target.name}"</strong>? This cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <AdminBtn $variant="ghost" onClick={() => setDeleteId(null)}>Cancel</AdminBtn>
                <AdminBtn $variant="danger" onClick={() => handleDelete(target.id, target.name)}>Delete Product</AdminBtn>
              </ModalFooter>
            </ModalBox>
          </ModalBackdrop>
        );
      })()}
    </section>
  );
};