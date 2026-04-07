/**
 * src/admin/pages/FaqPage.tsx
 * Admin: FAQ management — full CRUD with category grouping + bulk actions.
 *
 * Page structure (consistent across ALL admin list pages):
 *   1. useState declarations  (local data → filter state → selection/bulk → modal/form)
 *   2. Derived / filtered data
 *   3. Modal helpers  (openAdd, openEdit, openDelete, openBulkConfirm, closeModal)
 *   4. API handlers   (load, handleSave, handleDelete, toggleStatus, handleBulkAction)
 *   5. Return JSX     (ErrorBanner → header → stats → filters → faq list → modals)
 */

import React, { useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ExportDropdown } from "../components/ExportDropdown";
import { exportData } from "../utils/exportUtils";
import { adminTheme as t } from "../styles/adminTheme";
import {
  AdminCard,
  AdminFlex,
  AdminBtn,
  IconBtn,
  ToggleTrack,
  ToggleThumb,
  AdminInput,
  AdminTextarea,
  FormGroup,
  FormLabel,
  FormGrid,
  ModalBackdrop,
  ModalBox,
  ModalHeader,
  ModalBody,
  ModalFooter,
  EmptyState,
} from "../styles/adminShared";
import {
  PageSearchBar,
  PageSearchInp,
  BulkBar,
  BulkCount,
  BulkActionBtn,
  ModalCloseBtn,
  ModalTitle,
  ModalTitleDanger,
  ConfirmText,
  ErrorBanner,
} from "../styles/adminPageComponents";
import { useAdminDispatch, showAdminToast } from "../store";
import { adminFaqsApi, AdminFaq } from "../../api/admin";
import { ApiError } from "../../api/client";
import { formatDate } from "../utils/formatDate";
import AdminDropdown from "../components/AdminDropdown";

// ── Page-specific styled components ──────────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 1.375rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
  margin: 0 0 2px;
`;

const PageSub = styled.p`
  font-size: 0.8125rem;
  color: ${t.colors.textMuted};
  margin: 0;
`;

const FaqAccordion = styled.div`
  border: 1px solid ${t.colors.border};
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  background: white;
  transition: border-color 0.15s;
  &:hover {
    border-color: ${t.colors.primary}40;
  }
`;

const FaqHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  user-select: none;
  background: white;
  transition: background 0.1s;
  &:hover {
    background: ${t.colors.surfaceAlt};
  }
`;

const FaqQuestion = styled.div`
  flex: 1;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${t.colors.textPrimary};
`;

const FaqAnswer = styled.div`
  padding: 14px 20px 18px;
  font-size: 0.875rem;
  color: ${t.colors.textSecondary};
  line-height: 1.7;
  border-top: 1px solid ${t.colors.border};
  white-space: pre-wrap;
`;

const FaqMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
`;

const CategoryTag = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  color: ${t.colors.textMuted};
  background: ${t.colors.surfaceAlt};
  border: 1px solid ${t.colors.border};
  border-radius: 6px;
`;

const CategoryBadge = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $active }) =>
    $active ? `${t.colors.primary}15` : t.colors.surfaceAlt};
  color: ${({ $active }) => ($active ? t.colors.primary : t.colors.textMuted)};
  border: 1px solid
    ${({ $active }) => ($active ? `${t.colors.primary}40` : t.colors.border)};
  cursor: pointer;
  transition: all 0.15s;
  font-family: ${t.fonts.body};
  &:hover {
    background: ${t.colors.primary}25;
    color: ${t.colors.primary};
    border-color: ${t.colors.primary}40;
  }
`;

const FaqCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
  accent-color: ${t.colors.primary};
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const FAQ_CATEGORIES = [
  "General",
  "Shipping",
  "Returns & Exchange",
  "Payment",
  "Account",
  "Products",
  "Other",
];

type BulkAction = "active" | "inactive" | "delete";
type ModalMode = "create" | "edit" | "delete" | "bulkConfirm" | null;

const emptyForm = (): Omit<AdminFaq, "id" | "createdAt" | "updatedAt"> => ({
  question: "",
  answer: "",
  category: "General",
  sortOrder: 0,
  status: "active",
});

// ── Component ──────────────────────────────────────────────────────────────────

export const FaqPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  // 1a. Local data (FAQ page manages own list — no hook available)
  const [faqs, setFaqs] = useState<AdminFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1b. Filter state
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statFilter, setStatFilter] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // 1c. Selection / bulk
  const [selIds, setSelIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);

  // 1d. Modal / form
  const [mode, setMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<AdminFaq | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // 4. Load data (called on mount + after mutations)
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFaqsApi.list();
      if (res.success) setFaqs(res.data ?? []);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load FAQs";
      setError(msg);
      dispatch(showAdminToast({ message: msg, type: "error" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  React.useEffect(() => {
    load();
  }, [load]);

  // 2. Derived / filtered data
  const categories = useMemo(
    () =>
      Array.from(new Set(faqs.map((f) => f.category).filter(Boolean))).sort() as string[],
    [faqs],
  );

  const filtered = useMemo(() => {
    let list = faqs;
    if (catFilter) list = list.filter((f) => f.category === catFilter);
    if (statFilter) list = list.filter((f) => f.status === statFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.question.toLowerCase().includes(s) ||
          f.answer.toLowerCase().includes(s),
      );
    }
    return list;
  }, [faqs, catFilter, statFilter, search]);

  const activeCount = faqs.filter((f) => f.status === "active").length;
  const inactiveCount = faqs.filter((f) => f.status === "inactive").length;

  const allFilteredIds = filtered.map((f) => f.id);
  const allChecked =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selIds.has(id));

  const toggleAll = () =>
    setSelIds(allChecked ? new Set() : new Set(allFilteredIds));

  const toggleOne = (id: string) =>
    setSelIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // 3. Modal helpers
  const openAdd = () => {
    setSelected(null);
    setForm(emptyForm());
    setMode("create");
  };

  const openEdit = (faq: AdminFaq) => {
    setSelected(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.sortOrder,
      status: faq.status,
    });
    setMode("edit");
  };

  const openDelete = (faq: AdminFaq) => {
    setSelected(faq);
    setMode("delete");
  };

  const openBulkConfirm = (action: BulkAction) => {
    setPendingBulk(action);
    setMode("bulkConfirm");
  };

  const closeModal = () => {
    setMode(null);
    setSelected(null);
    setForm(emptyForm());
    setPendingBulk(null);
  };

  // 4a. Create / Update
  const handleSave = useCallback(async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      dispatch(
        showAdminToast({
          message: "Question and answer are required",
          type: "error",
        }),
      );
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        const res = await adminFaqsApi.update(selected.id, form);
        if (res.success)
          setFaqs((prev) => prev.map((f) => (f.id === selected.id ? res.data : f)));
        dispatch(showAdminToast({ message: "FAQ updated", type: "success" }));
      } else {
        const res = await adminFaqsApi.create(form);
        if (res.success) setFaqs((prev) => [...prev, res.data]);
        dispatch(showAdminToast({ message: "FAQ created", type: "success" }));
      }
      closeModal();
    } catch (e) {
      dispatch(
        showAdminToast({
          message: e instanceof ApiError ? e.message : "Save failed",
          type: "error",
        }),
      );
    } finally {
      setSaving(false);
    }
  }, [selected, form, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4b. Delete
  const handleDelete = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminFaqsApi.delete(selected.id);
      setFaqs((prev) => prev.filter((f) => f.id !== selected.id));
      dispatch(showAdminToast({ message: "FAQ deleted", type: "warning" }));
      closeModal();
    } catch (e) {
      dispatch(
        showAdminToast({
          message: e instanceof ApiError ? e.message : "Delete failed",
          type: "error",
        }),
      );
    } finally {
      setSaving(false);
    }
  }, [selected, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4c. Inline status toggle
  const toggleStatus = async (faq: AdminFaq) => {
    const next = faq.status === "active" ? "inactive" : "active";
    try {
      await adminFaqsApi.setStatus(faq.id, next);
      setFaqs((prev) => prev.map((f) => (f.id === faq.id ? { ...f, status: next } : f)));
      dispatch(
        showAdminToast({
          message: `"${faq.question.slice(0, 30)}…" set to ${next}`,
          type: "success",
        }),
      );
    } catch {
      dispatch(
        showAdminToast({ message: "Status update failed", type: "error" }),
      );
    }
  };

  // 4d. Bulk actions
  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      if (!selIds.size) return;
      setBulkWorking(true);
      const ids = Array.from(selIds);
      try {
        if (action === "delete") {
          await adminFaqsApi.bulkDelete(ids);
          setFaqs((prev) => prev.filter((f) => !ids.includes(f.id)));
          dispatch(
            showAdminToast({
              message: `${ids.length} FAQ(s) deleted`,
              type: "warning",
            }),
          );
        } else {
          await adminFaqsApi.bulkUpdateStatus(ids, action);
          setFaqs((prev) =>
            prev.map((f) => (ids.includes(f.id) ? { ...f, status: action } : f)),
          );
          dispatch(
            showAdminToast({
              message: `${ids.length} FAQ(s) set to ${action}`,
              type: "success",
            }),
          );
        }
        setSelIds(new Set());
        closeModal();
      } catch (err) {
        dispatch(
          showAdminToast({
            message: err instanceof ApiError ? err.message : "Bulk action failed",
            type: "error",
          }),
        );
      } finally {
        setBulkWorking(false);
      }
    },
    [selIds, dispatch], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // 5. Render
  return (
    <section>
      {/* Error banner */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <PageHeader>
        <div>
          <PageTitle>FAQs</PageTitle>
          <PageSub>
            {faqs.length} questions total · {activeCount} active ·{" "}
            {inactiveCount} inactive
          </PageSub>
        </div>
        <AdminFlex $gap="10px" $wrap>
          <ExportDropdown
            loading={exportLoading}
            onExport={async (fmt) => {
              setExportLoading(true);
              try {
                await exportData(
                  fmt,
                  "faqs",
                  [
                    { label: "Question", key: "question" },
                    { label: "Answer", key: "answer" },
                    { label: "Category", key: "category" },
                    { label: "Order", key: "sortOrder" },
                    {
                      label: "Status",
                      resolve: (row) =>
                        row["status"] === "active" ? "Active" : "Inactive",
                    },
                    {
                      label: "Created At",
                      resolve: (row) => {
                        const v = row["createdAt"] as string;
                        return v ? formatDate(v) : "—";
                      },
                    },
                  ],
                  filtered as unknown as Record<string, unknown>[],
                );
              } finally {
                setExportLoading(false);
              }
            }}
          />
          <AdminBtn $variant="primary" onClick={openAdd}>
            <Plus size={15} /> Add FAQ
          </AdminBtn>
          <IconBtn title="Refresh" onClick={load}>
            <RefreshCw size={14} />
          </IconBtn>
        </AdminFlex>
      </PageHeader>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <AdminFlex $gap="12px" $wrap style={{ marginBottom: 20 }}>
        {[
          { label: "Total", value: faqs.length, color: t.colors.primary },
          { label: "Active", value: activeCount, color: t.colors.success },
          { label: "Inactive", value: inactiveCount, color: t.colors.warning },
          { label: "Categories", value: categories.length, color: "#6366f1" },
        ].map((s) => (
          <AdminCard
            key={s.label}
            style={{ flex: "1 1 120px", padding: "14px 20px", minWidth: 100 }}
          >
            <div
              style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color }}
            >
              {s.value}
            </div>
            <div
              style={{ fontSize: "0.75rem", color: t.colors.textMuted, marginTop: 2 }}
            >
              {s.label}
            </div>
          </AdminCard>
        ))}
      </AdminFlex>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <AdminCard style={{ padding: "16px 20px", marginBottom: 20 }}>
        <AdminFlex $gap="12px" $wrap>
          <PageSearchBar style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} color={t.colors.textMuted} />
            <PageSearchInp
              placeholder="Search questions or answers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </PageSearchBar>
          <AdminDropdown
            style={{ minWidth: 150 }}
            value={statFilter}
            onChange={(val) => setStatFilter(val as string)}
            options={[
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </AdminFlex>

        {/* Category filter chips */}
        {categories.length > 0 && (
          <AdminFlex $gap="6px" $wrap style={{ marginTop: 12 }}>
            <CategoryBadge
              $active={!catFilter}
              onClick={() => setCatFilter("")}
            >
              All
            </CategoryBadge>
            {categories.map((cat) => (
              <CategoryBadge
                key={cat}
                $active={catFilter === cat}
                onClick={() => setCatFilter(catFilter === cat ? "" : cat)}
              >
                {cat}
              </CategoryBadge>
            ))}
          </AdminFlex>
        )}

        {/* Bulk bar */}
        {selIds.size > 0 && (
          <BulkBar style={{ marginTop: 12 }}>
            <BulkCount>
              <span>{selIds.size}</span> selected
            </BulkCount>
            <BulkActionBtn
              $variant="success"
              disabled={bulkWorking}
              onClick={() => openBulkConfirm("active")}
            >
              <CheckCircle size={12} /> Set Active
            </BulkActionBtn>
            <BulkActionBtn
              $variant="warning"
              disabled={bulkWorking}
              onClick={() => openBulkConfirm("inactive")}
            >
              <XCircle size={12} /> Set Inactive
            </BulkActionBtn>
            <BulkActionBtn
              $variant="danger"
              disabled={bulkWorking}
              onClick={() => openBulkConfirm("delete")}
            >
              <Trash2 size={12} /> Delete
            </BulkActionBtn>
            <BulkActionBtn
              $variant="ghost"
              disabled={bulkWorking}
              onClick={() => setSelIds(new Set())}
            >
              ✕ Clear
            </BulkActionBtn>
          </BulkBar>
        )}
      </AdminCard>

      {/* ── FAQ List ────────────────────────────────────────────────────── */}
      {loading ? (
        <AdminCard style={{ padding: 60, textAlign: "center" }}>
          <div style={{ color: t.colors.textMuted }}>Loading FAQs…</div>
        </AdminCard>
      ) : filtered.length === 0 ? (
        <EmptyState>
          <HelpCircle
            size={40}
            style={{ color: t.colors.textMuted, marginBottom: 12 }}
          />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No FAQs found</div>
          <div style={{ fontSize: "0.8125rem", color: t.colors.textMuted }}>
            {search || catFilter || statFilter
              ? "Try adjusting your filters"
              : "Add your first FAQ"}
          </div>
          {!search && !catFilter && !statFilter && (
            <AdminBtn
              $variant="primary"
              onClick={openAdd}
              style={{ marginTop: 16 }}
            >
              <Plus size={14} /> Add FAQ
            </AdminBtn>
          )}
        </EmptyState>
      ) : (
        <>
          {filtered.length > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                padding: "6px 16px",
                background: t.colors.surfaceAlt,
                borderRadius: 8,
                border: `1px solid ${t.colors.border}`,
              }}
            >
              <FaqCheckbox
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
              />
              <span
                style={{
                  fontSize: "0.8rem",
                  color: t.colors.textMuted,
                  fontWeight: 500,
                }}
              >
                {allChecked ? "Deselect all" : `Select all ${filtered.length}`}
              </span>
            </div>
          )}
          {filtered.map((faq) => (
            <FaqAccordion key={faq.id}>
              <FaqHeader
                onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
              >
                <FaqCheckbox
                  type="checkbox"
                  checked={selIds.has(faq.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleOne(faq.id)}
                />
                <HelpCircle
                  size={16}
                  style={{ color: t.colors.primary, flexShrink: 0 }}
                />
                <FaqQuestion>{faq.question}</FaqQuestion>
                <FaqMeta>
                  <CategoryTag>{faq.category}</CategoryTag>
                  <ToggleTrack
                    $on={faq.status === "active"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(faq);
                    }}
                    title={faq.status === "active" ? "Deactivate" : "Activate"}
                  >
                    <ToggleThumb $on={faq.status === "active"} />
                  </ToggleTrack>
                  <IconBtn
                    title="Edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(faq);
                    }}
                  >
                    <Edit2 size={14} />
                  </IconBtn>
                  <IconBtn
                    $variant="danger"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDelete(faq);
                    }}
                  >
                    <Trash2 size={14} />
                  </IconBtn>
                  {expanded === faq.id ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </FaqMeta>
              </FaqHeader>
              {expanded === faq.id && <FaqAnswer>{faq.answer}</FaqAnswer>}
            </FaqAccordion>
          ))}
        </>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {(mode === "create" || mode === "edit") && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            style={{ maxWidth: 620 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                {mode === "edit" ? "Edit FAQ" : "New FAQ"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGrid>
                <FormGroup style={{ gridColumn: "1/-1" }}>
                  <FormLabel>Question *</FormLabel>
                  <AdminInput
                    value={form.question}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, question: e.target.value }))
                    }
                    placeholder="e.g. How long does shipping take?"
                    autoFocus
                  />
                </FormGroup>
                <FormGroup style={{ gridColumn: "1/-1" }}>
                  <FormLabel>Answer *</FormLabel>
                  <AdminTextarea
                    rows={5}
                    value={form.answer}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, answer: e.target.value }))
                    }
                    placeholder="Write a clear, helpful answer…"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Category</FormLabel>
                  <AdminDropdown
                    value={form.category}
                    onChange={(val) => setForm((p) => ({ ...p, category: val }))}
                    options={[
                      ...FAQ_CATEGORIES.map((c) => ({ value: c, label: c })),
                      ...(!FAQ_CATEGORIES.includes(form.category) && form.category
                        ? [{ value: form.category, label: form.category }]
                        : []),
                    ]}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Sort Order</FormLabel>
                  <AdminInput
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        sortOrder: Number(e.target.value),
                      }))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Status</FormLabel>
                  <AdminDropdown
                    value={form.status}
                    onChange={(val) =>
                      setForm((p) => ({
                        ...p,
                        status: val as AdminFaq["status"],
                      }))
                    }
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                  />
                </FormGroup>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>
                Cancel
              </AdminBtn>
              <AdminBtn $variant="primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? "Saving…"
                  : mode === "edit"
                    ? "Save Changes"
                    : "Create FAQ"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {mode === "delete" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitleDanger>Delete FAQ</ModalTitleDanger>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                Are you sure you want to delete{" "}
                <strong>"{selected.question.slice(0, 60)}{selected.question.length > 60 ? "…" : ""}"</strong>?
                This action cannot be undone.
              </ConfirmText>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>
                Cancel
              </AdminBtn>
              <AdminBtn $variant="danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting…" : "Delete"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Bulk Confirm Modal ───────────────────────────────────────────── */}
      {mode === "bulkConfirm" && pendingBulk && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                {pendingBulk === "delete"
                  ? "Delete Selected FAQs"
                  : pendingBulk === "active"
                    ? "Set FAQs Active"
                    : "Set FAQs Inactive"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                {pendingBulk === "delete" ? (
                  <>
                    Are you sure you want to delete{" "}
                    <strong>{selIds.size} FAQ(s)</strong>? This cannot be undone.
                  </>
                ) : (
                  <>
                    Set <strong>{selIds.size} FAQ(s)</strong> to{" "}
                    <strong>{pendingBulk}</strong>?
                  </>
                )}
              </ConfirmText>
            </ModalBody>
            <ModalFooter>
              <AdminBtn
                $variant="ghost"
                onClick={closeModal}
                disabled={bulkWorking}
              >
                Cancel
              </AdminBtn>
              <AdminBtn
                $variant={pendingBulk === "delete" ? "danger" : "primary"}
                disabled={bulkWorking}
                onClick={() => handleBulkAction(pendingBulk)}
              >
                {bulkWorking
                  ? "Processing…"
                  : pendingBulk === "delete"
                    ? `Delete ${selIds.size}`
                    : `Set ${selIds.size} ${pendingBulk}`}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </section>
  );
};

export default FaqPage;
