/**
 * src/admin/pages/CouponsPage.tsx
 * Admin: coupon / promo code management — full CRUD + bulk actions.
 *
 * Page structure (consistent across ALL admin list pages):
 *   1. useState declarations  (data hooks → filter/pagination → selection/bulk → modal/form)
 *   2. Derived / filtered data
 *   3. Modal helpers  (openCreate, openEdit, openDelete, openBulkConfirm, closeModal)
 *   4. API handlers   (handleSave, handleDelete, toggleStatus, handleBulkAction)
 *   5. Return JSX     (ErrorBanner → AdminDataTable → modals)
 */

import React, { useState } from "react";
import {
  PortalDropdown,
  MenuItem,
  closeAllDropdowns,
} from "../components/PortalDropdown";
import styled from "styled-components";
import {
  Plus,
  Trash2,
  Edit2,
  Tag,
  RefreshCw,
  Search,
  Copy,
  CheckCircle,
  XCircle,
  Percent,
  DollarSign,
} from "lucide-react";
import { ExportDropdown } from "../components/ExportDropdown";
import { exportData } from "../utils/exportUtils";
import { adminTheme as t } from "../styles/adminTheme";
import {
  AdminBtn,
  IconBtn,
  ToggleTrack,
  ToggleThumb,
  AdminInput,
  FormGroup,
  FormLabel,
  FormGrid,
  ModalBackdrop,
  ModalBox,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
import { adminCouponsApi, AdminCoupon } from "../../api/admin";
import { ApiError } from "../../api/client";
import { formatDate } from "../utils/formatDate";
import AdminDataTable, {
  TR,
  TD,
  ColDef,
  CheckBox,
} from "../components/AdminDataTable";
import AdminDropdown from "../components/AdminDropdown";
import { useAdminCoupons } from "../../hooks/useAdminApi";

// ── Page-specific styled components ──────────────────────────────────────────

const CodeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.8125rem;
  font-weight: 700;
  color: ${t.colors.primary};
  background: ${t.colors.primaryGhost};
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(70, 95, 255, 0.15);
  }
`;

const ProgressBar = styled.div<{ $pct: number }>`
  height: 6px;
  background: ${t.colors.border};
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${({ $pct }) => Math.min(100, $pct)}%;
    background: ${({ $pct }) =>
      $pct >= 90 ? t.colors.danger : t.colors.primary};
    border-radius: 3px;
  }
`;

const TypeToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const TypeBtn = styled.button<{ $active: boolean }>`
  height: 38px;
  border-radius: ${t.radii.lg};
  border: 1.5px solid
    ${({ $active }) => ($active ? t.colors.primary : t.colors.border)};
  background: ${({ $active }) => ($active ? t.colors.primaryGhost : "white")};
  color: ${({ $active }) =>
    $active ? t.colors.primary : t.colors.textSecondary};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s;
  font-family: ${t.fonts.body};
  &:hover {
    border-color: ${t.colors.primary};
    color: ${t.colors.primary};
  }
`;

const PreviewBanner = styled.div`
  padding: 10px 14px;
  background: ${t.colors.primaryGhost};
  border: 1px solid ${t.colors.primary}30;
  border-radius: ${t.radii.lg};
  font-size: 0.8125rem;
  color: ${t.colors.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SwitchWrap = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  input {
    display: none;
  }
  span.track {
    width: 40px;
    height: 22px;
    background: ${t.colors.border};
    border-radius: 11px;
    position: relative;
    transition: background 0.2s;
    &::after {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      top: 3px;
      left: 3px;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
  }
  input:checked + span.track {
    background: ${t.colors.success};
  }
  input:checked + span.track::after {
    transform: translateX(18px);
  }
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE = 10;
type ModalMode = "create" | "edit" | "delete" | "bulkConfirm" | null;
type BulkAction = "active" | "inactive" | "delete";

const COLUMNS: ColDef[] = [
  { key: "code", label: "Code" },
  { key: "discount", label: "Discount" },
  { key: "minOrder", label: "Min Order" },
  { key: "usage", label: "Usage" },
  { key: "expires", label: "Expires" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", thProps: { $width: "100px" } },
];

const emptyForm = (): Partial<AdminCoupon> & { code: string } => ({
  code: "",
  type: "percent",
  value: 10,
  minOrder: 0,
  maxUses: null,
  expiresAt: null,
  status: "active",
});

// ── Component ──────────────────────────────────────────────────────────────────

export const CouponsPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  // 1a. Data hooks
  const { data: rawData, loading, error, refetch } = useAdminCoupons();

  // 1b. Filter / pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
    "",
  );
  const [page, setPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  // 1c. Selection / bulk
  const [selIds, setSelIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);

  // 1d. Modal / form
  const [mode, setMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<AdminCoupon | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // 1e. Copy feedback
  const [copied, setCopied] = useState<string | null>(null);

  // 1f. Optimistic status
  const [localStatus, setLocalStatus] = useState<
    Record<string, "active" | "inactive">
  >({});

  // 2. Derived / filtered data
  const items = (rawData ?? ([] as AdminCoupon[])).filter(
    (item: AdminCoupon) => {
      const q = search.toLowerCase();
      return (
        (!q || item.code.toLowerCase().includes(q)) &&
        (!statusFilter || item.status === statusFilter)
      );
    },
  );
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const paged = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allIds = paged.map((c: AdminCoupon) => c.id);
  const allChecked =
    allIds.length > 0 && allIds.every((id: string) => selIds.has(id));

  const toggleAll = () => setSelIds(allChecked ? new Set() : new Set(allIds));
  const toggleOne = (id: string) =>
    setSelIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // 3. Modal helpers
  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm());
    setMode("create");
  };
  const openEdit = (coupon: AdminCoupon) => {
    closeAllDropdowns();
    setSelected(coupon);
    setForm({ ...coupon });
    setMode("edit");
  };
  const openDelete = (coupon: AdminCoupon) => {
    closeAllDropdowns();
    setSelected(coupon);
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

  const setField = (k: string, v: unknown) =>
    setForm((f: typeof form) => ({ ...f, [k]: v }));

  // 4a. Create / Update
  const handleSave = async () => {
    if (!form.code?.trim()) {
      dispatch(
        showAdminToast({ message: "Coupon code is required", type: "error" }),
      );
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      dispatch(
        showAdminToast({
          message: "Value must be greater than 0",
          type: "error",
        }),
      );
      return;
    }
    setSaving(true);
    try {
      if (mode === "edit" && selected) {
        await adminCouponsApi.update(selected.id, form);
        dispatch(
          showAdminToast({ message: "Coupon updated", type: "success" }),
        );
      } else {
        await adminCouponsApi.create(form);
        dispatch(
          showAdminToast({ message: "Coupon created", type: "success" }),
        );
      }
      closeModal();
      refetch();
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
  };

  // 4b. Delete
  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminCouponsApi.delete(selected.id);
      dispatch(showAdminToast({ message: "Coupon deleted", type: "success" }));
      closeModal();
      refetch();
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
  };

  // 4c. Inline status toggle
  const toggleStatus = async (coupon: AdminCoupon) => {
    const current = localStatus[coupon.id] ?? coupon.status;
    const next = current === "active" ? "inactive" : "active";
    try {
      await adminCouponsApi.update(coupon.id, { status: next });
      dispatch(
        showAdminToast({
          message: `"${coupon.code}" set to ${next}`,
          type: "info",
        }),
      );
      refetch();
    } catch {
      setLocalStatus((prev) => ({ ...prev, [coupon.id]: current }));
      dispatch(
        showAdminToast({ message: "Failed to update status", type: "error" }),
      );
    }
  };

  // 4d. Copy code
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  // 4e. Bulk actions
  const handleBulkAction = async (action: BulkAction) => {
    if (!selIds.size) return;
    setBulkWorking(true);
    const ids = Array.from(selIds);
    try {
      if (action === "delete") {
        await adminCouponsApi.bulkDelete(ids);
        dispatch(
          showAdminToast({
            message: `${ids.length} coupon(s) deleted`,
            type: "warning",
          }),
        );
      } else {
        await adminCouponsApi.bulkUpdateStatus(ids, action);
        dispatch(
          showAdminToast({
            message: `${ids.length} coupon(s) set to ${action}`,
            type: "success",
          }),
        );
      }
      setSelIds(new Set());
      closeModal();
      refetch();
    } catch (err: any) {
      dispatch(
        showAdminToast({
          message: err?.message || "Bulk action failed",
          type: "error",
        }),
      );
    } finally {
      setBulkWorking(false);
    }
  };

  // 5. Render
  return (
    <>
      {/* Error banner */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Data Table ──────────────────────────────────────────────────── */}
      <AdminDataTable
        title="Coupons & Promo Codes"
        subtitle="Manage discount codes and promotions"
        actions={
          <>
            <ExportDropdown
              loading={exportLoading}
              onExport={async (fmt) => {
                setExportLoading(true);
                try {
                  await exportData(
                    fmt,
                    "coupons",
                    [
                      { key: "code", label: "Code" },
                      { key: "type", label: "Type" },
                      { key: "value", label: "Value" },
                      { key: "minOrder", label: "Min Order ($)" },
                      { key: "maxUses", label: "Max Uses" },
                      { key: "usedCount", label: "Used" },
                      {
                        label: "Status",
                        resolve: (row) =>
                          row["status"] === "active" ? "Active" : "Inactive",
                      },
                      {
                        label: "Expires At",
                        resolve: (row) => {
                          const v = row["expiresAt"] as string;
                          return v ? formatDate(v) : "Never";
                        },
                      },
                      {
                        label: "Created At",
                        resolve: (row) => {
                          const v = row["createdAt"] as string;
                          return v ? formatDate(v) : "—";
                        },
                      },
                    ],
                    items as unknown as Record<string, unknown>[],
                  );
                } finally {
                  setExportLoading(false);
                }
              }}
            />
            <AdminBtn $variant="primary" onClick={openCreate}>
              <Plus size={15} /> Create Coupon
            </AdminBtn>
            <IconBtn title="Refresh" onClick={refetch}>
              <RefreshCw size={14} />
            </IconBtn>
          </>
        }
        searchArea={
          <PageSearchBar>
            <Search size={15} color={t.colors.textMuted} />
            <PageSearchInp
              placeholder="Search coupon code…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </PageSearchBar>
        }
        filterArea={
          <>
            {selIds.size > 0 && (
              <BulkBar>
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
            <AdminDropdown
              style={{ minWidth: 150 }}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val as any);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </>
        }
        columns={COLUMNS}
        selectable
        allChecked={allChecked}
        onToggleAll={toggleAll}
        rows={paged}
        loading={loading}
        emptyIcon={<Tag size={32} color={t.colors.textMuted} />}
        emptyTitle="No coupons found"
        emptyText="Create your first promo code!"
        emptyAction={
          <AdminBtn
            $variant="primary"
            onClick={openCreate}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={14} /> Create Coupon
          </AdminBtn>
        }
        renderRow={(coupon: AdminCoupon) => {
          const usagePct = coupon.maxUses
            ? (coupon.usedCount / coupon.maxUses) * 100
            : 0;
          const status = localStatus[coupon.id] ?? coupon.status;
          return (
            <TR key={coupon.id}>
              <TD>
                <CheckBox
                  checked={selIds.has(coupon.id)}
                  onChange={() => toggleOne(coupon.id)}
                />
              </TD>
              <TD>
                <CodeBadge onClick={() => copyCode(coupon.code)}>
                  {coupon.code}
                  {copied === coupon.code ? (
                    <CheckCircle size={12} color={t.colors.success} />
                  ) : (
                    <Copy size={11} />
                  )}
                </CodeBadge>
              </TD>
              <TD>
                {coupon.type === "percent"
                  ? `${coupon.value}% OFF`
                  : `$${coupon.value} OFF`}
              </TD>
              <TD>
                {coupon.minOrder > 0 ? (
                  `$${coupon.minOrder}`
                ) : (
                  <span style={{ color: t.colors.textMuted }}>None</span>
                )}
              </TD>
              <TD>
                <div style={{ fontSize: "0.8125rem" }}>
                  {coupon.usedCount}
                  {coupon.maxUses ? ` / ${coupon.maxUses}` : " uses"}
                </div>
                {coupon.maxUses && (
                  <ProgressBar
                    $pct={usagePct}
                    title={`${usagePct.toFixed(0)}% used`}
                  />
                )}
              </TD>
              <TD>
                {coupon.expiresAt ? (
                  <span
                    style={{
                      color:
                        new Date(coupon.expiresAt) < new Date()
                          ? t.colors.danger
                          : t.colors.textSecondary,
                    }}
                  >
                    {formatDate(coupon.expiresAt)}
                  </span>
                ) : (
                  <span style={{ color: t.colors.textMuted }}>Never</span>
                )}
              </TD>
              <TD>
                <ToggleTrack
                  $on={status === "active"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(coupon);
                  }}
                  title="Toggle status"
                >
                  <ToggleThumb $on={status === "active"} />
                </ToggleTrack>
              </TD>
              <TD onClick={(e) => e.stopPropagation()}>
                <PortalDropdown>
                  <MenuItem onClick={() => openEdit(coupon)}>
                    <Edit2 size={13} /> Edit
                  </MenuItem>
                  <MenuItem $danger onClick={() => openDelete(coupon)}>
                    <Trash2 size={13} /> Delete
                  </MenuItem>
                </PortalDropdown>
              </TD>
            </TR>
          );
        }}
        showPagination
        paginationInfo={
          items.length > 0
            ? `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, items.length)} of ${items.length}`
            : "0 coupons"
        }
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {(mode === "create" || mode === "edit") && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            style={{ maxWidth: 540, width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                {mode === "create" ? "Create New Coupon" : "Edit Coupon"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <FormGroup>
                <FormLabel>Coupon Code *</FormLabel>
                <AdminInput
                  placeholder="e.g. SUMMER20"
                  value={form.code}
                  onChange={(e) =>
                    setField("code", e.target.value.toUpperCase())
                  }
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                  disabled={mode === "edit"}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Discount Type</FormLabel>
                <TypeToggle>
                  <TypeBtn
                    type="button"
                    $active={form.type === "percent"}
                    onClick={() => setField("type", "percent")}
                  >
                    <Percent size={14} /> Percentage (%)
                  </TypeBtn>
                  <TypeBtn
                    type="button"
                    $active={form.type === "fixed"}
                    onClick={() => setField("type", "fixed")}
                  >
                    <DollarSign size={14} /> Fixed Amount ($)
                  </TypeBtn>
                </TypeToggle>
              </FormGroup>
              <FormGrid $cols={2}>
                <FormGroup>
                  <FormLabel>
                    Value *{" "}
                    <span
                      style={{ color: t.colors.textMuted, fontWeight: 400 }}
                    >
                      {form.type === "percent"
                        ? "(e.g. 10 = 10% off)"
                        : "(e.g. 5 = $5 off)"}
                    </span>
                  </FormLabel>
                  <AdminInput
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={form.type === "percent" ? "10" : "5.00"}
                    value={form.value || ""}
                    onChange={(e) =>
                      setField("value", parseFloat(e.target.value))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Min Order Amount ($)</FormLabel>
                  <AdminInput
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0 = no minimum"
                    value={form.minOrder || ""}
                    onChange={(e) =>
                      setField("minOrder", parseFloat(e.target.value) || 0)
                    }
                  />
                </FormGroup>
              </FormGrid>
              <FormGrid $cols={2}>
                <FormGroup>
                  <FormLabel>Max Uses</FormLabel>
                  <AdminInput
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={form.maxUses || ""}
                    onChange={(e) =>
                      setField(
                        "maxUses",
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Expires At</FormLabel>
                  <AdminInput
                    type="date"
                    value={
                      form.expiresAt
                        ? (form.expiresAt as string).slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      setField("expiresAt", e.target.value || null)
                    }
                  />
                </FormGroup>
              </FormGrid>
              <FormGroup>
                <FormLabel>Status</FormLabel>
                <SwitchWrap>
                  <input
                    type="checkbox"
                    checked={form.status === "active"}
                    onChange={(e) =>
                      setField(
                        "status",
                        e.target.checked ? "active" : "inactive",
                      )
                    }
                  />
                  <span className="track" />
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: t.colors.textSecondary,
                    }}
                  >
                    {form.status === "active"
                      ? "Active — customers can use this code"
                      : "Inactive — code is disabled"}
                  </span>
                </SwitchWrap>
              </FormGroup>
              {(form.value ?? 0) > 0 && (
                <PreviewBanner>
                  <Tag size={13} />
                  <span>
                    Preview:{" "}
                    <strong>
                      {form.type === "percent"
                        ? `${form.value}% off`
                        : `$${form.value} off`}
                    </strong>
                    {form.minOrder ? ` on orders over $${form.minOrder}` : ""}
                    {form.expiresAt ? ` · expires ${form.expiresAt}` : ""}
                  </span>
                </PreviewBanner>
              )}
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </AdminBtn>
              <AdminBtn
                $variant="primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : mode === "create"
                    ? "Create Coupon"
                    : "Save Changes"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {mode === "delete" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            style={{ maxWidth: 420, width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitleDanger>Delete Coupon</ModalTitleDanger>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                Are you sure you want to delete the coupon{" "}
                <strong>"{selected.code}"</strong>? This cannot be undone.
              </ConfirmText>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </AdminBtn>
              <AdminBtn
                $variant="danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? "Deleting…" : "Delete Coupon"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Bulk Confirm Modal ───────────────────────────────────────────── */}
      {mode === "bulkConfirm" && pendingBulk && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="420px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {pendingBulk === "delete"
                  ? "Delete Selected Coupons"
                  : pendingBulk === "active"
                    ? "Set Coupons Active"
                    : "Set Coupons Inactive"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                {pendingBulk === "delete" ? (
                  <>
                    {" "}
                    Are you sure you want to delete{" "}
                    <strong>{selIds.size} coupon(s)</strong>? This cannot be
                    undone.{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    Set <strong>{selIds.size} coupon(s)</strong> to{" "}
                    <strong>{pendingBulk}</strong>?{" "}
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
    </>
  );
};

export default CouponsPage;
