/**
 * src/admin/pages/TestimonialsPage.tsx
 * Admin: customer testimonials management — full CRUD with image upload.
 *
 * Page structure (consistent across ALL admin list pages):
 *   1. useState declarations  (data hooks → filter/pagination → modal/form)
 *   2. Derived / filtered data
 *   3. Modal helpers  (openCreate, openEdit, openView, openDelete, closeModal)
 *   4. API handlers   (handleSave, handleDelete, toggleStatus)
 *   5. Return JSX     (ErrorBanner → AdminDataTable → modals)
 */

import React, { useState, useRef } from "react";
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
  Star,
  Edit2,
  User,
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
} from "../styles/adminShared";
import {
  PageSearchBar,
  PageSearchInp,
  UploadBox,
  UploadInput,
  ModalCloseBtn,
  ModalTitle,
  ModalTitleDanger,
  ConfirmText,
  ErrorBanner,
} from "../styles/adminPageComponents";
import { useAdminDispatch, showAdminToast } from "../store";
import { useAdminTestimonials } from "../../hooks/useAdminApi";
import { adminTestimonialsApi, AdminTestimonial } from "../../api/admin";
import { ApiError, API_BASE } from "../../api/client";
import AdminDataTable, { TR, TD, ColDef } from "../components/AdminDataTable";
import { formatDate } from "../utils/formatDate";
import AdminDropdown from "../components/AdminDropdown";

// ── Page-specific styled components ──────────────────────────────────────────

const PersonCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const AvatarImg = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${t.colors.border};
  flex-shrink: 0;
`;
const AvatarPh = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${t.colors.surfaceAlt};
  border: 2px solid ${t.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;
const PersonName = styled.div`
  font-weight: 600;
  color: ${t.colors.textPrimary};
  font-size: 0.875rem;
`;
const PersonPos = styled.div`
  font-size: 0.75rem;
  color: ${t.colors.textMuted};
  margin-top: 2px;
`;
const MsgPreview = styled.div`
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  color: ${t.colors.textSecondary};
`;
const StarRow = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;
`;
const AvatarPreview = styled.img`
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${t.colors.border};
  display: block;
  margin: 0 auto 8px;
`;

// ── Sub-components ────────────────────────────────────────────────────────────

const StarPicker: React.FC<{
  value: number;
  onChange: (v: number) => void;
}> = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
        }}
      >
        <Star
          size={22}
          fill={n <= value ? "#f79009" : "none"}
          color={n <= value ? "#f79009" : "#d0d5dd"}
        />
      </button>
    ))}
  </div>
);

const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <StarRow>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={13}
        fill={n <= rating ? "#f79009" : "none"}
        color={n <= rating ? "#f79009" : "#d0d5dd"}
      />
    ))}
    <span
      style={{ fontSize: "0.75rem", color: t.colors.textMuted, marginLeft: 4 }}
    >
      {rating}/5
    </span>
  </StarRow>
);

// ── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE = 10;
type ModalMode = "create" | "edit" | "view" | "delete" | null;

interface FormState {
  name: string;
  position: string;
  message: string;
  rating: number;
  status: "active" | "inactive";
}

const emptyForm = (): FormState => ({
  name: "",
  position: "",
  message: "",
  rating: 5,
  status: "active",
});

const resolveAvatar = (avatar: string) => {
  if (!avatar) return "";
  if (avatar.startsWith("http") || avatar.startsWith("/images")) return avatar;
  return `${API_BASE}${avatar}`;
};

const COLUMNS: ColDef[] = [
  { key: "person", label: "Person" },
  { key: "message", label: "Message" },
  { key: "rating", label: "Rating" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created At" },
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    thProps: { $width: "200px" },
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export const TestimonialsPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  // 1a. Data hooks
  const { data: rawData, loading, error, refetch } = useAdminTestimonials();

  // 1b. Filter / pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
    "",
  );
  const [page, setPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  // 1c. Modal / form
  const [mode, setMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<AdminTestimonial | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 1d. Optimistic status
  const [localStatus, setLocalStatus] = useState<
    Record<string, "active" | "inactive">
  >({});

  // 2. Derived / filtered data
  const items = (rawData ?? []).filter((item) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        item.name.toLowerCase().includes(q) ||
        item.position.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)) &&
      (!statusFilter || item.status === statusFilter)
    );
  });
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const paged = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // 3. Modal helpers
  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm());
    setImgFile(null);
    setImgPreview("");
    setMode("create");
  };
  const openEdit = (item: AdminTestimonial) => {
    setSelected(item);
    setForm({
      name: item.name,
      position: item.position,
      message: item.message,
      rating: item.rating,
      status: item.status,
    });
    setImgFile(null);
    setImgPreview(resolveAvatar(item.avatar));
    setMode("edit");
  };
  const openView = (item: AdminTestimonial) => {
    setSelected(item);
    setMode("view");
  };
  const openDelete = (item: AdminTestimonial) => {
    setSelected(item);
    setMode("delete");
  };
  const closeModal = () => {
    setMode(null);
    setSelected(null);
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
    if (!form.name.trim()) {
      dispatch(showAdminToast({ message: "Name is required", type: "error" }));
      return;
    }
    if (!form.message.trim()) {
      dispatch(
        showAdminToast({ message: "Message is required", type: "error" }),
      );
      return;
    }
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("position", form.position);
    fd.append("message", form.message);
    fd.append("rating", String(form.rating));
    fd.append("status", form.status);
    if (imgFile) fd.append("avatar", imgFile);
    setSaving(true);
    try {
      if (mode === "create") {
        await adminTestimonialsApi.create(fd);
        dispatch(
          showAdminToast({ message: "Testimonial created", type: "success" }),
        );
      } else if (mode === "edit" && selected) {
        await adminTestimonialsApi.update(selected.id, fd);
        dispatch(
          showAdminToast({ message: "Testimonial updated", type: "success" }),
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
      await adminTestimonialsApi.delete(selected.id);
      dispatch(
        showAdminToast({ message: "Testimonial deleted", type: "success" }),
      );
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
  const toggleStatus = async (item: AdminTestimonial) => {
    const current = localStatus[item.id] ?? item.status;
    const next = current === "active" ? "inactive" : "active";
    try {
      await adminTestimonialsApi.setStatus(item.id, next);
      dispatch(
        showAdminToast({
          message: `"${item.name}" set to ${next}`,
          type: "info",
        }),
      );
      refetch();
    } catch {
      setLocalStatus((prev) => ({ ...prev, [item.id]: current }));
      dispatch(
        showAdminToast({ message: "Failed to update status", type: "error" }),
      );
    }
  };

  // 5. Render
  return (
    <>
      {/* Error banner */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Data Table ──────────────────────────────────────────────────── */}
      <AdminDataTable
        title="Testimonials List"
        subtitle="Manage customer reviews and testimonials"
        actions={
          <>
            <ExportDropdown
              loading={exportLoading}
              onExport={async (fmt) => {
                setExportLoading(true);
                try {
                  await exportData(
                    fmt,
                    "testimonials",
                    [
                      { label: "Image", imageKey: "avatar" },
                      { label: "Name", key: "name" },
                      { label: "Position", key: "position" },
                      { label: "Message", key: "message" },
                      { label: "Rating", key: "rating" },
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
                    items as unknown as Record<string, unknown>[],
                  );
                } finally {
                  setExportLoading(false);
                }
              }}
            />
            <AdminBtn $variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add Testimonial
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
              placeholder="Search by name or message…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </PageSearchBar>
        }
        filterArea={
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
        }
        columns={COLUMNS}
        rows={paged}
        loading={loading}
        emptyIcon={<User size={36} />}
        emptyTitle="No testimonials found"
        renderRow={(item) => (
          <TR key={item.id}>
            <TD>
              <PersonCell>
                {resolveAvatar(item.avatar) ? (
                  <AvatarImg src={resolveAvatar(item.avatar)} alt={item.name} />
                ) : (
                  <AvatarPh>
                    <User size={18} color={t.colors.textMuted} />
                  </AvatarPh>
                )}
                <div>
                  <PersonName>{item.name}</PersonName>
                  <PersonPos>{item.position || "—"}</PersonPos>
                </div>
              </PersonCell>
            </TD>
            <TD>
              <MsgPreview>"{item.message}"</MsgPreview>
            </TD>
            <TD>
              <Stars rating={item.rating} />
            </TD>
            <TD>
              <ToggleTrack
                $on={(localStatus[item.id] ?? item.status) === "active"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatus(item);
                }}
                title="Toggle status"
              >
                <ToggleThumb
                  $on={(localStatus[item.id] ?? item.status) === "active"}
                />
              </ToggleTrack>
            </TD>
            <TD style={{ fontSize: "0.8rem" }}>{formatDate(item.createdAt)}</TD>
            <TD
              style={{ textAlign: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              <PortalDropdown>
                <MenuItem
                  onClick={() => {
                    closeAllDropdowns();
                    openView(item);
                  }}
                >
                  <Edit2 size={13} /> View
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    closeAllDropdowns();
                    openEdit(item);
                  }}
                >
                  <Edit2 size={13} /> Edit
                </MenuItem>
                <MenuItem
                  $danger
                  onClick={() => {
                    closeAllDropdowns();
                    openDelete(item);
                  }}
                >
                  <Trash2 size={13} /> Delete
                </MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={
          items.length > 0
            ? `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, items.length)} of ${items.length}`
            : "0 testimonials"
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
            style={{ maxWidth: 580, width: "95%" }}
          >
            <ModalHeader>
              <ModalTitle>
                {mode === "create" ? "Add New Testimonial" : "Edit Testimonial"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <FormGroup>
                <FormLabel>Avatar Photo</FormLabel>
                {imgPreview ? (
                  <div style={{ textAlign: "center" }}>
                    <AvatarPreview src={imgPreview} alt="preview" />
                    <button
                      onClick={() => {
                        setImgFile(null);
                        setImgPreview("");
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      style={{
                        background: "none",
                        border: `1px solid ${t.colors.border}`,
                        borderRadius: 6,
                        color: t.colors.textMuted,
                        cursor: "pointer",
                        padding: "4px 12px",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      Remove Photo
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
                    <User size={28} color={t.colors.textMuted} />
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: t.colors.textMuted,
                      }}
                    >
                      Click to upload avatar
                    </span>
                    <span
                      style={{ fontSize: "0.75rem", color: t.colors.textMuted }}
                    >
                      PNG, JPG up to 5MB
                    </span>
                  </UploadBox>
                )}
              </FormGroup>
              <FormGrid>
                <FormGroup>
                  <FormLabel>Name *</FormLabel>
                  <AdminInput
                    placeholder="e.g. Sarah Johnson"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Position / Role</FormLabel>
                  <AdminInput
                    placeholder="e.g. Health Coach"
                    value={form.position}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, position: e.target.value }))
                    }
                  />
                </FormGroup>
              </FormGrid>
              <FormGroup>
                <FormLabel>Message *</FormLabel>
                <AdminTextarea
                  rows={4}
                  placeholder="What the customer said…"
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                />
              </FormGroup>
              <FormGrid>
                <FormGroup>
                  <FormLabel>Rating</FormLabel>
                  <StarPicker
                    value={form.rating}
                    onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
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
                    ? "Create Testimonial"
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
            style={{ maxWidth: 480, width: "95%" }}
          >
            <ModalHeader>
              <ModalTitle>Testimonial Details</ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {resolveAvatar(selected.avatar) ? (
                <AvatarPreview
                  src={resolveAvatar(selected.avatar)}
                  alt={selected.name}
                />
              ) : (
                <AvatarPh style={{ width: 88, height: 88, margin: "0 auto" }}>
                  <User size={32} color={t.colors.textMuted} />
                </AvatarPh>
              )}
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: t.colors.textPrimary,
                  }}
                >
                  {selected.name}
                </div>
                <div
                  style={{ fontSize: "0.8125rem", color: t.colors.textMuted }}
                >
                  {selected.position || "—"}
                </div>
              </div>
              <Stars rating={selected.rating} />
              <p
                style={{
                  fontSize: "0.875rem",
                  color: t.colors.textSecondary,
                  lineHeight: 1.7,
                  fontStyle: "italic",
                  borderLeft: `3px solid ${t.colors.primary}`,
                  paddingLeft: 12,
                  textAlign: "left",
                  margin: 0,
                }}
              >
                "{selected.message}"
              </p>
              <StatusPill
                $variant={selected.status === "active" ? "success" : "neutral"}
              >
                {selected.status}
              </StatusPill>
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
              <ModalTitleDanger>Delete Testimonial</ModalTitleDanger>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                Are you sure you want to delete the testimonial from{" "}
                <strong>"{selected.name}"</strong>? This cannot be undone.
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
                {saving ? "Deleting…" : "Delete"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </>
  );
};

export default TestimonialsPage;
