/**
 * src/admin/pages/CouponsPage.tsx
 * Admin: full coupon / promo code management — uses shared AdminDataTable.
 */
import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Trash2, Edit2, Tag, RefreshCw, Search, Copy, CheckCircle, XCircle } from 'lucide-react';
import { ExportDropdown } from '../components/ExportDropdown';
import { exportData } from '../utils/exportUtils';
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
import AdminDataTable, { TR, TD, ColDef, CheckBox } from '../components/AdminDataTable';

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
  const [selIds,   setSelIds]   = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<'active'|'inactive'|'delete'|null>(null);
  const [exportLoading, setExportLoading] = useState(false);

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

  const allIds     = coupons.map(c => c.id);
  const allChecked = allIds.length > 0 && allIds.every(id => selIds.has(id));
  const toggleAll  = () => setSelIds(allChecked ? new Set() : new Set(allIds));
  const toggleOne  = (id: string) => setSelIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleBulkAction = useCallback(async (action: 'active' | 'inactive' | 'delete') => {
    if (!selIds.size) return;
    setBulkWorking(true);
    const ids = Array.from(selIds);
    try {
      if (action === 'delete') {
        await adminCouponsApi.bulkDelete(ids);
        dispatch(showAdminToast({ message: `${ids.length} coupon(s) deleted`, type: 'warning' }));
      } else {
        await adminCouponsApi.bulkUpdateStatus(ids, action);
        dispatch(showAdminToast({ message: `${ids.length} coupon(s) set to ${action}`, type: 'success' }));
      }
      setSelIds(new Set()); setBulkConfirm(null); load();
    } catch (err: any) {
      dispatch(showAdminToast({ message: err?.message || 'Bulk action failed', type: 'error' }));
    } finally { setBulkWorking(false); }
  }, [selIds, dispatch, load]);

  return (
    <div style={{ animation: 'adminFadeIn 0.3s ease both' }}>
      <AdminDataTable
        title="Coupons & Promo Codes"
        subtitle={`${total} coupon(s) total`}
        actions={
          <>
            <ExportDropdown
              loading={exportLoading}
              onExport={async (fmt) => {
                setExportLoading(true);
                try {
                  await exportData(fmt, 'coupons', [
                    { key: 'code',        label: 'Code' },
                    { key: 'type',        label: 'Type' },
                    { key: 'value',       label: 'Value' },
                    { key: 'minOrder',    label: 'Min Order ($)' },
                    { key: 'maxUses',     label: 'Max Uses' },
                    { key: 'usedCount',   label: 'Used' },
                    { key: 'status',      label: 'Status' },
                    { key: 'expiresAt',   label: 'Expires At' },
                    { key: 'createdAt',   label: 'Created At' },
                  ], coupons as unknown as Record<string, unknown>[]);
                } finally { setExportLoading(false); }
              }}
            />
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
          {selIds.size > 0 && (
            <BulkBar>
              <BulkCount><span>{selIds.size}</span> selected</BulkCount>
              <BulkActionBtn $variant="success" disabled={bulkWorking} onClick={() => setBulkConfirm('active')}><CheckCircle size={12} /> Set Active</BulkActionBtn>
              <BulkActionBtn $variant="warning" disabled={bulkWorking} onClick={() => setBulkConfirm('inactive')}><XCircle size={12} /> Set Inactive</BulkActionBtn>
              <BulkActionBtn $variant="danger" disabled={bulkWorking} onClick={() => setBulkConfirm('delete')}><Trash2 size={12} /> Delete</BulkActionBtn>
              <BulkActionBtn $variant="ghost" disabled={bulkWorking} onClick={() => setSelIds(new Set())}>✕ Clear</BulkActionBtn>
            </BulkBar>
          )}
            <AdminSelect value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }} style={{ width: 140, height: 40, borderRadius: 10 }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </AdminSelect>
          </>
        }
        columns={COLUMNS}
        selectable
        allChecked={allChecked}
        onToggleAll={toggleAll}
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
              <TD><CheckBox checked={selIds.has(coupon.id)} onChange={() => toggleOne(coupon.id)} /></TD>
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

      {/* Bulk confirm */}
      {bulkConfirm && (
        <ModalBackdrop onClick={() => setBulkConfirm(null)}>
          <ModalBox $width="420px" onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <span style={{ fontWeight: 700, color: t.colors.textPrimary }}>
                {bulkConfirm === 'delete' ? 'Delete Selected Coupons' : bulkConfirm === 'active' ? 'Set Coupons Active' : 'Set Coupons Inactive'}
              </span>
              <IconBtn onClick={() => setBulkConfirm(null)}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <p style={{ color: t.colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
                {bulkConfirm === 'delete'
                  ? <>Are you sure you want to delete <strong>{selIds.size} coupon(s)</strong>? This cannot be undone.</>
                  : <>Set <strong>{selIds.size} coupon(s)</strong> to <strong>{bulkConfirm}</strong>?</>}
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
    </div>
  );
};