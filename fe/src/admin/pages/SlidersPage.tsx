import React, { useState, useRef, useCallback } from 'react';
import { PortalDropdown, MenuItem, closeAllDropdowns } from '../components/PortalDropdown';
import styled from 'styled-components';
import { Plus, Trash2, RefreshCw, Search, Edit2, Image as ImageIcon, Filter } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminBtn, IconBtn, ToggleTrack, ToggleThumb,
  AdminInput, AdminSelect,
  FormGroup, FormLabel, FormGrid,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { useAdminSliders } from '../../hooks/useAdminApi';
import { adminSlidersApi, AdminSlider } from '../../api/admin';
import { ApiError, API_BASE } from '../../api/client';
import AdminDataTable, { TR, TD, ColDef } from '../components/AdminDataTable';

const SliderCell  = styled.div`display:flex;align-items:center;gap:12px;`;
const SliderThumb = styled.img`width:64px;height:40px;border-radius:6px;object-fit:cover;border:1px solid ${t.colors.border};flex-shrink:0;`;
const SliderPh    = styled.div`width:64px;height:40px;border-radius:6px;background:${t.colors.surfaceAlt};border:1px solid ${t.colors.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const SliderName  = styled.div`font-weight:600;color:${t.colors.textPrimary};font-size:0.875rem;`;
const SliderSub   = styled.div`font-size:0.75rem;color:${t.colors.textMuted};margin-top:2px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
const SearchBar   = styled.div`display:flex;align-items:center;gap:8px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 12px;background:white;height:40px;min-width:200px;`;
const SearchInp   = styled.input`border:none;outline:none;font-size:0.875rem;background:transparent;flex:1;color:${t.colors.textPrimary};&::placeholder{color:${t.colors.textMuted};}`;
const FilterBtn   = styled.button`display:flex;align-items:center;gap:6px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 14px;height:40px;background:white;font-size:0.875rem;font-weight:500;color:${t.colors.textSecondary};cursor:pointer;&:hover{background:${t.colors.surfaceAlt};}`;
const UploadBox   = styled.label`display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed ${t.colors.border};border-radius:12px;padding:24px;cursor:pointer;gap:8px;text-align:center;transition:border-color 0.15s,background 0.15s;&:hover{border-color:${t.colors.primary};background:${t.colors.primaryGhost};}`;
const UploadInput = styled.input`display:none;`;
const PreviewImg  = styled.img`width:100%;max-height:160px;border-radius:10px;object-fit:cover;border:1px solid ${t.colors.border};margin-top:8px;`;
const SortBadge   = styled.span`display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:${t.colors.surfaceAlt};border:1px solid ${t.colors.border};font-size:0.75rem;font-weight:600;color:${t.colors.textSecondary};`;

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;
interface FormState { title: string; subtitle: string; buttonText: string; buttonLink: string; sortOrder: string; status: 'active' | 'inactive'; }
const emptyForm = (): FormState => ({ title: '', subtitle: '', buttonText: 'View Details', buttonLink: '#', sortOrder: '0', status: 'active' });
const resolveImage = (image: string): string => {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('/images')) return image;
  return `${API_BASE}${image}`;
};

const COLUMNS: ColDef[] = [
  { key: 'slider',  label: 'Slider' },
  { key: 'button',  label: 'Button' },
  { key: 'order',   label: 'Order' },
  { key: 'status',  label: 'Status' },
  { key: 'actions', label: 'Action', sortable: false, thProps: { $width: '200px' } },
];
const PER_PAGE = 10;

export const SlidersPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const { data: rawSliders, loading, error, refetch } = useAdminSliders();
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState<'' | 'active' | 'inactive'>('');
  const [page, setPage]                   = useState(1);
  const [toggling, setToggling]           = useState<string | null>(null);
  const [mode, setMode]                   = useState<ModalMode>(null);
  const [selected, setSelected]           = useState<AdminSlider | null>(null);
  const [form, setForm]                   = useState<FormState>(emptyForm());
  const [imgFile, setImgFile]             = useState<File | null>(null);
  const [imgPreview, setImgPreview]       = useState<string>('');
  const [saving, setSaving]               = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleStatus = useCallback(async (s: AdminSlider) => {
    if (toggling) return;
    const next = s.status === 'active' ? 'inactive' : 'active';
    setToggling(s.id);
    try {
      await adminSlidersApi.setStatus(s.id, next as AdminSlider['status']);
      dispatch(showAdminToast({ message: `Slider set to ${next}`, type: 'info' }));
      refetch();
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Update failed', type: 'error' }));
    } finally { setToggling(null); }
  }, [dispatch, refetch, toggling]);

  const sliders = (rawSliders ?? []).filter((s: AdminSlider) => {
    const q = search.toLowerCase();
    const matchQ = !q || s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q);
    const matchS = !statusFilter || s.status === statusFilter;
    return matchQ && matchS;
  });
  const totalPages = Math.max(1, Math.ceil(sliders.length / PER_PAGE));
  const paged = sliders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openCreate = () => { closeAllDropdowns(); setSelected(null); setForm(emptyForm()); setImgFile(null); setImgPreview(''); setMode('create'); };
  const openEdit = (s: AdminSlider) => { closeAllDropdowns(); setSelected(s); setForm({ title: s.title, subtitle: s.subtitle, buttonText: s.buttonText, buttonLink: s.buttonLink, sortOrder: String(s.sortOrder), status: s.status }); setImgFile(null); setImgPreview(resolveImage(s.image)); setMode('edit'); };
  const openView   = (s: AdminSlider) => { closeAllDropdowns(); setSelected(s); setMode('view'); };
  const openDelete = (s: AdminSlider) => { closeAllDropdowns(); setSelected(s); setMode('delete'); };
  const closeModal = () => { setMode(null); setSelected(null); };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setImgFile(f);
    const reader = new FileReader(); reader.onload = ev => setImgPreview(ev.target?.result as string); reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { dispatch(showAdminToast({ message: 'Title is required', type: 'error' })); return; }
    const fd = new FormData();
    fd.append('title', form.title); fd.append('subtitle', form.subtitle); fd.append('buttonText', form.buttonText);
    fd.append('buttonLink', form.buttonLink); fd.append('sortOrder', form.sortOrder); fd.append('status', form.status);
    if (imgFile) fd.append('image', imgFile);
    setSaving(true);
    try {
      if (mode === 'create') { await adminSlidersApi.create(fd); dispatch(showAdminToast({ message: 'Slider created', type: 'success' })); }
      else if (mode === 'edit' && selected) { await adminSlidersApi.update(selected.id, fd); dispatch(showAdminToast({ message: 'Slider updated', type: 'success' })); }
      closeModal(); refetch();
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Something went wrong', type: 'error' }));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminSlidersApi.delete(selected.id);
      dispatch(showAdminToast({ message: 'Slider deleted', type: 'success' }));
      closeModal(); refetch();
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Delete failed', type: 'error' }));
    } finally { setSaving(false); }
  };

  return (
    <>
      {error && <div style={{ color: t.colors.danger, padding: '1rem', background: '#fff5f5', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <AdminDataTable
        title="Sliders List"
        subtitle="Manage hero / banner sliders with images"
        actions={
          <>
          <AdminBtn $variant="primary" onClick={openCreate}><Plus size={15} /> Add Slider</AdminBtn>
          <IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16} /></IconBtn>
          </>
        }
        searchArea={
          <SearchBar>
            <Search size={15} color={t.colors.textMuted} />
            <SearchInp placeholder="Search sliders…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </SearchBar>
        }
        filterArea={
          <FilterBtn>
            <Filter size={14} />
            <select style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer', color: t.colors.textSecondary }}
              value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FilterBtn>
        }
        columns={COLUMNS}
        rows={paged}
        loading={loading}
        emptyIcon={<ImageIcon size={36} />}
        emptyTitle="No sliders found"
        renderRow={(s) => (
          <TR key={s.id}>
            <TD>
              <SliderCell>
                {resolveImage(s.image) ? <SliderThumb src={resolveImage(s.image)} alt={s.title} /> : <SliderPh><ImageIcon size={18} color={t.colors.textMuted} /></SliderPh>}
                <div><SliderName>{s.title}</SliderName><SliderSub>{s.subtitle || '—'}</SliderSub></div>
              </SliderCell>
            </TD>
            <TD>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: t.colors.textPrimary }}>{s.buttonText || '—'}</div>
              <div style={{ fontSize: '0.75rem', color: t.colors.textMuted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.buttonLink}</div>
            </TD>
            <TD><SortBadge>{s.sortOrder}</SortBadge></TD>
            <TD>
              <ToggleTrack $on={s.status === 'active'} onClick={() => toggleStatus(s)} style={{ opacity: toggling === s.id ? 0.6 : 1, cursor: toggling === s.id ? 'wait' : 'pointer' }}>
                <ToggleThumb $on={s.status === 'active'} />
              </ToggleTrack>
            </TD>
            <TD onClick={e => e.stopPropagation()}>
              <PortalDropdown>
                <MenuItem onClick={() => openView(s)}><Edit2 size={13} /> View</MenuItem>
                <MenuItem onClick={() => openEdit(s)}><Edit2 size={13} /> Edit</MenuItem>
                <MenuItem $danger onClick={() => openDelete(s)}><Trash2 size={13} /> Delete</MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={sliders.length > 0 ? `Showing ${(page-1)*PER_PAGE+1}–${Math.min(page*PER_PAGE, sliders.length)} of ${sliders.length}` : '0 sliders'}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {(mode === 'create' || mode === 'edit') && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '95%' }}>
            <ModalHeader>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>{mode === 'create' ? 'Add New Slider' : 'Edit Slider'}</span>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
            </ModalHeader>
            <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormGroup>
                <FormLabel>Slider Image</FormLabel>
                {imgPreview ? (
                  <div style={{ position: 'relative' }}>
                    <PreviewImg src={imgPreview} alt="preview" />
                    <button onClick={() => { setImgFile(null); setImgPreview(''); if (fileRef.current) fileRef.current.value = ''; }}
                      style={{ position: 'absolute', top: 12, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', padding: '2px 8px', fontSize: 12 }}>Remove</button>
                  </div>
                ) : (
                  <UploadBox><UploadInput ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} />
                    <ImageIcon size={28} color={t.colors.textMuted} />
                    <span style={{ fontSize: '0.8125rem', color: t.colors.textMuted }}>Click to upload image</span>
                    <span style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>PNG, JPG, WEBP up to 5MB</span>
                  </UploadBox>
                )}
              </FormGroup>
              <FormGrid>
                <FormGroup><FormLabel>Title *</FormLabel><AdminInput placeholder="e.g. Summer Collection" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></FormGroup>
                <FormGroup><FormLabel>Subtitle</FormLabel><AdminInput placeholder="Short description" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup><FormLabel>Button Text</FormLabel><AdminInput placeholder="e.g. Shop Now" value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))} /></FormGroup>
                <FormGroup><FormLabel>Button Link</FormLabel><AdminInput placeholder="/shop" value={form.buttonLink} onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))} /></FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup><FormLabel>Sort Order</FormLabel><AdminInput type="number" min={0} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} /></FormGroup>
                <FormGroup><FormLabel>Status</FormLabel><AdminSelect value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}><option value="active">Active</option><option value="inactive">Inactive</option></AdminSelect></FormGroup>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>Cancel</AdminBtn>
              <AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : mode === 'create' ? 'Create Slider' : 'Save Changes'}</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {mode === 'view' && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 540, width: '95%' }}>
            <ModalHeader>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>Slider Details</span>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
            </ModalHeader>
            <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {resolveImage(selected.image) && (
                <img src={resolveImage(selected.image)} alt={selected.title}
                  style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, border: `1px solid ${t.colors.border}` }} />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {([
                  ['Title',       selected.title],
                  ['Subtitle',    selected.subtitle || '—'],
                  ['Button Text', selected.buttonText],
                  ['Button Link', selected.buttonLink],
                  ['Sort Order',  String(selected.sortOrder)],
                  ['Status',      selected.status],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.75rem', color: t.colors.textMuted, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: t.colors.textPrimary }}>{val}</div>
                  </div>
                ))}
              </div>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>Close</AdminBtn>
              <AdminBtn $variant="primary" onClick={() => { closeModal(); openEdit(selected); }}>Edit</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {mode === 'delete' && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 420, width: '95%' }}>
            <ModalHeader>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.danger }}>Delete Slider</span>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
            </ModalHeader>
            <ModalBody><p style={{ color: t.colors.textSecondary, fontSize: '0.875rem', lineHeight: 1.6 }}>Are you sure you want to delete <strong>"{selected.title}"</strong>? This cannot be undone.</p></ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>Cancel</AdminBtn>
              <AdminBtn $variant="danger" onClick={handleDelete} disabled={saving} style={{ background: t.colors.danger, color: 'white' }}>{saving ? 'Deleting…' : 'Delete Slider'}</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </>
  );
};

export default SlidersPage;