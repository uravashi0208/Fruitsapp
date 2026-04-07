/**
 * src/admin/pages/SlidersPage.tsx
 * Admin: hero / banner slider management — full CRUD + bulk actions.
 *
 * Page structure (consistent across ALL admin list pages):
 *   1. useState declarations  (data hooks → filter/pagination → selection/bulk → modal/form)
 *   2. Derived / filtered data
 *   3. Modal helpers  (openCreate, openEdit, openView, openDelete, openBulkConfirm, closeModal)
 *   4. API handlers   (handleSave, handleDelete, toggleStatus, handleBulkAction)
 *   5. Return JSX     (ErrorBanner → AdminDataTable → modals)
 */

import React, { useState, useRef, useCallback } from "react";
import {
  PortalDropdown,
  MenuItem,
  closeAllDropdowns,
} from "../components/PortalDropdown";
import styled from "styled-components";
import {
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Edit2,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
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
  SortBadge,
  UploadBox,
  UploadInput,
  PreviewImg,
  ModalCloseBtn,
  ModalTitle,
  ModalTitleDanger,
  ConfirmText,
  ErrorBanner,
} from "../styles/adminPageComponents";
import { useAdminDispatch, showAdminToast } from "../store";
import { useAdminSliders } from "../../hooks/useAdminApi";
import { adminSlidersApi, AdminSlider } from "../../api/admin";
import { ApiError, API_BASE } from "../../api/client";
import AdminDataTable, {
  TR,
  TD,
  ColDef,
  CheckBox,
} from "../components/AdminDataTable";
import { formatDate } from "../utils/formatDate";
import AdminDropdown from "../components/AdminDropdown";

// ── Page-specific styled components ──────────────────────────────────────────

const SliderCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const SliderThumb = styled.img`
  width: 64px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid ${t.colors.border};
  flex-shrink: 0;
`;
const SliderPh = styled.div`
  width: 64px;
  height: 40px;
  border-radius: 6px;
  background: ${t.colors.surfaceAlt};
  border: 1px solid ${t.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;
const SliderName = styled.div`
  font-weight: 600;
  color: ${t.colors.textPrimary};
  font-size: 0.875rem;
`;
const SliderSub = styled.div`
  font-size: 0.75rem;
  color: ${t.colors.textMuted};
  margin-top: 2px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE = 10;
type ModalMode = "create" | "edit" | "view" | "delete" | "bulkConfirm" | null;
type BulkAction = "active" | "inactive" | "delete";

interface FormState {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  sortOrder: string;
  status: "active" | "inactive";
}

const emptyForm = (): FormState => ({
  title: "",
  subtitle: "",
  buttonText: "View Details",
  buttonLink: "#",
  sortOrder: "0",
  status: "active",
});

const resolveImage = (image: string): string => {
  if (!image) return "";
  if (image.startsWith("http") || image.startsWith("/images")) return image;
  return `${API_BASE}${image}`;
};

const COLUMNS: ColDef[] = [
  { key: "slider", label: "Slider" },
  { key: "button", label: "Button" },
  { key: "order", label: "Order" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created At" },
  {
    key: "actions",
    label: "Action",
    sortable: false,
    thProps: { $width: "200px" },
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export const SlidersPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  // 1a. Data hooks
  const { data: rawSliders, loading, error, refetch } = useAdminSliders();

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
  const [selected, setSelected] = useState<AdminSlider | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 2. Derived / filtered data
  const sliders = (rawSliders ?? []).filter((s: AdminSlider) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q)) &&
      (!statusFilter || s.status === statusFilter)
    );
  });
  const totalPages = Math.max(1, Math.ceil(sliders.length / PER_PAGE));
  const paged = sliders.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allIds = paged.map((s) => s.id);
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
    closeAllDropdowns();
    setSelected(null);
    setForm(emptyForm());
    setImgFile(null);
    setImgPreview("");
    setMode("create");
  };
  const openEdit = (s: AdminSlider) => {
    closeAllDropdowns();
    setSelected(s);
    setForm({
      title: s.title,
      subtitle: s.subtitle,
      buttonText: s.buttonText,
      buttonLink: s.buttonLink,
      sortOrder: String(s.sortOrder),
      status: s.status,
    });
    setImgFile(null);
    setImgPreview(resolveImage(s.image));
    setMode("edit");
  };
  const openView = (s: AdminSlider) => {
    closeAllDropdowns();
    setSelected(s);
    setMode("view");
  };
  const openDelete = (s: AdminSlider) => {
    closeAllDropdowns();
    setSelected(s);
    setMode("delete");
  };
  const openBulkConfirm = (action: BulkAction) => {
    setPendingBulk(action);
    setMode("bulkConfirm");
  };
  const closeModal = () => {
    setMode(null);
    setSelected(null);
    setPendingBulk(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  // 4a. Create / Update
  const handleSave = async () => {
    if (!form.title.trim()) {
      dispatch(showAdminToast({ message: "Title is required", type: "error" }));
      return;
    }
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("subtitle", form.subtitle);
    fd.append("buttonText", form.buttonText);
    fd.append("buttonLink", form.buttonLink);
    fd.append("sortOrder", form.sortOrder);
    fd.append("status", form.status);
    if (imgFile) fd.append("image", imgFile);
    setSaving(true);
    try {
      if (mode === "create") {
        await adminSlidersApi.create(fd);
        dispatch(
          showAdminToast({ message: "Slider created", type: "success" }),
        );
      } else if (mode === "edit" && selected) {
        await adminSlidersApi.update(selected.id, fd);
        dispatch(
          showAdminToast({ message: "Slider updated", type: "success" }),
        );
      }
      closeModal();
      refetch();
    } catch (e) {
      dispatch(
        showAdminToast({
          message: e instanceof ApiError ? e.message : "Something went wrong",
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
      await adminSlidersApi.delete(selected.id);
      dispatch(showAdminToast({ message: "Slider deleted", type: "success" }));
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
  const toggleStatus = useCallback(
    async (s: AdminSlider) => {
      if (toggling) return;
      const next = s.status === "active" ? "inactive" : "active";
      setToggling(s.id);
      try {
        await adminSlidersApi.setStatus(s.id, next as AdminSlider["status"]);
        dispatch(
          showAdminToast({ message: `Slider set to ${next}`, type: "success" }),
        );
        refetch();
      } catch (e) {
        dispatch(
          showAdminToast({
            message: e instanceof ApiError ? e.message : "Update failed",
            type: "error",
          }),
        );
      } finally {
        setToggling(null);
      }
    },
    [dispatch, refetch, toggling],
  );

  // 4d. Bulk actions
  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      if (!selIds.size) return;
      setBulkWorking(true);
      const ids = Array.from(selIds);
      try {
        if (action === "delete") {
          await adminSlidersApi.bulkDelete(ids);
          dispatch(
            showAdminToast({
              message: `${ids.length} slider(s) deleted`,
              type: "warning",
            }),
          );
        } else {
          await adminSlidersApi.bulkUpdateStatus(ids, action);
          dispatch(
            showAdminToast({
              message: `${ids.length} slider(s) set to ${action}`,
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
    <>
      {/* Error banner */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Data Table ──────────────────────────────────────────────────── */}
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
                  await exportData(
                    fmt,
                    "sliders",
                    [
                      { label: "Image", imageKey: "image" },
                      { label: "Title", key: "title" },
                      { label: "Subtitle", key: "subtitle" },
                      { label: "Button Name", key: "buttonText" },
                      { label: "Link", key: "buttonLink" },
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
                    sliders as unknown as Record<string, unknown>[],
                  );
                } finally {
                  setExportLoading(false);
                }
              }}
            />
            <AdminBtn $variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add Slider
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
              placeholder="Search sliders…"
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
        emptyIcon={<ImageIcon size={36} />}
        emptyTitle="No sliders found"
        renderRow={(s) => (
          <TR key={s.id}>
            <TD>
              <CheckBox
                checked={selIds.has(s.id)}
                onChange={() => toggleOne(s.id)}
              />
            </TD>
            <TD>
              <SliderCell>
                {resolveImage(s.image) ? (
                  <SliderThumb src={resolveImage(s.image)} alt={s.title} />
                ) : (
                  <SliderPh>
                    <ImageIcon size={18} color={t.colors.textMuted} />
                  </SliderPh>
                )}
                <div>
                  <SliderName>{s.title}</SliderName>
                  <SliderSub>{s.subtitle || "—"}</SliderSub>
                </div>
              </SliderCell>
            </TD>
            <TD>
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: t.colors.textPrimary,
                }}
              >
                {s.buttonText || "—"}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: t.colors.textMuted,
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.buttonLink}
              </div>
            </TD>
            <TD>
              <SortBadge>{s.sortOrder}</SortBadge>
            </TD>
            <TD>
              <ToggleTrack
                $on={s.status === "active"}
                onClick={() => toggleStatus(s)}
                style={{
                  opacity: toggling === s.id ? 0.6 : 1,
                  cursor: toggling === s.id ? "wait" : "pointer",
                }}
              >
                <ToggleThumb $on={s.status === "active"} />
              </ToggleTrack>
            </TD>
            <TD style={{ fontSize: "0.8rem" }}>{formatDate(s.createdAt)}</TD>
            <TD onClick={(e) => e.stopPropagation()}>
              <PortalDropdown>
                <MenuItem onClick={() => openView(s)}>
                  <Edit2 size={13} /> View
                </MenuItem>
                <MenuItem onClick={() => openEdit(s)}>
                  <Edit2 size={13} /> Edit
                </MenuItem>
                <MenuItem $danger onClick={() => openDelete(s)}>
                  <Trash2 size={13} /> Delete
                </MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={
          sliders.length > 0
            ? `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, sliders.length)} of ${sliders.length}`
            : "0 sliders"
        }
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {(mode === "create" || mode === "edit") && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600, width: "95%" }}
          >
            <ModalHeader>
              <ModalTitle>
                {mode === "create" ? "Add New Slider" : "Edit Slider"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <FormGroup>
                <FormLabel>Slider Image</FormLabel>
                {imgPreview ? (
                  <div style={{ position: "relative" }}>
                    <PreviewImg src={imgPreview} alt="preview" />
                    <button
                      onClick={() => {
                        setImgFile(null);
                        setImgPreview("");
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 8,
                        background: "rgba(0,0,0,0.5)",
                        border: "none",
                        borderRadius: 6,
                        color: "white",
                        cursor: "pointer",
                        padding: "2px 8px",
                        fontSize: 12,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <UploadBox>
                    <UploadInput
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <ImageIcon size={28} color={t.colors.textMuted} />
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: t.colors.textMuted,
                      }}
                    >
                      Click to upload image
                    </span>
                    <span
                      style={{ fontSize: "0.75rem", color: t.colors.textMuted }}
                    >
                      PNG, JPG, WEBP up to 5MB
                    </span>
                  </UploadBox>
                )}
              </FormGroup>
              <FormGrid>
                <FormGroup>
                  <FormLabel>Title *</FormLabel>
                  <AdminInput
                    placeholder="e.g. Summer Collection"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Subtitle</FormLabel>
                  <AdminInput
                    placeholder="Short description"
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, subtitle: e.target.value }))
                    }
                  />
                </FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup>
                  <FormLabel>Button Text</FormLabel>
                  <AdminInput
                    placeholder="e.g. Shop Now"
                    value={form.buttonText}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, buttonText: e.target.value }))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Button Link</FormLabel>
                  <AdminInput
                    placeholder="/shop"
                    value={form.buttonLink}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, buttonLink: e.target.value }))
                    }
                  />
                </FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup>
                  <FormLabel>Sort Order</FormLabel>
                  <AdminInput
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sortOrder: e.target.value }))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Status</FormLabel>
                  <AdminDropdown
                    value={form.status}
                    onChange={(val) =>
                      setForm((f) => ({ ...f, status: val as any }))
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
                    ? "Create Slider"
                    : "Save Changes"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── View Modal ───────────────────────────────────────────────────── */}
      {mode === "view" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540, width: "95%" }}
          >
            <ModalHeader>
              <ModalTitle>Slider Details</ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {resolveImage(selected.image) && (
                <img
                  src={resolveImage(selected.image)}
                  alt={selected.title}
                  style={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: `1px solid ${t.colors.border}`,
                  }}
                />
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {(
                  [
                    ["Title", selected.title],
                    ["Subtitle", selected.subtitle || "—"],
                    ["Button Text", selected.buttonText],
                    ["Button Link", selected.buttonLink],
                    ["Sort Order", String(selected.sortOrder)],
                    ["Status", selected.status],
                  ] as [string, string][]
                ).map(([label, val]) => (
                  <div key={label}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: t.colors.textMuted,
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: t.colors.textPrimary,
                      }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>
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
                Edit
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {mode === "delete" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420, width: "95%" }}
          >
            <ModalHeader>
              <ModalTitleDanger>Delete Slider</ModalTitleDanger>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                Are you sure you want to delete{" "}
                <strong>"{selected.title}"</strong>? This cannot be undone.
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
                {saving ? "Deleting…" : "Delete Slider"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Bulk Confirm Modal ───────────────────────────────────────────── */}
      {mode === "bulkConfirm" && pendingBulk && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420, width: "95%" }}
          >
            <ModalHeader>
              <ModalTitle>
                {pendingBulk === "delete"
                  ? "Delete Selected Sliders"
                  : pendingBulk === "active"
                    ? "Set Sliders Active"
                    : "Set Sliders Inactive"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                {pendingBulk === "delete" ? (
                  <>
                    {" "}
                    Are you sure you want to delete{" "}
                    <strong>{selIds.size} slider(s)</strong>? This cannot be
                    undone.{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    Set <strong>{selIds.size} slider(s)</strong> to{" "}
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

export default SlidersPage;
