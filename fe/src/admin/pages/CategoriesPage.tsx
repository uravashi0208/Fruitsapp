/**
 * src/admin/pages/CategoriesPage.tsx
 * Admin: product category management — full CRUD + bulk actions.
 *
 * Page structure (consistent across ALL admin list pages):
 *   1. useState declarations  (data hooks → UI state → filter/pagination → modal/form)
 *   2. Derived / filtered data
 *   3. Modal helpers  (openCreate, openEdit, openView, openDelete, openBulkConfirm, closeModal)
 *   4. API handlers   (handleSave, handleDelete, toggleStatus, handleBulkAction)
 *   5. Return JSX     (ErrorBanner → AdminDataTable → modals)
 */

import React, { useState, useCallback, useRef } from "react";
import {
  PortalDropdown,
  MenuItem,
  closeAllDropdowns,
} from "../components/PortalDropdown";
import styled from "styled-components";
import {
  Plus,
  Trash2,
  Tag,
  Edit2,
  Eye,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ExportDropdown } from "../components/ExportDropdown";
import { exportData } from "../utils/exportUtils";
import { adminTheme as t } from "../styles/adminTheme";
import {
  AdminBtn,
  IconBtn,
  StatusPill,
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
  AdminDivider,
} from "../styles/adminShared";
import {
  PageSearchBar,
  PageSearchInp,
  BulkBar,
  BulkCount,
  BulkActionBtn,
  SortBadge,
  UploadBox,
  UploadInput,
  PreviewImgSquare,
  ModalCloseBtn,
  ModalTitle,
  ModalTitleDanger,
  ConfirmText,
  ErrorBanner,
} from "../styles/adminPageComponents";
import { useAdminDispatch, showAdminToast } from "../store";
import { useAdminCategories } from "../../hooks/useAdminApi";
import { adminCategoriesApi, AdminCategory } from "../../api/admin";
import { ApiError, API_BASE } from "../../api/client";
import AdminDataTable, {
  TR,
  TD,
  CheckBox,
  ColDef,
} from "../components/AdminDataTable";
import { formatDate } from "../utils/formatDate";
import AdminDropdown from "../components/AdminDropdown";

// ── Page-specific styled components ──────────────────────────────────────────

const CatCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const CatThumb = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid ${t.colors.border};
  flex-shrink: 0;
`;
const CatPh = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: ${t.colors.surfaceAlt};
  border: 1px solid ${t.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;
const CatName = styled.div`
  font-weight: 600;
  color: ${t.colors.textPrimary};
  font-size: 0.875rem;
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
type ModalMode = "create" | "edit" | "view" | "delete" | "bulkConfirm" | null;
type BulkAction = "active" | "inactive" | "delete";

const COLUMNS: ColDef[] = [
  { key: "category", label: "Category" },
  { key: "slug", label: "Slug" },
  { key: "description", label: "Description" },
  { key: "order", label: "Order" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created At" },
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    thProps: { $width: "200px" },
  },
];

const emptyForm = (): Partial<AdminCategory> & { imageFile?: File | null } => ({
  name: "",
  description: "",
  status: "active",
  sortOrder: 0,
  imageFile: null,
});

// ── Component ──────────────────────────────────────────────────────────────────

export const CategoriesPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  // 1a. Data hooks
  const { data: categories, loading, error, refetch } = useAdminCategories();
  const cats = categories ?? [];

  // 1b. Filter / pagination
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [page, setPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  // 1c. Selection / bulk
  const [selIds, setSelIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);

  // 1d. Modal / form
  const [mode, setMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<
    Partial<AdminCategory> & { imageFile?: File | null }
  >(emptyForm());
  const [saving, setSaving] = useState(false);
  const [imgPreview, setImgPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // 2. Derived / filtered data
  const filtered = cats.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusF === "all" || c.status === statusF;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allIds = paginated.map((c) => c.id);
  const allChecked = allIds.length > 0 && allIds.every((id) => selIds.has(id));

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
    setImgPreview("");
    setMode("create");
  };
  const openEdit = (c: AdminCategory) => {
    closeAllDropdowns();
    setSelected(c);
    setForm({ ...c, imageFile: null });
    setImgPreview(c.image || "");
    setMode("edit");
  };
  const openView = (c: AdminCategory) => {
    closeAllDropdowns();
    setSelected(c);
    setMode("view");
  };
  const openDelete = (c: AdminCategory) => {
    closeAllDropdowns();
    setSelected(c);
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
    setImgPreview("");
    setPendingBulk(null);
  };

  const setField =
    (k: keyof AdminCategory) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((f) => ({
        ...f,
        [k]:
          e.target.type === "number" ? Number(e.target.value) : e.target.value,
      }));

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, imageFile: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // 4a. Create / Update
  const handleSave = useCallback(async () => {
    if (!form.name?.trim()) {
      dispatch(
        showAdminToast({ message: "Category name is required", type: "error" }),
      );
      return;
    }
    setSaving(true);
    try {
      const { imageFile, ...rest } = form;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(rest).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append("image", imageFile);
        const token = sessionStorage.getItem("vf_access");
        const url = selected
          ? `${API_BASE}/api/admin/categories/${selected.id}`
          : `${API_BASE}/api/admin/categories`;
        const res = await fetch(url, {
          method: selected ? "PUT" : "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok)
          throw new Error((await res.json()).error || "Upload failed");
      } else {
        if (selected)
          await adminCategoriesApi.update(selected.id, rest as AdminCategory);
        else await adminCategoriesApi.create(rest as AdminCategory);
      }
      dispatch(
        showAdminToast({
          message: `"${form.name}" ${selected ? "updated" : "created"}`,
          type: "success",
        }),
      );
      closeModal();
      refetch();
    } catch (err) {
      dispatch(
        showAdminToast({
          message: err instanceof ApiError ? err.message : String(err),
          type: "error",
        }),
      );
    } finally {
      setSaving(false);
    }
  }, [dispatch, selected, form, refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4b. Delete
  const handleDelete = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminCategoriesApi.delete(selected.id);
      closeModal();
      refetch();
      dispatch(
        showAdminToast({
          message: `"${selected.name}" deleted`,
          type: "warning",
        }),
      );
    } catch (err) {
      dispatch(
        showAdminToast({
          message: err instanceof ApiError ? err.message : "Delete failed",
          type: "error",
        }),
      );
    } finally {
      setSaving(false);
    }
  }, [dispatch, selected, refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4c. Inline status toggle
  const toggleStatus = useCallback(
    async (c: AdminCategory) => {
      const next = c.status === "active" ? "inactive" : "active";
      try {
        await adminCategoriesApi.setStatus(
          c.id,
          next as AdminCategory["status"],
        );
        dispatch(
          showAdminToast({
            message: `"${c.name}" set to ${next}`,
            type: "success",
          }),
        );
        refetch();
      } catch (err) {
        dispatch(
          showAdminToast({
            message: err instanceof ApiError ? err.message : "Update failed",
            type: "error",
          }),
        );
      }
    },
    [dispatch, refetch],
  );

  // 4d. Bulk actions
  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      if (!selIds.size) return;
      setBulkWorking(true);
      const ids = Array.from(selIds);
      try {
        if (action === "delete") {
          await adminCategoriesApi.bulkDelete(ids);
          dispatch(
            showAdminToast({
              message: `${ids.length} category(s) deleted`,
              type: "warning",
            }),
          );
        } else {
          await adminCategoriesApi.bulkUpdateStatus(ids, action);
          dispatch(
            showAdminToast({
              message: `${ids.length} category(s) set to ${action}`,
              type: "success",
            }),
          );
        }
        setSelIds(new Set());
        closeModal();
        refetch();
      } catch (err) {
        dispatch(
          showAdminToast({
            message:
              err instanceof ApiError ? err.message : "Bulk action failed",
            type: "error",
          }),
        );
      } finally {
        setBulkWorking(false);
      }
    },
    [selIds, dispatch, refetch],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. Render
  return (
    <section>
      {/* Error banner */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Data Table ──────────────────────────────────────────────────── */}
      <AdminDataTable
        title="Categories List"
        subtitle="Manage and organise your product categories."
        actions={
          <>
            <ExportDropdown
              loading={exportLoading}
              onExport={async (fmt) => {
                setExportLoading(true);
                try {
                  await exportData(
                    fmt,
                    "categories",
                    [
                      { label: "Name", key: "name" },
                      { label: "Slug", key: "slug" },
                      { label: "Description", key: "description" },
                      { label: "Sort Order", key: "sortOrder" },
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
                    cats as unknown as Record<string, unknown>[],
                  );
                } finally {
                  setExportLoading(false);
                }
              }}
            />
            <AdminBtn $variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add Category
            </AdminBtn>
            <IconBtn title="Refresh" onClick={refetch}>
              <RefreshCw size={16} />
            </IconBtn>
          </>
        }
        searchArea={
          <PageSearchBar>
            <Search size={15} color={t.colors.textMuted} />
            <PageSearchInp
              placeholder="Search categories..."
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
              value={statusF}
              onChange={(val) => {
                setStatusF(val as string);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Status" },
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
        rows={paginated}
        loading={loading}
        emptyIcon={<Tag size={36} />}
        emptyTitle="No categories found"
        emptyText={
          search
            ? "Try adjusting your search."
            : "Add your first product category."
        }
        emptyAction={
          !search && (
            <AdminBtn $variant="primary" onClick={openCreate}>
              <Plus size={14} /> Add Category
            </AdminBtn>
          )
        }
        renderRow={(c) => (
          <TR key={c.id}>
            <TD>
              <CheckBox
                checked={selIds.has(c.id)}
                onChange={() => toggleOne(c.id)}
              />
            </TD>
            <TD>
              <CatCell>
                {c.image ? (
                  <CatThumb
                    src={
                      c.image.startsWith("http")
                        ? c.image
                        : `${API_BASE}${c.image}`
                    }
                    alt={c.name}
                  />
                ) : (
                  <CatPh>
                    <Tag size={18} color={t.colors.textMuted} />
                  </CatPh>
                )}
                <CatName>{c.name}</CatName>
              </CatCell>
            </TD>
            <TD style={{ color: t.colors.textMuted, fontSize: "0.8rem" }}>
              {c.slug}
            </TD>
            <TD style={{ maxWidth: 220 }}>
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: t.colors.textMuted,
                  fontSize: "0.8rem",
                }}
              >
                {c.description || "—"}
              </div>
            </TD>
            <TD>
              <SortBadge>{c.sortOrder ?? 0}</SortBadge>
            </TD>
            <TD>
              <ToggleTrack
                $on={c.status === "active"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatus(c);
                }}
                title="Click to toggle status"
              >
                <ToggleThumb $on={c.status === "active"} />
              </ToggleTrack>
            </TD>
            <TD style={{ fontSize: "0.8rem" }}>{formatDate(c.createdAt)}</TD>
            <TD
              style={{ textAlign: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              <PortalDropdown>
                <MenuItem onClick={() => openView(c)}>
                  <Eye size={14} /> View
                </MenuItem>
                <MenuItem onClick={() => openEdit(c)}>
                  <Edit2 size={14} /> Edit
                </MenuItem>
                <MenuItem $danger onClick={() => openDelete(c)}>
                  <Trash2 size={14} /> Delete
                </MenuItem>
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

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {(mode === "create" || mode === "edit") && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="560px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {mode === "edit"
                  ? `Edit "${selected?.name}"`
                  : "Add New Category"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGrid $cols={2}>
                <FormGroup $span={2}>
                  <FormLabel>Category Name *</FormLabel>
                  <AdminInput
                    value={form.name ?? ""}
                    onChange={setField("name")}
                    placeholder="e.g. Vegetables"
                    autoFocus
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Status</FormLabel>
                  <AdminDropdown
                    value={form.status ?? "active"}
                    onChange={(val) =>
                      setField("status")({ target: { value: val } } as any)
                    }
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Sort Order</FormLabel>
                  <AdminInput
                    type="number"
                    min={0}
                    value={form.sortOrder ?? 0}
                    onChange={setField("sortOrder")}
                  />
                </FormGroup>
                <FormGroup $span={2}>
                  <FormLabel>Description</FormLabel>
                  <AdminTextarea
                    value={form.description ?? ""}
                    onChange={setField("description")}
                    placeholder="Short description…"
                    style={{ minHeight: 75 }}
                  />
                </FormGroup>
                <FormGroup $span={2}>
                  <FormLabel>Category Image</FormLabel>
                  <UploadBox htmlFor="cat-img-upload">
                    <UploadInput
                      id="cat-img-upload"
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      onChange={handleImageFile}
                    />
                    {imgPreview ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <PreviewImgSquare
                          src={imgPreview}
                          alt="preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: t.colors.textMuted,
                          }}
                        >
                          Click to change image
                        </span>
                      </div>
                    ) : (
                      <>
                        <Tag size={28} color={t.colors.textMuted} />
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: t.colors.textSecondary,
                          }}
                        >
                          Click to upload image
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: t.colors.textMuted,
                          }}
                        >
                          PNG, JPG, WebP up to 5MB
                        </span>
                      </>
                    )}
                  </UploadBox>
                </FormGroup>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>
                Cancel
              </AdminBtn>
              <AdminBtn
                $variant="primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : mode === "edit"
                    ? "Save Changes"
                    : "Create Category"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── View Modal ───────────────────────────────────────────────────── */}
      {mode === "view" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="440px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{selected.name}</ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 16,
                  alignItems: "center",
                }}
              >
                {selected.image ? (
                  <CatThumb
                    src={selected.image}
                    alt={selected.name}
                    style={{ width: 72, height: 72 }}
                  />
                ) : (
                  <CatPh style={{ width: 72, height: 72 }}>
                    <Tag size={28} color={t.colors.textMuted} />
                  </CatPh>
                )}
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: t.colors.textPrimary,
                    }}
                  >
                    {selected.name}
                  </div>
                  <div
                    style={{
                      color: t.colors.textMuted,
                      fontSize: "0.8rem",
                      marginTop: 2,
                    }}
                  >
                    /{selected.slug}
                  </div>
                  <StatusPill
                    $variant={
                      selected.status === "active" ? "success" : "neutral"
                    }
                    style={{ marginTop: 8 }}
                  >
                    {selected.status}
                  </StatusPill>
                </div>
              </div>
              <FormGrid $cols={2}>
                <FormGroup>
                  <FormLabel>Sort Order</FormLabel>
                  <div>{selected.sortOrder ?? 0}</div>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Status</FormLabel>
                  <div style={{ textTransform: "capitalize" }}>
                    {selected.status}
                  </div>
                </FormGroup>
                {selected.description && (
                  <FormGroup $span={2}>
                    <FormLabel>Description</FormLabel>
                    <div
                      style={{ color: t.colors.textSecondary, lineHeight: 1.6 }}
                    >
                      {selected.description}
                    </div>
                  </FormGroup>
                )}
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>
                Close
              </AdminBtn>
              <AdminBtn
                $variant="primary"
                onClick={() => {
                  closeModal();
                  openEdit(selected);
                }}
              >
                Edit Category
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {mode === "delete" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="400px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitleDanger>Delete Category</ModalTitleDanger>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                Are you sure you want to delete{" "}
                <strong>"{selected.name}"</strong>? Products using this category
                will lose their category assignment.
              </ConfirmText>
              <AdminDivider />
              <p
                style={{
                  color: t.colors.danger,
                  fontSize: "0.8rem",
                  margin: 0,
                }}
              >
                This action cannot be undone.
              </p>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>
                Cancel
              </AdminBtn>
              <AdminBtn
                $variant="danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? "Deleting…" : "Delete"}
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
                  ? "Delete Selected Categories"
                  : pendingBulk === "active"
                    ? "Set Categories Active"
                    : "Set Categories Inactive"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                {pendingBulk === "delete" ? (
                  <>
                    {" "}
                    Are you sure you want to delete{" "}
                    <strong>{selIds.size} category(s)</strong>? This cannot be
                    undone.{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    Set <strong>{selIds.size} category(s)</strong> to{" "}
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
    </section>
  );
};
