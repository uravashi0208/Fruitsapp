/**
 * TestimonialsPage.tsx
 * Admin CRUD page for customer testimonials with avatar upload and star rating.
 */
import React, { useState, useRef } from 'react';
import { PortalDropdown, MenuItem } from '../components/PortalDropdown';
import styled from 'styled-components';
import {
  Plus, Trash2, RefreshCw, Search, Star,
  MoreHorizontal, Edit2, User, Filter,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminCard, AdminBtn, IconBtn, StatusPill,
  AdminInput, AdminSelect, AdminTextarea,
  FormGroup, FormLabel, FormGrid, EmptyState,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter,
  PageBtns, PageBtn,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { useAdminTestimonials } from '../../hooks/useAdminApi';
import { adminTestimonialsApi, AdminTestimonial } from '../../api/admin';
import { ApiError, API_BASE } from '../../api/client';

/* ── Styled ─────────────────────────────────────────────────── */
const PageHeader  = styled.div`display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;`;
const PageTitle   = styled.h1`font-size:1.375rem;font-weight:700;color:${t.colors.textPrimary};margin:0 0 2px;`;
const PageSub     = styled.p`font-size:0.8125rem;color:${t.colors.textMuted};margin:0;`;
const HeaderBtns  = styled.div`display:flex;gap:10px;flex-wrap:wrap;`;
const TableWrap   = styled(AdminCard)`padding:0;overflow:hidden;`;
const TableInner  = styled.div`overflow-x:auto;`;
const Tbl         = styled.table`width:100%;border-collapse:collapse;font-family:${t.fonts.body};`;
const THead       = styled.thead`background:${t.colors.surfaceAlt};border-bottom:1px solid ${t.colors.border};`;
const TH          = styled.th<{$center?:boolean}>`
  padding:12px 16px;font-size:0.75rem;font-weight:600;color:${t.colors.textMuted};
  text-align:${({$center})=>$center?'center':'left'};white-space:nowrap;
`;
const TR = styled.tr`
  border-bottom:1px solid ${t.colors.border};transition:background 0.12s;
  &:last-child{border-bottom:none;}
  &:hover{background:${t.colors.surfaceAlt};}
`;
const TD = styled.td<{$center?:boolean}>`
  padding:14px 16px;font-size:0.8125rem;color:${t.colors.textSecondary};vertical-align:middle;
  ${({$center})=>$center&&'text-align:center;'}
`;
const PersonCell  = styled.div`display:flex;align-items:center;gap:12px;`;
const AvatarImg   = styled.img`width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid ${t.colors.border};flex-shrink:0;`;
const AvatarPh    = styled.div`width:44px;height:44px;border-radius:50%;background:${t.colors.surfaceAlt};border:2px solid ${t.colors.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const PersonName  = styled.div`font-weight:600;color:${t.colors.textPrimary};font-size:0.875rem;`;
const PersonPos   = styled.div`font-size:0.75rem;color:${t.colors.textMuted};margin-top:2px;`;
const MsgPreview  = styled.div`max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8125rem;color:${t.colors.textSecondary};`;
const StarRow     = styled.div`display:flex;gap:2px;align-items:center;`;
const SearchBar   = styled.div`display:flex;align-items:center;gap:8px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 12px;background:white;height:40px;min-width:200px;`;
const SearchInp   = styled.input`border:none;outline:none;font-size:0.875rem;background:transparent;flex:1;color:${t.colors.textPrimary};&::placeholder{color:${t.colors.textMuted};}`;
const FilterBtn   = styled.button`display:flex;align-items:center;gap:6px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 14px;height:40px;background:white;font-size:0.875rem;font-weight:500;color:${t.colors.textSecondary};cursor:pointer;&:hover{background:${t.colors.surfaceAlt};}`;
const ActionDot   = styled.button`background:none;border:none;cursor:pointer;color:${t.colors.textMuted};padding:4px;border-radius:6px;display:flex;align-items:center;position:relative;&:hover{background:${t.colors.border};color:${t.colors.textPrimary};}`;
const DropMenu    = styled.div`position:absolute;right:0;top:calc(100% + 4px);background:white;border:1px solid ${t.colors.border};border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.10);min-width:140px;z-index:100;overflow:hidden;`;
const DropItem    = styled.button<{$danger?:boolean}>`display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:none;border:none;cursor:pointer;font-size:0.8125rem;font-weight:500;color:${({$danger})=>$danger?t.colors.danger:t.colors.textSecondary};&:hover{background:${({$danger})=>$danger?'#fef3f2':t.colors.surfaceAlt};}`;
const UploadBox   = styled.label`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  border:2px dashed ${t.colors.border};border-radius:12px;padding:20px;cursor:pointer;
  gap:8px;text-align:center;transition:border-color 0.15s,background 0.15s;
  &:hover{border-color:${t.colors.primary};background:${t.colors.primaryGhost};}
`;
const UploadInput = styled.input`display:none;`;
const AvatarPreview = styled.img`
  width:88px;height:88px;border-radius:50%;object-fit:cover;
  border:3px solid ${t.colors.border};display:block;margin:0 auto 8px;
`;

// ── Star picker ───────────────────────────────────────────────
const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1,2,3,4,5].map(n => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
      >
        <Star size={22} fill={n <= value ? '#f79009' : 'none'} color={n <= value ? '#f79009' : '#d0d5dd'} />
      </button>
    ))}
  </div>
);

// ── Star display (read-only) ──────────────────────────────────
const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <StarRow>
    {[1,2,3,4,5].map(n => (
      <Star key={n} size={13} fill={n <= rating ? '#f79009' : 'none'} color={n <= rating ? '#f79009' : '#d0d5dd'} />
    ))}
    <span style={{ fontSize: '0.75rem', color: t.colors.textMuted, marginLeft: 4 }}>{rating}/5</span>
  </StarRow>
);

/* ── Types ───────────────────────────────────────────────────── */
type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;
interface FormState {
  name:     string;
  position: string;
  message:  string;
  rating:   number;
  status:   'active' | 'inactive';
}
const emptyForm = (): FormState => ({ name: '', position: '', message: '', rating: 5, status: 'active' });

/* ── Avatar URL resolver ─────────────────────────────────────── */
const resolveAvatar = (avatar: string) => {
  if (!avatar) return '';
  if (avatar.startsWith('http') || avatar.startsWith('/images')) return avatar;
  return `${API_BASE}${avatar}`;
};

/* ── Component ───────────────────────────────────────────────── */
export const TestimonialsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const { data: rawData, loading, error, refetch } = useAdminTestimonials();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 10;

  const [mode,       setMode]       = useState<ModalMode>(null);
  const [selected,   setSelected]   = useState<AdminTestimonial | null>(null);
  const [form,       setForm]       = useState<FormState>(emptyForm());
  const [imgFile,    setImgFile]    = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string>('');
  const [saving,     setSaving]     = useState(false);
  const [openDrop,   setOpenDrop]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Filter & paginate ── */
  const items = (rawData ?? []).filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.name.toLowerCase().includes(q) || t.position.toLowerCase().includes(q) || t.message.toLowerCase().includes(q);
    const matchS = !statusFilter || t.status === statusFilter;
    return matchQ && matchS;
  });
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const paged = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ── Modal helpers ── */
  const openCreate = () => { setSelected(null); setForm(emptyForm()); setImgFile(null); setImgPreview(''); setMode('create'); };
  const openEdit   = (item: AdminTestimonial) => {
    setSelected(item);
    setForm({ name: item.name, position: item.position, message: item.message, rating: item.rating, status: item.status });
    setImgFile(null);
    setImgPreview(resolveAvatar(item.avatar));
    setMode('edit');
  };
  const openView   = (item: AdminTestimonial) => { setSelected(item); setMode('view'); };
  const openDelete = (item: AdminTestimonial) => { setSelected(item); setMode('delete'); };
  const closeModal = () => { setMode(null); setSelected(null); };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.name.trim())    { dispatch(showAdminToast({ message: 'Name is required', type: 'error' })); return; }
    if (!form.message.trim()) { dispatch(showAdminToast({ message: 'Message is required', type: 'error' })); return; }

    const fd = new FormData();
    fd.append('name',     form.name);
    fd.append('position', form.position);
    fd.append('message',  form.message);
    fd.append('rating',   String(form.rating));
    fd.append('status',   form.status);
    if (imgFile) fd.append('avatar', imgFile);

    setSaving(true);
    try {
      if (mode === 'create') {
        await adminTestimonialsApi.create(fd);
        dispatch(showAdminToast({ message: 'Testimonial created successfully', type: 'success' }));
      } else if (mode === 'edit' && selected) {
        await adminTestimonialsApi.update(selected.id, fd);
        dispatch(showAdminToast({ message: 'Testimonial updated successfully', type: 'success' }));
      }
      closeModal();
      refetch();
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Something went wrong', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminTestimonialsApi.delete(selected.id);
      dispatch(showAdminToast({ message: 'Testimonial deleted', type: 'success' }));
      closeModal();
      refetch();
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Delete failed', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ── */
  return (
    <>
      {/* Header */}
      <PageHeader>
        <div>
          <PageTitle>Testimonials</PageTitle>
          <PageSub>Manage customer reviews and testimonials</PageSub>
        </div>
        <HeaderBtns>
          <IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16} /></IconBtn>
          <AdminBtn $variant="primary" onClick={openCreate}><Plus size={15} /> Add Testimonial</AdminBtn>
        </HeaderBtns>
      </PageHeader>

      <TableWrap>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{fontWeight: 600, color: t.colors.textPrimary, fontSize: '0.9375rem'}}>Testimonials List</div>
          </div>
          <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center'}}>  
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <SearchBar>
            <Search size={15} color={t.colors.textMuted} />
            <SearchInp placeholder="Search by name or message…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </SearchBar>
            <FilterBtn>
            <Filter size={14} />
            <select
            style={{ border:'none', outline:'none', background:'transparent', fontSize:'0.875rem', cursor:'pointer', color: t.colors.textSecondary }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
            >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            </select>
            </FilterBtn>
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: t.colors.textMuted }}>Loading testimonials…</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: t.colors.danger }}>{error}</div>
        ) : paged.length === 0 ? (
          <EmptyState>
            <User size={40} strokeWidth={1} color={t.colors.textMuted} />
            <p style={{ margin: '8px 0 0', color: t.colors.textMuted, fontSize: '0.875rem' }}>No testimonials found</p>
          </EmptyState>
        ) : (
          <TableInner>
            <Tbl>
              <THead>
                <tr>
                  <TH>Person</TH>
                  <TH>Message</TH>
                  <TH>Rating</TH>
                  <TH $center>Status</TH>
                  <TH $center>Actions</TH>
                </tr>
              </THead>
              <tbody>
                {paged.map(item => (
                  <TR key={item.id}>
                    <TD>
                      <PersonCell>
                        {resolveAvatar(item.avatar)
                          ? <AvatarImg src={resolveAvatar(item.avatar)} alt={item.name} />
                          : <AvatarPh><User size={18} color={t.colors.textMuted} /></AvatarPh>
                        }
                        <div>
                          <PersonName>{item.name}</PersonName>
                          <PersonPos>{item.position || '—'}</PersonPos>
                        </div>
                      </PersonCell>
                    </TD>
                    <TD><MsgPreview>"{item.message}"</MsgPreview></TD>
                    <TD><Stars rating={item.rating} /></TD>
                    <TD $center>
                      <StatusPill $variant={item.status === 'active' ? 'success' : 'neutral'}>
                        {item.status}
                      </StatusPill>
                    </TD>
                    <TD $center>
                      <PortalDropdown>
                        <MenuItem onClick={() => openView(item)}><Edit2 size={13} /> View</MenuItem>
                        <MenuItem onClick={() => openEdit(item)}><Edit2 size={13} /> Edit</MenuItem>
                        <MenuItem $danger onClick={() => openDelete(item)}><Trash2 size={13} /> Delete</MenuItem>
                      </PortalDropdown>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Tbl>
          </TableInner>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${t.colors.border}`, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.8125rem', color: t.colors.textMuted }}>
          {items.length > 0 ? `Showing ${(page-1)*PER_PAGE+1}–${Math.min(page*PER_PAGE, items.length)} of ${items.length}` : '0 testimonials'}
          </span>
          <PageBtns>
          <PageBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</PageBtn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <PageBtn key={p} $active={p === page} onClick={() => setPage(p)}>{p}</PageBtn>
          ))}
          <PageBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</PageBtn>
          </PageBtns>
        </div>
      </TableWrap>

      {/* ── Create / Edit Modal ── */}
      {(mode === 'create' || mode === 'edit') && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 580, width: '95%' }}>
            <ModalHeader>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>
                {mode === 'create' ? 'Add New Testimonial' : 'Edit Testimonial'}
              </span>
              <button onClick={closeModal} style={{ background:'none', border:'none', cursor:'pointer', color: t.colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
            </ModalHeader>

            <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Avatar upload */}
              <FormGroup>
                <FormLabel>Avatar Photo</FormLabel>
                {imgPreview ? (
                  <div style={{ textAlign: 'center' }}>
                    <AvatarPreview src={imgPreview} alt="preview" />
                    <button
                      onClick={() => { setImgFile(null); setImgPreview(''); if (fileRef.current) fileRef.current.value = ''; }}
                      style={{ background: 'none', border: `1px solid ${t.colors.border}`, borderRadius: 6, color: t.colors.textMuted, cursor: 'pointer', padding: '4px 12px', fontSize: 12, marginTop: 4 }}
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <UploadBox>
                    <UploadInput ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} />
                    <User size={28} color={t.colors.textMuted} />
                    <span style={{ fontSize: '0.8125rem', color: t.colors.textMuted }}>Click to upload avatar</span>
                    <span style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>PNG, JPG up to 5MB</span>
                  </UploadBox>
                )}
              </FormGroup>

              {/* Name & Position */}
              <FormGrid>
                <FormGroup>
                  <FormLabel>Name <span style={{ color: t.colors.danger }}>*</span></FormLabel>
                  <AdminInput placeholder="e.g. Sarah Johnson" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Position / Role</FormLabel>
                  <AdminInput placeholder="e.g. Health Coach" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                </FormGroup>
              </FormGrid>

              {/* Message */}
              <FormGroup>
                <FormLabel>Message <span style={{ color: t.colors.danger }}>*</span></FormLabel>
                <AdminTextarea
                  rows={4}
                  placeholder="What the customer said…"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </FormGroup>

              {/* Rating & Status */}
              <FormGrid>
                <FormGroup>
                  <FormLabel>Rating</FormLabel>
                  <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Status</FormLabel>
                  <AdminSelect value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </AdminSelect>
                </FormGroup>
              </FormGrid>
            </ModalBody>

            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>Cancel</AdminBtn>
              <AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : mode === 'create' ? 'Create Testimonial' : 'Save Changes'}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── View Modal ── */}
      {mode === 'view' && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '95%' }}>
            <ModalHeader>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>Testimonial Details</span>
              <button onClick={closeModal} style={{ background:'none', border:'none', cursor:'pointer', color: t.colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
            </ModalHeader>
            <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
              {resolveAvatar(selected.avatar)
                ? <AvatarPreview src={resolveAvatar(selected.avatar)} alt={selected.name} />
                : <AvatarPh style={{ width: 88, height: 88, margin: '0 auto' }}><User size={32} color={t.colors.textMuted} /></AvatarPh>
              }
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>{selected.name}</div>
                <div style={{ fontSize: '0.8125rem', color: t.colors.textMuted }}>{selected.position || '—'}</div>
              </div>
              <Stars rating={selected.rating} />
              <p style={{ fontSize: '0.875rem', color: t.colors.textSecondary, lineHeight: 1.7, fontStyle: 'italic', borderLeft: `3px solid ${t.colors.primary}`, paddingLeft: 12, textAlign: 'left', margin: 0 }}>
                "{selected.message}"
              </p>
              <StatusPill $variant={selected.status === 'active' ? 'success' : 'neutral'}>{selected.status}</StatusPill>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>Close</AdminBtn>
              <AdminBtn $variant="primary" onClick={() => { closeModal(); openEdit(selected); }}>Edit</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm Modal ── */}
      {mode === 'delete' && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 420, width: '95%' }}>
            <ModalHeader>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.danger }}>Delete Testimonial</span>
              <button onClick={closeModal} style={{ background:'none', border:'none', cursor:'pointer', color: t.colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
            </ModalHeader>
            <ModalBody>
              <p style={{ color: t.colors.textSecondary, fontSize: '0.875rem', lineHeight: 1.6 }}>
                Are you sure you want to delete the testimonial from <strong>"{selected.name}"</strong>? This cannot be undone.
              </p>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>Cancel</AdminBtn>
              <AdminBtn $variant="danger" onClick={handleDelete} disabled={saving} style={{ background: t.colors.danger, color: 'white' }}>
                {saving ? 'Deleting…' : 'Delete'}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* Click outside to close dropdown */}
      {openDrop && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpenDrop(null)} />}
    </>
  );
};

export default TestimonialsPage;
