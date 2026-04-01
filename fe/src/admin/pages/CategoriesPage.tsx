import React, { useState, useCallback, useRef } from 'react';
import { PortalDropdown, MenuItem, closeAllDropdowns } from '../components/PortalDropdown';
import styled from 'styled-components';
import { Plus, Trash2, Tag, Edit2, Eye, Download, Filter, Search, RefreshCw } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminBtn, IconBtn, StatusPill, ToggleTrack, ToggleThumb,
  AdminInput, AdminSelect, AdminTextarea,
  FormGroup, FormLabel, FormGrid,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter, AdminDivider,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { useAdminCategories } from '../../hooks/useAdminApi';
import { adminCategoriesApi, AdminCategory } from '../../api/admin';
import { ApiError, API_BASE } from '../../api/client';
import AdminDataTable, { TR, TD, CheckBox, ColDef } from '../components/AdminDataTable';

const CatCell   = styled.div`display:flex;align-items:center;gap:12px;`;
const CatThumb  = styled.img`width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid ${t.colors.border};flex-shrink:0;`;
const CatPh     = styled.div`width:44px;height:44px;border-radius:8px;background:${t.colors.surfaceAlt};border:1px solid ${t.colors.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const CatName   = styled.div`font-weight:600;color:${t.colors.textPrimary};font-size:0.875rem;`;
const SearchBar = styled.div`display:flex;align-items:center;gap:8px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 12px;background:white;height:40px;min-width:200px;`;
const SearchInp = styled.input`border:none;outline:none;font-size:0.875rem;background:transparent;flex:1;color:${t.colors.textPrimary};&::placeholder{color:${t.colors.textMuted};}`;
const FilterBtn = styled.button`display:flex;align-items:center;gap:6px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 14px;height:40px;background:white;font-size:0.875rem;font-weight:500;color:${t.colors.textSecondary};cursor:pointer;&:hover{background:${t.colors.surfaceAlt};}`;
const UploadBox = styled.label`display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed ${t.colors.border};border-radius:12px;padding:24px;cursor:pointer;gap:8px;text-align:center;transition:border-color 0.15s,background 0.15s;&:hover{border-color:${t.colors.primary};background:${t.colors.primaryGhost};}`;
const UploadInput = styled.input`display:none;`;
const PreviewImg  = styled.img`width:72px;height:72px;border-radius:10px;object-fit:cover;border:1px solid ${t.colors.border};`;
const SortBadge   = styled.span`display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:${t.colors.surfaceAlt};border:1px solid ${t.colors.border};font-size:0.75rem;font-weight:600;color:${t.colors.textSecondary};`;

const PAGE_SIZE = 10;
const COLUMNS: ColDef[] = [
  { key: 'category',    label: 'Category' },
  { key: 'slug',        label: 'Slug' },
  { key: 'description', label: 'Description' },
  { key: 'order',       label: 'Order' },
  { key: 'status',      label: 'Status', thProps: { $center: true } },
  { key: 'actions',     label: '', sortable: false, thProps: { $center: true, $width: '60px' } },
];
const emptyForm = (): Partial<AdminCategory> & { imageFile?: File | null } => ({
  name: '', description: '', status: 'active', sortOrder: 0, imageFile: null,
});

export const CategoriesPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const { data: categories, loading, error, refetch } = useAdminCategories();
  const cats = categories ?? [];

  const [search, setSearch]         = useState('');
  const [statusF, setStatusF]       = useState('all');
  const [page, setPage]             = useState(1);
  const [selIds, setSelIds]         = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen]   = useState(false);
  const [viewCat, setViewCat]       = useState<AdminCategory | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<AdminCategory | null>(null);
  const [form, setForm]             = useState<Partial<AdminCategory> & { imageFile?: File | null }>(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [imgPreview, setImgPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = cats.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusF === 'all' || c.status === statusF;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allIds     = paginated.map(c => c.id);
  const allChecked = allIds.length > 0 && allIds.every(id => selIds.has(id));
  const toggleAll  = () => setSelIds(allChecked ? new Set() : new Set(allIds));
  const toggleOne  = (id: string) => setSelIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openAdd  = () => { setEditTarget(null); setForm(emptyForm()); setImgPreview(''); setModalOpen(true); };
  const openEdit = (c: AdminCategory) => { closeAllDropdowns(); setEditTarget(c); setForm({ ...c, imageFile: null }); setImgPreview(c.image || ''); setModalOpen(true); };
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
    if (!form.name?.trim()) { dispatch(showAdminToast({ message: 'Category name is required', type: 'error' })); return; }
    setSaving(true);
    try {
      const { imageFile, ...rest } = form;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(rest).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)); });
        fd.append('image', imageFile);
        const token = sessionStorage.getItem('vf_access');
        const url   = editTarget ? `${API_BASE}/api/admin/categories/${editTarget.id}` : `${API_BASE}/api/admin/categories`;
        const res = await fetch(url, { method: editTarget ? 'PUT' : 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
        if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      } else {
        if (editTarget) await adminCategoriesApi.update(editTarget.id, rest as AdminCategory);
        else await adminCategoriesApi.create(rest as AdminCategory);
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
      setDeleteId(null); refetch();
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
    <section>
      {error && <div style={{ color: t.colors.danger, padding: '1rem', background: '#fff5f5', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <AdminDataTable
        title="Categories List"
        subtitle="Manage and organise your product categories."
        actions={
          <>
            <FilterBtn onClick={refetch}><Download size={15} /> Export</FilterBtn>
            <AdminBtn $variant="primary" onClick={openAdd}><Plus size={15} /> Add Category</AdminBtn>
            <IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16} /></IconBtn>
          </>
        }
        searchArea={
          <SearchBar>
            <Search size={15} color={t.colors.textMuted} />
            <SearchInp placeholder="Search categories..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </SearchBar>
        }
        filterArea={
          <>
            <AdminSelect style={{ height: 40, borderRadius: 10, width: 130 }} value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </AdminSelect>
            <FilterBtn onClick={refetch}><Filter size={15} /> Filter</FilterBtn>
          </>
        }
        columns={COLUMNS}
        selectable
        allChecked={allChecked}
        onToggleAll={toggleAll}
        rows={paginated}
        loading={loading}
        emptyIcon={<Tag size={36} />}
        emptyTitle="No categories found"
        emptyText={search ? 'Try adjusting your search.' : 'Add your first product category.'}
        emptyAction={!search && <AdminBtn $variant="primary" onClick={openAdd}><Plus size={14} /> Add Category</AdminBtn>}
        renderRow={(c) => (
          <TR key={c.id}>
            <TD><CheckBox checked={selIds.has(c.id)} onChange={() => toggleOne(c.id)} /></TD>
            <TD>
              <CatCell>
                {c.image ? <CatThumb src={c.image.startsWith('http') ? c.image : `${API_BASE}${c.image}`} alt={c.name} /> : <CatPh><Tag size={18} color={t.colors.textMuted} /></CatPh>}
                <CatName>{c.name}</CatName>
              </CatCell>
            </TD>
            <TD style={{ color: t.colors.textMuted, fontSize: '0.8rem' }}>{c.slug}</TD>
            <TD style={{ maxWidth: 220 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.colors.textMuted, fontSize: '0.8rem' }}>{c.description || '—'}</div>
            </TD>
            <TD><SortBadge>{c.sortOrder ?? 0}</SortBadge></TD>
            <TD style={{ textAlign: 'center' }}>
              <ToggleTrack $on={c.status === 'active'} onClick={e => { e.stopPropagation(); toggleStatus(c); }} title="Click to toggle status">
                <ToggleThumb $on={c.status === 'active'} />
              </ToggleTrack>
            </TD>
            <TD style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <PortalDropdown>
                <MenuItem onClick={() => { closeAllDropdowns(); setViewCat(c); }}><Eye size={14} /> View</MenuItem>
                <MenuItem onClick={() => openEdit(c)}><Edit2 size={14} /> Edit</MenuItem>
                <MenuItem $danger onClick={() => { closeAllDropdowns(); setDeleteId(c.id); }}><Trash2 size={14} /> Delete</MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={`Showing 1 to ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {modalOpen && (
        <ModalBackdrop onClick={close}>
          <ModalBox $width="560px" onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>{editTarget ? `Edit "${editTarget.name}"` : 'Add New Category'}</div>
              <IconBtn onClick={close}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <FormGrid $cols={2}>
                <FormGroup $span={2}><FormLabel>Category Name *</FormLabel><AdminInput value={form.name ?? ''} onChange={setField('name')} placeholder="e.g. Vegetables" autoFocus /></FormGroup>
                <FormGroup><FormLabel>Status</FormLabel><AdminSelect value={form.status ?? 'active'} onChange={setField('status')}><option value="active">Active</option><option value="inactive">Inactive</option></AdminSelect></FormGroup>
                <FormGroup><FormLabel>Sort Order</FormLabel><AdminInput type="number" min={0} value={form.sortOrder ?? 0} onChange={setField('sortOrder')} /></FormGroup>
                <FormGroup $span={2}><FormLabel>Description</FormLabel><AdminTextarea value={form.description ?? ''} onChange={setField('description')} placeholder="Short description…" style={{ minHeight: 75 }} /></FormGroup>
                <FormGroup $span={2}>
                  <FormLabel>Category Image</FormLabel>
                  <UploadBox htmlFor="cat-img-upload">
                    <UploadInput id="cat-img-upload" type="file" accept="image/*" ref={fileRef} onChange={handleImageFile} />
                    {imgPreview ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <PreviewImg src={imgPreview} alt="preview" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>Click to change image</span>
                      </div>
                    ) : (<><Tag size={28} color={t.colors.textMuted} /><span style={{ fontSize: '0.875rem', fontWeight: 600, color: t.colors.textSecondary }}>Click to upload image</span><span style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>PNG, JPG, WebP up to 5MB</span></>)}
                  </UploadBox>
                </FormGroup>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={close}>Cancel</AdminBtn>
              <AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Category'}</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {viewCat && (
        <ModalBackdrop onClick={() => setViewCat(null)}>
          <ModalBox $width="440px" onClick={e => e.stopPropagation()}>
            <ModalHeader><div style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>{viewCat.name}</div><IconBtn onClick={() => setViewCat(null)}>✕</IconBtn></ModalHeader>
            <ModalBody>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
                {viewCat.image ? <CatThumb src={viewCat.image} alt={viewCat.name} style={{ width: 72, height: 72 }} /> : <CatPh style={{ width: 72, height: 72 }}><Tag size={28} color={t.colors.textMuted} /></CatPh>}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: t.colors.textPrimary }}>{viewCat.name}</div>
                  <div style={{ color: t.colors.textMuted, fontSize: '0.8rem', marginTop: 2 }}>/{viewCat.slug}</div>
                  <StatusPill $variant={viewCat.status === 'active' ? 'success' : 'neutral'} style={{ marginTop: 8 }}>{viewCat.status}</StatusPill>
                </div>
              </div>
              <FormGrid $cols={2}>
                <FormGroup><FormLabel>Sort Order</FormLabel><div>{viewCat.sortOrder ?? 0}</div></FormGroup>
                <FormGroup><FormLabel>Status</FormLabel><div style={{ textTransform: 'capitalize' }}>{viewCat.status}</div></FormGroup>
                {viewCat.description && <FormGroup $span={2}><FormLabel>Description</FormLabel><div style={{ color: t.colors.textSecondary, lineHeight: 1.6 }}>{viewCat.description}</div></FormGroup>}
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setViewCat(null)}>Close</AdminBtn>
              <AdminBtn $variant="primary" onClick={() => { setViewCat(null); openEdit(viewCat); }}>Edit Category</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {deleteId && (() => {
        const cat = cats.find(c => c.id === deleteId);
        if (!cat) return null;
        return (
          <ModalBackdrop onClick={() => setDeleteId(null)}>
            <ModalBox $width="400px" onClick={e => e.stopPropagation()}>
              <ModalHeader><div style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.danger }}>Delete Category</div><IconBtn onClick={() => setDeleteId(null)}>✕</IconBtn></ModalHeader>
              <ModalBody>
                <p style={{ color: t.colors.textSecondary, margin: '0 0 12px' }}>Are you sure you want to delete <strong>"{cat.name}"</strong>? Products using this category will lose their category assignment.</p>
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