/**
 * src/admin/pages/CouponsPage.tsx
 * Admin: full coupon / promo code management — uses shared AdminDataTable.
 */
import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Trash2, Edit2, Tag, RefreshCw, Search, Copy, CheckCircle } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminFlex, AdminBtn, IconBtn, ToggleTrack, ToggleThumb,
  AdminInput, AdminSelect, FormGroup, FormLabel, FormGrid,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { adminCouponsApi, AdminCoupon } from '../../api/storefront';
import { ApiError } from '../../api/client';
import { formatDate } from '../utils/formatDate';
import AdminDataTable, { TR, TD, ColDef } from '../components/AdminDataTable';

// ── Styled ─────────────────────────────────────────────────────────────────────

const CodeBadge = styled.div`
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem; font-weight: 700;
  color: ${t.colors.primary}; background: ${t.colors.primaryGhost};
  padding: 3px 10px; border-radius: 6px; cursor: pointer;
  &:hover { background: rgba(70,95,255,0.15); }
`;

const ProgressBar = styled.div<{ $pct: number }>`
  height: 6px; background: ${t.colors.border}; border-radius: 3px; overflow: hidden; margin-top: 4px;
  &::after {
    content: ''; display: block; height: 100%;
    width: ${({ $pct }) => Math.min(100, $pct)}%;
    background: ${({ $pct }) => $pct >= 90 ? t.colors.danger : t.colors.primary};
    border-radius: 3px;
  }
`;

const SwitchWrap = styled.label`
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  input { display: none; }
  span.track {
    width: 40px; height: 22px; background: ${t.colors.border}; border-radius: 11px;
    position: relative; transition: background 0.2s;
    &::after { content:''; position:absolute; width:16px; height:16px; background:white; border-radius:50%; top:3px; left:3px; transition:transform 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.15); }
  }
  input:checked + span.track { background: ${t.colors.success}; }
  input:checked + span.track::after { transform: translateX(18px); }
`;

const SearchBar2   = styled.div`display:flex;align-items:center;gap:8px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 12px;background:white;height:40px;min-width:200px;`;
const SearchInput2 = styled.input`border:none;outline:none;font-size:0.875rem;background:transparent;flex:1;color:${t.colors.textPrimary};&::placeholder{color:${t.colors.textMuted};}`;

const PAGE_SIZE = 10;

const emptyForm: Partial<AdminCoupon> & { code: string } = {
  code: '', type: 'percent', value: 10,
  minOrder: 0, maxUses: null, expiresAt: null, status: 'active',
};

const COLUMNS: ColDef[] = [
  { key: 'code',     label: 'Code' },
  { key: 'discount', label: 'Discount' },
  { key: 'minOrder', label: 'Min Order' },
  { key: 'usage',    label: 'Usage' },
  { key: 'expires',  label: 'Expires' },
  { key: 'status',   label: 'Status' },
  { key: 'actions',  label: 'Actions' },
];

export const CouponsPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  const [localStatus, setLocalStatus] = useState<Record<string, 'active' | 'inactive'>>({});

  const toggleStatus = async (coupon: AdminCoupon) => {
    const current = localStatus[coupon.id] ?? coupon.status;
    const next = current === 'active' ? 'inactive' : 'active';
    setLocalStatus(prev => ({ ...prev, [coupon.id]: next }));
    try {
      await adminCouponsApi.update(coupon.id, { status: next });
    } catch {
      setLocalStatus(prev => ({ ...prev, [coupon.id]: current }));
      dispatch(showAdminToast({ message: 'Failed to update status', type: 'error' }));
    }
  };

  const [coupons,  setCoupons]  = useState<AdminCoupon[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState<AdminCoupon | null>(null);
  const [form,     setForm]     = useState({ ...emptyForm });
  const [saving,   setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied,   setCopied]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCouponsApi.list({ page, limit: PAGE_SIZE, search, status: statusF });
      setCoupons(res.success ? res.data : []);
      setTotal(res.pagination?.total ?? 0);
    } catch { setCoupons([]); }
    finally { setLoading(false); }
  }, [page, search, statusF]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setModal(true); };
  const openEdit   = (c: AdminCoupon) => { setEditing(c); setForm({ ...c }); setModal(true); };

  const handleSave = async () => {
    if (!form.code?.trim()) {
      dispatch(showAdminToast({ message: 'Coupon code is required', type: 'error' })); return;
    }
    if (!form.value || Number(form.value) <= 0) {
      dispatch(showAdminToast({ message: 'Value must be greater than 0', type: 'error' })); return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await adminCouponsApi.update(editing.id, form);
        setCoupons(prev => prev.map(c => c.id === editing.id ? res.data : c));
        dispatch(showAdminToast({ message: 'Coupon updated', type: 'success' }));
      } else {
        const res = await adminCouponsApi.create(form);
        setCoupons(prev => [res.data, ...prev]);
        setTotal(t => t + 1);
        dispatch(showAdminToast({ message: 'Coupon created', type: 'success' }));
      }
      setModal(false);
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Save failed', type: 'error' }));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminCouponsApi.delete(deleteId);
      setCoupons(prev => prev.filter(c => c.id !== deleteId));
      setTotal(t => t - 1);
      dispatch(showAdminToast({ message: 'Coupon deleted', type: 'success' }));
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Delete failed', type: 'error' }));
    } finally { setDeleting(false); setDeleteId(null); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code); setTimeout(() => setCopied(null), 1500);
    });
  };

  const field = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ animation: 'adminFadeIn 0.3s ease both' }}>
      <AdminDataTable
        title="Coupons & Promo Codes"
        subtitle={`${total} coupon(s) total`}
        actions={
          <>
            <AdminBtn $variant="primary" onClick={openCreate}><Plus size={15} /> Create Coupon</AdminBtn>
            <IconBtn title="Refresh" onClick={load}><RefreshCw size={14} /></IconBtn>
          </>
          
        }
        searchArea={
          <SearchBar2 style={{ border: `1px solid ${t.colors.border}`, borderRadius: 10, background: t.colors.surfaceAlt }}>
            <Search size={16} color={t.colors.textMuted} />
            <SearchInput2 placeholder="Search coupon code…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </SearchBar2>
        }
        filterArea={
          <>
            <AdminSelect value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }} style={{ width: 140, height: 40, borderRadius: 10 }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </AdminSelect>
          </>
        }
        columns={COLUMNS}
        rows={coupons}
        loading={loading}
        emptyIcon={<Tag size={32} color={t.colors.textMuted} />}
        emptyTitle="No coupons found"
        emptyText="Create your first promo code!"
        emptyAction={<AdminBtn $variant="primary" onClick={openCreate}><Plus size={14} /> Create Coupon</AdminBtn>}
        renderRow={(coupon) => {
          const usagePct = coupon.maxUses ? (coupon.usedCount / coupon.maxUses) * 100 : 0;
          return (
            <TR key={coupon.id}>
              <TD>
                <CodeBadge onClick={() => copyCode(coupon.code)}>
                  {coupon.code}
                  {copied === coupon.code ? <CheckCircle size={12} color={t.colors.success} /> : <Copy size={11} />}
                </CodeBadge>
              </TD>
              <TD>{coupon.type === 'percent' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}</TD>
              <TD>{coupon.minOrder > 0 ? `$${coupon.minOrder}` : <span style={{ color: t.colors.textMuted }}>None</span>}</TD>
              <TD>
                <div style={{ fontSize: '0.8125rem' }}>
                  {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ' uses'}
                </div>
                {coupon.maxUses && <ProgressBar $pct={usagePct} title={`${usagePct.toFixed(0)}% used`} />}
              </TD>
              <TD>
                {coupon.expiresAt
                  ? <span style={{ color: new Date(coupon.expiresAt) < new Date() ? t.colors.danger : t.colors.textSecondary }}>{formatDate(coupon.expiresAt)}</span>
                  : <span style={{ color: t.colors.textMuted }}>Never</span>
                }
              </TD>
              <TD>
                <ToggleTrack $on={(localStatus[coupon.id] ?? coupon.status) === 'active'} onClick={e => { e.stopPropagation(); toggleStatus(coupon); }} title="Toggle status">
                  <ToggleThumb $on={(localStatus[coupon.id] ?? coupon.status) === 'active'} />
                </ToggleTrack>
              </TD>
              <TD>
                <AdminFlex $gap="6px">
                  <IconBtn title="Edit" onClick={() => openEdit(coupon)}><Edit2 size={14} /></IconBtn>
                  <IconBtn $variant="danger" title="Delete" onClick={() => setDeleteId(coupon.id)}><Trash2 size={14} /></IconBtn>
                </AdminFlex>
              </TD>
            </TR>
          );
        }}
        showPagination
        paginationInfo={`${total} coupon(s) total`}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Create / Edit Modal */}
      {modal && (
        <ModalBackdrop onClick={() => setModal(false)}>
          <ModalBox style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <span>{editing ? 'Edit Coupon' : 'Create Coupon'}</span>
              <IconBtn onClick={() => setModal(false)}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <FormGrid $cols={2}>
                <FormGroup $span={2}>
                  <FormLabel>Coupon Code *</FormLabel>
                  <AdminInput placeholder="e.g. SUMMER20" value={form.code} onChange={e => field('code', e.target.value.toUpperCase())} style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }} disabled={!!editing} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Discount Type</FormLabel>
                  <AdminSelect value={form.type} onChange={e => field('type', e.target.value)}>
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </AdminSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Value *</FormLabel>
                  <AdminInput type="number" min="0.01" step="0.01" placeholder={form.type === 'percent' ? '10 (= 10%)' : '5 (= $5 off)'} value={form.value || ''} onChange={e => field('value', parseFloat(e.target.value))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Min Order Amount ($)</FormLabel>
                  <AdminInput type="number" min="0" step="0.01" placeholder="0 = no minimum" value={form.minOrder || ''} onChange={e => field('minOrder', parseFloat(e.target.value) || 0)} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Max Uses</FormLabel>
                  <AdminInput type="number" min="1" placeholder="Leave blank = unlimited" value={form.maxUses || ''} onChange={e => field('maxUses', e.target.value ? parseInt(e.target.value) : null)} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Expires At</FormLabel>
                  <AdminInput type="date" value={form.expiresAt ? (form.expiresAt as string).slice(0, 10) : ''} onChange={e => field('expiresAt', e.target.value || null)} />
                </FormGroup>
                <FormGroup $span={2}>
                  <FormLabel>Status</FormLabel>
                  <SwitchWrap>
                    <input type="checkbox" checked={form.status === 'active'} onChange={e => field('status', e.target.checked ? 'active' : 'inactive')} />
                    <span className="track" />
                    <span style={{ fontSize: '0.875rem', color: t.colors.textSecondary }}>{form.status === 'active' ? 'Active' : 'Inactive'}</span>
                  </SwitchWrap>
                </FormGroup>
              </FormGrid>
              {form.type === 'percent' && (form.value ?? 0) > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: t.colors.primaryGhost, borderRadius: 8, fontSize: '0.8125rem', color: t.colors.primary }}>
                  Preview: <strong>{form.value}% off</strong>
                  {form.minOrder ? ` on orders over $${form.minOrder}` : ''}
                  {form.expiresAt ? ` · expires ${form.expiresAt}` : ''}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setModal(false)}>Cancel</AdminBtn>
              <AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Coupon' : 'Create Coupon'}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ModalBackdrop onClick={() => setDeleteId(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHeader><span>Delete Coupon</span><IconBtn onClick={() => setDeleteId(null)}>✕</IconBtn></ModalHeader>
            <ModalBody>
              <p style={{ color: t.colors.textSecondary }}>Are you sure? This coupon will be permanently deleted.</p>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setDeleteId(null)}>Cancel</AdminBtn>
              <AdminBtn $variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </div>
  );
};