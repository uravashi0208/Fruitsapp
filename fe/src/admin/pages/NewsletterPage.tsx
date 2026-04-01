/**
 * NewsletterPage.tsx — uses shared AdminDataTable.
 */
import React, { useState } from 'react';
import { PortalDropdown, MenuItem } from '../components/PortalDropdown';
import styled from 'styled-components';
import { Mail, Trash2, RefreshCw, Search, Send, Users, Filter } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminBtn, IconBtn, ToggleTrack, ToggleThumb,
  AdminInput, AdminTextarea, FormGroup, FormLabel,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { useAdminNewsletter } from '../../hooks/useAdminApi';
import { adminNewsletterApi, NewsletterSubscriber } from '../../api/admin';
import { ApiError } from '../../api/client';
import AdminDataTable, { TR, TD, ColDef } from '../components/AdminDataTable';

/* ── Styled ─────────────────────────────────────────────────── */
const StatsRow  = styled.div`display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;`;
const StatCard  = styled.div<{ $color: string }>`
  flex:1;min-width:140px;background:white;border-radius:12px;
  border:1px solid ${t.colors.border};padding:20px 24px;
  display:flex;align-items:center;gap:14px;
  border-left:4px solid ${({ $color }) => $color};
`;
const StatIcon  = styled.div<{ $bg: string }>`width:42px;height:42px;border-radius:10px;background:${({ $bg }) => $bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const StatVal   = styled.div`font-size:1.5rem;font-weight:700;color:${t.colors.textPrimary};line-height:1;`;
const StatLabel = styled.div`font-size:0.75rem;color:${t.colors.textMuted};margin-top:3px;`;

const EmailAvatar = styled.div`
  width:36px;height:36px;border-radius:50%;
  background:${t.colors.primaryGhost};border:1px solid ${t.colors.primaryLight};
  display:flex;align-items:center;justify-content:center;
  font-size:0.875rem;font-weight:600;color:${t.colors.primary};flex-shrink:0;
`;
const EmailCell = styled.div`display:flex;align-items:center;gap:10px;`;
const EmailText = styled.div`font-weight:500;color:${t.colors.textPrimary};font-size:0.875rem;`;

const SearchBar = styled.div`display:flex;align-items:center;gap:8px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 12px;background:white;height:40px;min-width:220px;`;
const SearchInp = styled.input`border:none;outline:none;font-size:0.875rem;background:transparent;flex:1;color:${t.colors.textPrimary};&::placeholder{color:${t.colors.textMuted};}`;
const FilterBtn = styled.button`display:flex;align-items:center;gap:6px;border:1px solid ${t.colors.border};border-radius:10px;padding:0 14px;height:40px;background:white;font-size:0.875rem;font-weight:500;color:${t.colors.textSecondary};cursor:pointer;&:hover{background:${t.colors.surfaceAlt};}`;

const CharCount = styled.div<{ $over: boolean }>`font-size:0.75rem;text-align:right;margin-top:4px;color:${({ $over }) => $over ? t.colors.danger : t.colors.textMuted};`;
const ResultBox = styled.div<{ $success: boolean }>`padding:16px;border-radius:10px;text-align:center;background:${({ $success }) => $success ? t.colors.successBg : t.colors.dangerBg};border:1px solid ${({ $success }) => $success ? t.colors.success : t.colors.danger};`;

const COLUMNS: ColDef[] = [
  { key: 'subscriber',   label: 'Subscriber' },
  { key: 'name',         label: 'Name' },
  { key: 'subscribedOn', label: 'Subscribed On' },
  { key: 'status',       label: 'Status' },
  { key: 'actions',      label: 'Actions' },
];

export const NewsletterPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  const [localStatus, setLocalStatus] = useState<Record<string, 'active' | 'unsubscribed'>>({});
  const toggleStatus = async (s: NewsletterSubscriber) => {
    const current = localStatus[s.id] ?? s.status;
    const next = current === 'active' ? 'unsubscribed' : 'active';
    setLocalStatus(prev => ({ ...prev, [s.id]: next }));
    try {
      await adminNewsletterApi.setStatus(s.id, next);
    } catch {
      setLocalStatus(prev => ({ ...prev, [s.id]: current }));
      dispatch(showAdminToast({ message: 'Failed to update status', type: 'error' }));
    }
  };

  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'unsubscribed'>('');
  const [openDrop,     setOpenDrop]     = useState<string | null>(null);

  const { data: allSubs, pagination, loading, refetch } = useAdminNewsletter({
    page, limit: 20, status: statusFilter || undefined,
  });

  const subscribers = (allSubs ?? []).filter((s: NewsletterSubscriber) => {
    const q = search.toLowerCase();
    return !q || s.email.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q);
  });

  const [deleteTarget, setDeleteTarget] = useState<NewsletterSubscriber | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminNewsletterApi.delete(deleteTarget.id);
      dispatch(showAdminToast({ message: 'Subscriber removed', type: 'success' }));
      setDeleteTarget(null); refetch();
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Delete failed', type: 'error' }));
    } finally { setDeleting(false); }
  };

  const [sendOpen,   setSendOpen]   = useState(false);
  const [subject,    setSubject]    = useState('');
  const [message,    setMessage]    = useState('');
  const [sending,    setSending]    = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const MAX_MSG = 2000;

  const handleSend = async () => {
    if (!subject.trim()) { dispatch(showAdminToast({ message: 'Subject is required', type: 'error' })); return; }
    if (!message.trim()) { dispatch(showAdminToast({ message: 'Message is required', type: 'error' })); return; }
    setSending(true); setSendResult(null);
    try {
      const res = await adminNewsletterApi.send({ subject, message });
      if (res.success && res.data) {
        setSendResult(res.data);
        dispatch(showAdminToast({ message: `Sent to ${res.data.sent} subscriber(s)`, type: 'success' }));
      }
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Failed to send email', type: 'error' }));
    } finally { setSending(false); }
  };

  const closeSendModal = () => { setSendOpen(false); setSendResult(null); setSubject(''); setMessage(''); };

  return (
    <>
      {/* Stats */}
      <StatsRow>
        <StatCard $color={t.colors.primary}>
          <StatIcon $bg={t.colors.primaryGhost}><Users size={20} color={t.colors.primary} /></StatIcon>
          <div><StatVal>{pagination.total}</StatVal><StatLabel>Total Subscribers</StatLabel></div>
        </StatCard>
        <StatCard $color={t.colors.success}>
          <StatIcon $bg={t.colors.successBg}><Mail size={20} color={t.colors.success} /></StatIcon>
          <div><StatVal>{subscribers.filter(s => s.status === 'active').length}</StatVal><StatLabel>Active</StatLabel></div>
        </StatCard>
        <StatCard $color={t.colors.warning}>
          <StatIcon $bg={t.colors.warningBg}><Mail size={20} color={t.colors.warning} /></StatIcon>
          <div><StatVal>{subscribers.filter(s => s.status === 'unsubscribed').length}</StatVal><StatLabel>Unsubscribed</StatLabel></div>
        </StatCard>
      </StatsRow>

      <AdminDataTable
        title="Newsletter"
        subtitle="Manage subscribers and send email campaigns"
        actions={
          <>
          <AdminBtn $variant="primary" onClick={() => { setSendOpen(true); setSendResult(null); }}><Send size={15} /> Send Email</AdminBtn>
          <IconBtn title="Refresh" onClick={refetch}><RefreshCw size={16} /></IconBtn>
          </>
        }
        searchArea={
          <SearchBar>
            <Search size={15} color={t.colors.textMuted} />
            <SearchInp placeholder="Search by email or name…" value={search} onChange={e => setSearch(e.target.value)} />
          </SearchBar>
        }
        filterArea={
          <FilterBtn>
            <Filter size={14} />
            <select
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer', color: t.colors.textSecondary }}
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </FilterBtn>
        }
        columns={COLUMNS}
        rows={subscribers}
        loading={loading}
        emptyIcon={<Mail size={40} strokeWidth={1} color={t.colors.textMuted} />}
        emptyTitle="No subscribers found"
        renderRow={(s: NewsletterSubscriber) => (
          <TR key={s.id}>
            <TD>
              <EmailCell>
                <EmailAvatar>{s.email.charAt(0).toUpperCase()}</EmailAvatar>
                <EmailText>{s.email}</EmailText>
              </EmailCell>
            </TD>
            <TD>{s.name || '—'}</TD>
            <TD>
              {s.createdAt
                ? new Date(s.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : '—'}
            </TD>
            <TD>
              <ToggleTrack $on={(localStatus[s.id] ?? s.status) === 'active'} onClick={e => { e.stopPropagation(); toggleStatus(s); }} title="Toggle status">
                <ToggleThumb $on={(localStatus[s.id] ?? s.status) === 'active'} />
              </ToggleTrack>
            </TD>
            <TD>
              <PortalDropdown>
                <MenuItem $danger onClick={() => setDeleteTarget(s)}><Trash2 size={13} /> Remove</MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={
          pagination.total > 0
            ? `Showing ${(page-1)*20+1}–${Math.min(page*20, pagination.total)} of ${pagination.total} subscribers`
            : '0 subscribers'
        }
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        onPageChange={setPage}
      />

      {/* Send Email Modal */}
      {sendOpen && (
        <ModalBackdrop onClick={closeSendModal}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 580, width: '95%' }}>
            <ModalHeader>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.textPrimary }}>Send Email Campaign</span>
              <button onClick={closeSendModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
            </ModalHeader>
            <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: t.colors.primaryGhost, border: `1px solid ${t.colors.primaryLight}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={16} color={t.colors.primary} />
                <span style={{ fontSize: '0.8125rem', color: t.colors.primary, fontWeight: 500 }}>
                  This will send to all <strong>{pagination.total}</strong> active subscriber(s)
                </span>
              </div>
              {sendResult && (
                <ResultBox $success={sendResult.failed === 0}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>{sendResult.failed === 0 ? '✅' : '⚠️'} Email Sent</div>
                  <div style={{ fontSize: '0.875rem', color: t.colors.textSecondary }}>
                    <strong style={{ color: t.colors.success }}>{sendResult.sent}</strong> sent successfully
                    {sendResult.failed > 0 && <>, <strong style={{ color: t.colors.danger }}>{sendResult.failed}</strong> failed</>}
                    {' '}out of <strong>{sendResult.total}</strong> total
                  </div>
                </ResultBox>
              )}
              <FormGroup>
                <FormLabel>Subject *</FormLabel>
                <AdminInput placeholder="e.g. 🥦 This Week's Fresh Arrivals!" value={subject} onChange={e => setSubject(e.target.value)} disabled={sending} />
              </FormGroup>
              <FormGroup>
                <FormLabel>Message *</FormLabel>
                <AdminTextarea rows={8} placeholder="Write your email message here…" value={message} onChange={e => setMessage(e.target.value)} disabled={sending} style={{ resize: 'vertical' }} />
                <CharCount $over={message.length > MAX_MSG}>{message.length} / {MAX_MSG}</CharCount>
              </FormGroup>
              <div style={{ background: t.colors.surfaceAlt, borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: t.colors.textMuted, lineHeight: 1.6 }}>
                💡 The email will be sent with the branded template including your logo, a "Shop Now" button, and an unsubscribe link.
              </div>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeSendModal} disabled={sending}>{sendResult ? 'Close' : 'Cancel'}</AdminBtn>
              {!sendResult && (
                <AdminBtn $variant="primary" onClick={handleSend} disabled={sending || message.length > MAX_MSG}>
                  {sending ? `Sending to ${pagination.total} subscriber(s)…` : <><Send size={14} /> Send to {pagination.total} Subscriber(s)</>}
                </AdminBtn>
              )}
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <ModalBackdrop onClick={() => setDeleteTarget(null)}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 420, width: '95%' }}>
            <ModalHeader>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: t.colors.danger }}>Remove Subscriber</span>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
            </ModalHeader>
            <ModalBody>
              <p style={{ color: t.colors.textSecondary, fontSize: '0.875rem', lineHeight: 1.6 }}>
                Are you sure you want to permanently remove <strong>{deleteTarget.email}</strong>? This cannot be undone.
              </p>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</AdminBtn>
              <AdminBtn $variant="danger" onClick={handleDelete} disabled={deleting} style={{ background: t.colors.danger, color: 'white' }}>
                {deleting ? 'Removing…' : 'Remove Subscriber'}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {openDrop && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpenDrop(null)} />}
    </>
  );
};

export default NewsletterPage;