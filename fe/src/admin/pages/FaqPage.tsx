/**
 * src/admin/pages/FaqPage.tsx
 * Admin FAQ management — full CRUD with category grouping
 */
import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import {
  Plus, Search, Trash2, Edit2,
  ChevronUp, ChevronDown, HelpCircle, RefreshCw,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminCard, AdminFlex, AdminBtn, IconBtn, ToggleTrack, ToggleThumb,
  AdminInput, AdminSelect, AdminTextarea,
  FormGroup, FormLabel, FormGrid, SearchBar, SearchInput,
  ModalBackdrop, ModalBox, ModalHeader, ModalBody, ModalFooter,
  EmptyState,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { adminFaqsApi, AdminFaq } from '../../api/admin';
import { ApiError } from '../../api/client';

// ── Styled extras ──────────────────────────────────────────────────────────────
const PageHeader = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
`;
const PageTitle = styled.h1`
  font-size: 1.375rem; font-weight: 700; color: ${t.colors.textPrimary}; margin: 0 0 2px;
`;
const PageSub = styled.p`
  font-size: 0.8125rem; color: ${t.colors.textMuted}; margin: 0;
`;
const CategoryBadge = styled.span<{ $active?: boolean }>`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
  background: ${({ $active }) => $active ? `${t.colors.primary}15` : `${t.colors.border}`};
  color: ${({ $active }) => $active ? t.colors.primary : t.colors.textMuted};
  cursor: pointer; transition: all 0.15s;
  &:hover { background: ${t.colors.primary}25; color: ${t.colors.primary}; }
`;

const FaqAccordion = styled.div`
  border: 1px solid ${t.colors.border}; border-radius: 12px; overflow: hidden;
  margin-bottom: 8px; background: white;
  &:hover { border-color: ${t.colors.primary}40; }
  transition: border-color 0.15s;
`;
const FaqHeader = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; cursor: pointer; user-select: none;
  background: white; transition: background 0.1s;
  &:hover { background: ${t.colors.surfaceAlt}; }
`;
const FaqQuestion = styled.div`
  flex: 1; font-weight: 600; font-size: 0.9rem; color: ${t.colors.textPrimary};
`;
const FaqAnswer = styled.div`
  padding: 0 20px 18px 20px; font-size: 0.875rem;
  color: ${t.colors.textSecondary}; line-height: 1.7;
  border-top: 1px solid ${t.colors.border}; padding-top: 14px;
  white-space: pre-wrap;
`;
const FaqMeta = styled.div`
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
`;
const CategoryTag = styled.span`
  font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 10px;
  background: ${t.colors.surfaceAlt}; color: ${t.colors.textMuted};
`;

const FAQ_CATEGORIES = ['General', 'Shipping', 'Returns & Exchange', 'Payment', 'Account', 'Products', 'Other'];

// ── Empty form state ───────────────────────────────────────────────────────────
const emptyForm = (): Omit<AdminFaq, 'id' | 'createdAt' | 'updatedAt'> => ({
  question: '', answer: '', category: 'General', sortOrder: 0, status: 'active',
});

// ── Main Component ─────────────────────────────────────────────────────────────
export const FaqPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  const [faqs,      setFaqs]      = useState<AdminFaq[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statFilter,setStatFilter]= useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<AdminFaq | null>(null);
  const [form,      setForm]      = useState(emptyForm());
  const [saving,    setSaving]    = useState(false);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFaqsApi.list();
      if (res.success) setFaqs(res.data ?? []);
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Failed to load FAQs', type: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  React.useEffect(() => { load(); }, [load]);

  // Derive unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(faqs.map(f => f.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [faqs]);

  const filtered = useMemo(() => {
    let list = faqs;
    if (catFilter)  list = list.filter(f => f.category === catFilter);
    if (statFilter) list = list.filter(f => f.status === statFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(f => f.question.toLowerCase().includes(s) || f.answer.toLowerCase().includes(s));
    }
    return list;
  }, [faqs, catFilter, statFilter, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (faq: AdminFaq) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, sortOrder: faq.sortOrder, status: faq.status });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm()); };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      dispatch(showAdminToast({ message: 'Question and answer are required', type: 'error' }));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await adminFaqsApi.update(editing.id, form);
        if (res.success) {
          setFaqs(prev => prev.map(f => f.id === editing.id ? res.data : f));
          dispatch(showAdminToast({ message: 'FAQ updated', type: 'success' }));
        }
      } else {
        const res = await adminFaqsApi.create(form);
        if (res.success) {
          setFaqs(prev => [...prev, res.data]);
          dispatch(showAdminToast({ message: 'FAQ created', type: 'success' }));
        }
      }
      closeModal();
    } catch (e) {
      dispatch(showAdminToast({ message: e instanceof ApiError ? e.message : 'Save failed', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (faq: AdminFaq) => {
    const next = faq.status === 'active' ? 'inactive' : 'active';
    try {
      await adminFaqsApi.setStatus(faq.id, next);
      setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, status: next } : f));
      dispatch(showAdminToast({ message: `FAQ ${next}`, type: 'success' }));
    } catch (e) {
      dispatch(showAdminToast({ message: 'Status update failed', type: 'error' }));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminFaqsApi.delete(deleteId);
      setFaqs(prev => prev.filter(f => f.id !== deleteId));
      dispatch(showAdminToast({ message: 'FAQ deleted', type: 'success' }));
      setDeleteId(null);
    } catch (e) {
      dispatch(showAdminToast({ message: 'Delete failed', type: 'error' }));
    } finally {
      setDeleting(false);
    }
  };

  const activeCount   = faqs.filter(f => f.status === 'active').length;
  const inactiveCount = faqs.filter(f => f.status === 'inactive').length;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader>
        <div>
          <PageTitle>FAQs</PageTitle>
          <PageSub>{faqs.length} questions total · {activeCount} active · {inactiveCount} inactive</PageSub>
        </div>
        <AdminFlex $gap="10px" $wrap>
        <AdminBtn $variant="primary" onClick={openAdd} style={{ gap: 6 }}><Plus size={15} /> Add FAQ</AdminBtn>
        <AdminBtn $variant="ghost" onClick={load} style={{ gap: 6 }}><RefreshCw size={14} /></AdminBtn>
        </AdminFlex>
      </PageHeader>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <AdminFlex $gap="12px" $wrap style={{ marginBottom: 20 }}>
        {[
          { label: 'Total', value: faqs.length, color: t.colors.primary },
          { label: 'Active', value: activeCount, color: '#10b981' },
          { label: 'Inactive', value: inactiveCount, color: '#f59e0b' },
          { label: 'Categories', value: categories.length, color: '#6366f1' },
        ].map(s => (
          <AdminCard key={s.label} style={{ flex: '1 1 120px', padding: '14px 20px', minWidth: 100 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: t.colors.textMuted, marginTop: 2 }}>{s.label}</div>
          </AdminCard>
        ))}
      </AdminFlex>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <AdminCard style={{ padding: '16px 20px', marginBottom: 20 }}>
        <AdminFlex $gap="12px" $wrap>
          <SearchBar style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} />
            <SearchInput
              placeholder="Search questions or answers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchBar>
          <AdminSelect value={statFilter} onChange={e => setStatFilter(e.target.value)} style={{ width: 130 }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </AdminSelect>
        </AdminFlex>

        {/* Category pills */}
        {FAQ_CATEGORIES.length > 0 && (
          <AdminFlex $gap="8px" $wrap style={{ marginTop: 12 }}>
            <CategoryBadge $active={catFilter === ''} onClick={() => setCatFilter('')}>All</CategoryBadge>
            {FAQ_CATEGORIES.map(c => (
              <CategoryBadge key={c} $active={catFilter === c} onClick={() => setCatFilter(catFilter === c ? '' : c)}>
                {c}
              </CategoryBadge>
            ))}
          </AdminFlex>
        )}
      </AdminCard>

      {/* ── FAQ List ──────────────────────────────────────────────────────── */}
      {loading ? (
        <AdminCard style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ color: t.colors.textMuted }}>Loading FAQs…</div>
        </AdminCard>
      ) : filtered.length === 0 ? (
        <EmptyState>
          <HelpCircle size={40} style={{ color: t.colors.textMuted, marginBottom: 12 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No FAQs found</div>
          <div style={{ fontSize: '0.8125rem', color: t.colors.textMuted }}>
            {search || catFilter || statFilter ? 'Try adjusting your filters' : 'Add your first FAQ'}
          </div>
        </EmptyState>
      ) : (
        filtered.map(faq => (
          <FaqAccordion key={faq.id}>
            <FaqHeader onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}>
              <HelpCircle size={16} style={{ color: t.colors.primary, flexShrink: 0 }} />
              <FaqQuestion>{faq.question}</FaqQuestion>
              <FaqMeta>
                <CategoryTag>{faq.category}</CategoryTag>
                <ToggleTrack $on={faq.status === 'active'} onClick={e => { e.stopPropagation(); toggleStatus(faq); }} title={faq.status === 'active' ? 'Deactivate' : 'Activate'}>
                  <ToggleThumb $on={faq.status === 'active'} />
                </ToggleTrack>
                <IconBtn title="Edit" onClick={e => { e.stopPropagation(); openEdit(faq); }}>
                  <Edit2 size={14} />
                </IconBtn>
                <IconBtn $variant="danger" title="Delete" onClick={e => { e.stopPropagation(); setDeleteId(faq.id); }}>
                  <Trash2 size={14} />
                </IconBtn>
                {expanded === faq.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </FaqMeta>
            </FaqHeader>
            {expanded === faq.id && (
              <FaqAnswer>{faq.answer}</FaqAnswer>
            )}
          </FaqAccordion>
        ))
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      {modalOpen && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <span>{editing ? 'Edit FAQ' : 'New FAQ'}</span>
              <IconBtn onClick={closeModal}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <FormGrid>
                <FormGroup style={{ gridColumn: '1/-1' }}>
                  <FormLabel>Question *</FormLabel>
                  <AdminInput
                    value={form.question}
                    onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                    placeholder="e.g. How long does shipping take?"
                  />
                </FormGroup>
                <FormGroup style={{ gridColumn: '1/-1' }}>
                  <FormLabel>Answer *</FormLabel>
                  <AdminTextarea
                    rows={5}
                    value={form.answer}
                    onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                    placeholder="Write a clear, helpful answer…"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Category</FormLabel>
                  <AdminSelect value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    {!FAQ_CATEGORIES.includes(form.category) && form.category && (
                      <option value={form.category}>{form.category}</option>
                    )}
                  </AdminSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Sort Order</FormLabel>
                  <AdminInput
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Status</FormLabel>
                  <AdminSelect value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as AdminFaq['status'] }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </AdminSelect>
                </FormGroup>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>Cancel</AdminBtn>
              <AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create FAQ'}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      {deleteId && (
        <ModalBackdrop onClick={() => setDeleteId(null)}>
          <ModalBox style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <span>Delete FAQ</span>
              <IconBtn onClick={() => setDeleteId(null)}>✕</IconBtn>
            </ModalHeader>
            <ModalBody>
              <p style={{ color: t.colors.textSecondary, margin: 0 }}>
                Are you sure you want to delete this FAQ? This action cannot be undone.
              </p>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={() => setDeleteId(null)}>Cancel</AdminBtn>
              <AdminBtn $variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </div>
  );
};
