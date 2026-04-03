import React, { useState, useRef, useCallback } from 'react';
import { PortalDropdown, MenuItem, closeAllDropdowns } from '../components/PortalDropdown';
import styled from 'styled-components';
import { Plus, Trash2, RefreshCw, Search, Edit2, Image as ImageIcon, Filter, CheckCircle, XCircle } from 'lucide-react';
import { ExportDropdown } from '../components/ExportDropdown';
import { exportData } from '../utils/exportUtils';
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
import AdminDataTable, { TR, TD, ColDef, CheckBox } from '../components/AdminDataTable';
import { formatDate } from '../utils/formatDate';

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
  { key: 'createdAt',  label: 'Created At' },
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
  const [exportLoading, setExportLoading] = useState(false);
  const [selIds, setSelIds]               = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking]     = useState(false);
  const [bulkConfirm, setBulkConfirm]    = useState<'active'|'inactive'|'delete'|null>(null);

  const toggleStatus = useCallback(async (s: AdminSlider) => {
    if (toggling) return;
    const next = s.status === 'active' ? 'inactive' : 'active';
    setToggling(s.id);
    try {
      await adminSlidersApi.setStatus(s.id, next as AdminSlider['status']);
      dispatch(showAdminToast({ message: `Slider set to ${next}`, type: 'success' }));
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
  const allIds = paged.map(s => s.id);
  const allChecked = allIds.length > 0 && allIds.every(id => selIds.has(id));
  const toggleAll = () => setSelIds(allChecked ? new Set() : new Set(allIds));
  const toggleOne = (id: string) => setSelIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleBulkAction = useCallback(async (action: 'active' | 'inactive' | 'delete') => {
    if (!selIds.size) return;
    setBulkWorking(true);
    const ids = Array.from(selIds);
    try {
      if (action === 'delete') {
        await adminSlidersApi.bulkDelete(ids);
        dispatch(showAdminToast({ message: `${ids.length} slider(s) deleted`, type: 'warning' }));
      } else {
        await adminSlidersApi.bulkUpdateStatus(ids, action);
        dispatch(showAdminToast({ message: `${ids.length} slider(s) set to ${action}`, type: 'success' }));
      }
      setSelIds(new Set()); setBulkConfirm(null); refetch();
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Bulk action failed', type: 'error' }));
    } finally { setBulkWorking(false); }
  }, [selIds, dispatch, refetch]);

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
          <ExportDropdown
            loading={exportLoading}
            onExport={async (fmt) => {
              setExportLoading(true);
              try {
                await exportData(fmt, 'sliders', [
                  { label: 'Image',         imageKey: 'image'},
                  { label: 'Title',         key: 'title'},
                  { label: 'Subtitle',      key: 'subtitle'},
                  { label: 'Button Name',   key: 'buttonText'},
                  { label: 'Link',          key: 'buttonLink' },
                  { label: 'Order',         key: 'sortOrder'},
                  { label: 'Status',        resolve: (row) => {
                      const iso = row['status'] as string;
                      return iso === 'active' ? 'Active' : 'Inactive';
                    }
                  },
                  { label: 'Created At',    resolve: (row) => {
                      const iso = row['createdAt'] as string;
                      return iso ? formatDate(iso) : '—';
                    }
                  },
                ], sliders as unknown as Record<string, unknown>[]);
              } finally { setExportLoading(false); }
            }}
          />
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
          <>
            {selIds.size > 0 && (
              <BulkBar>
                <BulkCount><span>{selIds.size}</span> selected</BulkCount>
                <BulkActionBtn $variant="success" disabled={bulkWorking} onClick={() => setBulkConfirm('active')}><CheckCircle size={12} /> Set Active</BulkActionBtn>
                <BulkActionBtn $variant="warning" disabled={bulkWorking} onClick={() => setBulkConfirm('inactive')}><XCircle size={12} /> Set Inactive</BulkActionBtn>
                <BulkActionBtn $variant="danger" disabled={bulkWorking} onClick={() => setBulkConfirm('delete')}><Trash2 size={12} /> Delete</BulkActionBtn>
                <BulkActionBtn $variant="ghost" disabled={bulkWorking} onClick={() => setSelIds(new Set())}>✕ Clear</BulkActionBtn>
              </BulkBar>
            )}
            <FilterBtn>
              <Filter size={14} />
              <select style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer', color: t.colors.textSecondary }}
                value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FilterBtn>
          </>
        }
        columns={COLUMNS}
        selectable
        allChecked={allChecked}
        onToggleAll={toggleAll}
        rows={paged}
        loading={loading}
        emptyIcon={<ImageIcon size={36} />}
        emptyTitle="No sliders found"
        renderRow={(s) => (
          <TR key={s.id}>
            <TD><CheckBox checked={selIds.has(s.id)} onChange={() => toggleOne(s.id)} /></TD>
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
            <TD style={{fontSize:'0.8rem'}}>{formatDate(s.createdAt)}</TD>
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

      {bulkConfirm && (
        <ModalBackdrop onClick={() => setBulkConfirm(null)}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 420, width: '95%' }}>
            <ModalHeader>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>
                {bulkConfirm === 'delete' ? 'Delete Selected Sliders' : bulkConfirm === 'active' ? 'Set Sliders Active' : 'Set Sliders Inactive'}
              </span>
              <button onClick={() => setBulkConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
            </ModalHeader>
            <ModalBody>
              <p style={{ color: t.colors.textSecondary, fontSize: '0.875rem', lineHeight: 1.6 }}>
                {bulkConfirm === 'delete'
                  ? <>Are you sure you want to delete <strong>{selIds.size} slider(s)</strong>? This cannot be undone.</>
                  : <>Set <strong>{selIds.size} slider(s)</strong> to <strong>{bulkConfirm}</strong>?</>}
              </p>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setBulkConfirm(null)} disabled={bulkWorking}>Cancel</AdminBtn>
              <AdminBtn $variant={bulkConfirm === 'delete' ? 'danger' : 'primary'} disabled={bulkWorking} onClick={() => handleBulkAction(bulkConfirm)}>
                {bulkWorking ? 'Processing…' : bulkConfirm === 'delete' ? `Delete ${selIds.size}` : `Set ${selIds.size} ${bulkConfirm}`}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </>
  );
};

export default SlidersPage;