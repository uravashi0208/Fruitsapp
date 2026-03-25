import React, { useState, useCallback, useRef } from 'react';
import { PortalDropdown, MenuItem } from '../components/PortalDropdown';
import styled from 'styled-components';
import {
  Plus, Trash2, Tag, RefreshCw,
  MoreHorizontal, Edit2, Eye, Download, Filter, Search,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminCard, AdminBtn, IconBtn, StatusPill,
  AdminInput, AdminSelect, AdminTextarea,
  FormGroup, FormLabel, FormGrid, EmptyState,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter,
  AdminDivider, PageBtns, PageBtn,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { useAdminCategories } from '../../hooks/useAdminApi';
import { adminCategoriesApi, AdminCategory } from '../../api/admin';
import { ApiError, API_BASE } from '../../api/client';

/* ── Styles matching Products page ─────────────────────────── */
const PageHeader  = styled.div`display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;`;
const PageTitle   = styled.h1`font-size:1.375rem;font-weight:700;color:${t.colors.textPrimary};margin:0 0 2px;`;
const PageSub     = styled.p`font-size:0.8125rem;color:${t.colors.textMuted};margin:0;`;
const HeaderBtns  = styled.div`display:flex;gap:10px;flex-wrap:wrap;`;
const TableWrap   = styled(AdminCard)`padding:0;overflow:hidden;`;
const TableInner  = styled.div`overflow-x:auto;`;
const Tbl         = styled.table`width:100%;border-collapse:collapse;font-family:${t.fonts.body};`;
const THead       = styled.thead`background:${t.colors.surfaceAlt};border-bottom:1px solid ${t.colors.border};`;
const TH          = styled.th<{$check?:boolean;$right?:boolean}>`
  padding:12px 16px;font-size:0.75rem;font-weight:600;color:${t.colors.textMuted};
  text-align:${({$right})=>$right?'right':'left'};white-space:nowrap;
  ${({$check})=>$check&&'width:40px;padding:12px 8px 12px 16px;'}
`;
const TR = styled.tr`
  border-bottom:1px solid ${t.colors.border};transition:background 0.12s;
  &:last-child{border-bottom:none;}
  &:hover{background:${t.colors.surfaceAlt};}
`;
const TD = styled.td<{$check?:boolean;$center?:boolean;$right?:boolean}>`
  padding:14px 16px;font-size:0.8125rem;color:${t.colors.textSecondary};vertical-align:middle;
  ${({$check})=>$check&&'padding:14px 8px 14px 16px;width:40px;'}
  ${({$center})=>$center&&'text-align:center;'}
  ${({$right})=>$right&&'text-align:right;'}
`;
const CatCell   = styled.div`display:flex;align-items:center;gap:12px;`;
const CatThumb  = styled.img`width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid ${t.colors.border};flex-shrink:0;`;
const CatPh     = styled.div`width:44px;height:44px;border-radius:8px;background:${t.colors.surfaceAlt};border:1px solid ${t.colors.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const CatName   = styled.div`font-weight:600;color:${t.colors.textPrimary};font-size:0.875rem;`;
const CatSlug   = styled.div`font-size:0.75rem;color:${t.colors.textMuted};margin-top:2px;`;
const CheckBox  = styled.input.attrs({type:'checkbox'})`width:16px;height:16px;cursor:pointer;accent-color:${t.colors.primary};`;
const SearchBar = styled.div`display:flex;align-items:center;gap:8px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 12px;background:white;height:40px;min-width:200px;`;
const SearchInp = styled.input`border:none;outline:none;font-size:0.875rem;background:transparent;flex:1;color:${t.colors.textPrimary};&::placeholder{color:${t.colors.textMuted};}`;
const FilterBtn = styled.button`display:flex;align-items:center;gap:6px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 14px;height:40px;background:white;font-size:0.875rem;font-weight:500;color:${t.colors.textSecondary};cursor:pointer;&:hover{background:${t.colors.surfaceAlt};}`;
const ActionDot = styled.button`background:none;border:none;cursor:pointer;color:${t.colors.textMuted};padding:4px;border-radius:6px;display:flex;align-items:center;position:relative;&:hover{background:${t.colors.border};color:${t.colors.textPrimary};}`;
const DropMenu  = styled.div`position:absolute;right:0;top:calc(100% + 4px);background:white;border:1px solid ${t.colors.border};border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.10);min-width:140px;z-index:100;overflow:hidden;`;
const DropItem  = styled.button<{$danger?:boolean}>`display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:none;border:none;cursor:pointer;font-size:0.8125rem;font-weight:500;color:${({$danger})=>$danger?t.colors.danger:t.colors.textSecondary};&:hover{background:${({$danger})=>$danger?'#fef3f2':t.colors.surfaceAlt};}`;
const UploadBox = styled.label`display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed ${t.colors.border};border-radius:12px;padding:24px;cursor:pointer;gap:8px;text-align:center;transition:border-color 0.15s,background 0.15s;&:hover{border-color:${t.colors.primary};background:${t.colors.primaryGhost};}`;
const UploadInput = styled.input`display:none;`;
const PreviewImg  = styled.img`width:72px;height:72px;border-radius:10px;object-fit:cover;border:1px solid ${t.colors.border};`;

const PAGE_SIZE = 7;
const emptyForm = (): Partial<AdminCategory> & { imageFile?: File | null } => ({
  name: '', description: '', status: 'active', sortOrder: 0, imageFile: null,
});

export const CategoriesPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const { data: categories, loading, error, refetch } = useAdminCategories();
  const cats = categories ?? [];

  const [search,     setSearch]     = useState('');
  const [statusF,    setStatusF]    = useState('all');
  const [page,       setPage]       = useState(1);
  const [selIds,     setSelIds]     = useState<Set<string>>(new Set());
  const [modalOpen,  setModalOpen]  = useState(false);
  const [viewCat,    setViewCat]    = useState<AdminCategory | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<AdminCategory | null>(null);
  const [form,       setForm]       = useState<Partial<AdminCategory> & { imageFile?: File | null }>(emptyForm());
  const [saving,     setSaving]     = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [imgPreview, setImgPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Filter & paginate client-side
  const filtered = cats.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusF === 'all' || c.status === statusF;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allIds     = paginated.map(c => c.id);
  const allChecked = allIds.length > 0 && allIds.every(id => selIds.has(id));
  const toggleAll  = () => setSelIds(allChecked ? new Set() : new Set(allIds));
  const toggleOne  = (id: string) => setSelIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openAdd  = () => { setEditTarget(null); setForm(emptyForm()); setImgPreview(''); setModalOpen(true); };
  const openEdit = (c: AdminCategory) => { setEditTarget(c); setForm({ ...c, imageFile: null }); setImgPreview(c.image || ''); setModalOpen(true); setOpenMenuId(null); };
  const close    = () => { setModalOpen(false); setEditTarget(null); setForm(emptyForm()); setImgPreview(''); };

  const setField = (k: keyof AdminCategory) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, imageFile: file }));
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = useCallback(async () => {
    if (!form.name?.trim()) {
      dispatch(showAdminToast({ message: 'Category name is required', type: 'error' })); return;
    }
    setSaving(true);
    try {
      const { imageFile, ...rest } = form;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(rest).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)); });
        fd.append('image', imageFile);
        const token = sessionStorage.getItem('vf_access');
        const url   = editTarget
          ? `${API_BASE}/api/admin/categories/${editTarget.id}`
          : `${API_BASE}/api/admin/categories`;
        const res = await fetch(url, {
          method: editTarget ? 'PUT' : 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      } else {
        if (editTarget) {
          await adminCategoriesApi.update(editTarget.id, rest as AdminCategory);
        } else {
          await adminCategoriesApi.create(rest as AdminCategory);
        }
      }
      dispatch(showAdminToast({ message: `"${form.name}" ${editTarget ? 'updated' : 'created'}`, type: 'success' }));
      close(); refetch();
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : String(err), type: 'error' }));
    } finally { setSaving(false); }
  }, [dispatch, editTarget, form, refetch]);

  const handleDelete = useCallback(async (id: string, name: string) => {
    try {
      await adminCategoriesApi.delete(id);
      setDeleteId(null); setOpenMenuId(null); refetch();
      dispatch(showAdminToast({ message: `"${name}" deleted`, type: 'warning' }));
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Delete failed', type: 'error' }));
    }
  }, [dispatch, refetch]);

  const toggleStatus = useCallback(async (c: AdminCategory) => {
    const next = c.status === 'active' ? 'inactive' : 'active';
    try {
      await adminCategoriesApi.setStatus(c.id, next as AdminCategory['status']);
      dispatch(showAdminToast({ message: `"${c.name}" set to ${next}`, type: 'info' }));
      refetch();
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Update failed', type: 'error' }));
    }
  }, [dispatch, refetch]);

  return (
    <section onClick={() => setOpenMenuId(null)}>
      {/* Page Header */}
      <PageHeader>
        <div>
          <PageTitle>Categories</PageTitle>
          <PageSub>Manage your product categories</PageSub>
        </div>
        <HeaderBtns>
          <FilterBtn onClick={refetch}><Download size={15} /> Export</FilterBtn>
          <AdminBtn $variant="primary" onClick={openAdd}><Plus size={15} /> Add Category</AdminBtn>
        </HeaderBtns>
      </PageHeader>

      <TableWrap>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: t.colors.textPrimary, fontSize: '0.9375rem' }}>Categories List</div>
            <div style={{ fontSize: '0.8rem', color: t.colors.textMuted }}>Manage and organise your product categories.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <SearchBar>
              <Search size={15} color={t.colors.textMuted} />
              <SearchInp placeholder="Search categories..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </SearchBar>
            <AdminSelect style={{ height: 40, borderRadius: 10, width: 130 }} value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
                <TH>Category</TH>
                <TH>Slug</TH>
                <TH>Description</TH>
                <TH>Order</TH>
                <TH>Status</TH>
                <TH $right style={{ width: 60 }}></TH>
              </tr>
            </THead>
            <tbody>
              {loading ? (
                <tr><TD colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: t.colors.textMuted }}>Loading…</TD></tr>
              ) : paginated.length === 0 ? (
                <tr><TD colSpan={7}>
                  <EmptyState>
                    <Tag size={40} />
                    <h3>No categories found</h3>
                    <p>{search ? 'Try adjusting your search.' : 'Add your first product category to get started.'}</p>
                    {!search && <AdminBtn $variant="primary" onClick={openAdd}><Plus size={14} /> Add Category</AdminBtn>}
                  </EmptyState>
                </TD></tr>
              ) : paginated.map(c => (
                <TR key={c.id}>
                  <TD $check><CheckBox checked={selIds.has(c.id)} onChange={() => toggleOne(c.id)} /></TD>
                  <TD>
                    <CatCell>
                      <div>
                        <CatName>{c.name}</CatName>
                      </div>
                    </CatCell>
                  </TD>
                  <TD style={{ color: t.colors.textMuted, fontSize: '0.8rem' }}>{c.slug}</TD>
                  <TD style={{ maxWidth: 220 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.colors.textMuted, fontSize: '0.8rem' }}>
                      {c.description || '—'}
                    </div>
                  </TD>
                  <TD>{c.sortOrder ?? 0}</TD>
                  <TD>
                    <StatusPill
                      $variant={c.status === 'active' ? 'success' : 'neutral'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleStatus(c)}
                      title="Click to toggle status"
                    >
                      {c.status}
                    </StatusPill>
                  </TD>
                  <TD $right onClick={e => e.stopPropagation()}>
                    <PortalDropdown>
                      <MenuItem onClick={() => setViewCat(c)}><Eye size={14} /> View</MenuItem>
                      <MenuItem onClick={() => openEdit(c)}><Edit2 size={14} /> Edit</MenuItem>
                      <MenuItem $danger onClick={() => setDeleteId(c.id)}><Trash2 size={14} /> Delete</MenuItem>
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
            Showing 1 to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <PageBtns>
            <PageBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</PageBtn>
            {Array.from({ length: totalPages || 1 }, (_, i) => (
              <PageBtn key={i + 1} $active={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PageBtn>
            ))}
            <PageBtn disabled={page === (totalPages || 1)} onClick={() => setPage(p => p + 1)}>›</PageBtn>
          </PageBtns>
        </div>
      </TableWrap>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <ModalBackdrop onClick={close}>
          <ModalBox $width="560px" onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>
                {editTarget ? `Edit "${editTarget.name}"` : 'Add New Category'}
              </div>
              <IconBtn onClick={close}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <FormGrid $cols={2}>
                <FormGroup $span={2}>
                  <FormLabel>Category Name *</FormLabel>
                  <AdminInput value={form.name ?? ''} onChange={setField('name')} placeholder="e.g. Vegetables" autoFocus />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Status</FormLabel>
                  <AdminSelect value={form.status ?? 'active'} onChange={setField('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </AdminSelect>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Sort Order</FormLabel>
                  <AdminInput type="number" min={0} value={form.sortOrder ?? 0} onChange={setField('sortOrder')} placeholder="0" />
                </FormGroup>

                <FormGroup $span={2}>
                  <FormLabel>Description</FormLabel>
                  <AdminTextarea
                    value={form.description ?? ''}
                    onChange={setField('description')}
                    placeholder="Short description of this category…"
                    style={{ minHeight: 75 }}
                  />
                </FormGroup>

                {/* Image Upload */}
                <FormGroup $span={2}>
                  <FormLabel>Category Image</FormLabel>
                  <UploadBox htmlFor="cat-img-upload">
                    <UploadInput id="cat-img-upload" type="file" accept="image/*" ref={fileRef} onChange={handleImageFile} />
                    {imgPreview ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <PreviewImg src={imgPreview} alt="preview" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>Click to change image</span>
                      </div>
                    ) : (
                      <>
                        <Tag size={28} color={t.colors.textMuted} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: t.colors.textSecondary }}>Click to upload image</span>
                        <span style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>PNG, JPG, WebP up to 5MB</span>
                      </>
                    )}
                  </UploadBox>
                </FormGroup>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={close}>Cancel</AdminBtn>
              <AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Category'}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── View Modal ── */}
      {viewCat && (
        <ModalBackdrop onClick={() => setViewCat(null)}>
          <ModalBox $width="440px" onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>{viewCat.name}</div>
              <IconBtn onClick={() => setViewCat(null)}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
                {viewCat.image
                  ? <CatThumb src={viewCat.image} alt={viewCat.name} style={{ width: 72, height: 72 }} />
                  : <CatPh style={{ width: 72, height: 72 }}><Tag size={28} color={t.colors.textMuted} /></CatPh>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: t.colors.textPrimary }}>{viewCat.name}</div>
                  <div style={{ color: t.colors.textMuted, fontSize: '0.8rem', marginTop: 2 }}>/{viewCat.slug}</div>
                  <StatusPill $variant={viewCat.status === 'active' ? 'success' : 'neutral'} style={{ marginTop: 8 }}>{viewCat.status}</StatusPill>
                </div>
              </div>
              <FormGrid $cols={2}>
                <FormGroup><FormLabel>Sort Order</FormLabel><div>{viewCat.sortOrder ?? 0}</div></FormGroup>
                <FormGroup><FormLabel>Status</FormLabel><div style={{ textTransform: 'capitalize' }}>{viewCat.status}</div></FormGroup>
                {viewCat.description && (
                  <FormGroup $span={2}><FormLabel>Description</FormLabel>
                    <div style={{ color: t.colors.textSecondary, lineHeight: 1.6 }}>{viewCat.description}</div>
                  </FormGroup>
                )}
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setViewCat(null)}>Close</AdminBtn>
              <AdminBtn $variant="primary" onClick={() => { setViewCat(null); openEdit(viewCat); }}>Edit Category</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (() => {
        const cat = cats.find(c => c.id === deleteId);
        if (!cat) return null;
        return (
          <ModalBackdrop onClick={() => setDeleteId(null)}>
            <ModalBox $width="400px" onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.danger }}>Delete Category</div>
                <IconBtn onClick={() => setDeleteId(null)}>✕</IconBtn>
              </ModalHeader>
              <ModalBody>
                <p style={{ color: t.colors.textSecondary, margin: '0 0 12px' }}>
                  Are you sure you want to delete <strong>"{cat.name}"</strong>?
                  Products using this category will lose their category assignment.
                </p>
                <AdminDivider />
                <p style={{ color: t.colors.danger, fontSize: '0.8rem', margin: 0 }}>This action cannot be undone.</p>
              </ModalBody>
              <ModalFooter>
                <AdminBtn $variant="ghost" onClick={() => setDeleteId(null)}>Cancel</AdminBtn>
                <AdminBtn $variant="danger" onClick={() => handleDelete(cat.id, cat.name)}>Delete</AdminBtn>
              </ModalFooter>
            </ModalBox>
          </ModalBackdrop>
        );
      })()}
    </section>
  );
};
