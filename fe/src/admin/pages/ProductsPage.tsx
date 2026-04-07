/**
 * src/admin/pages/ProductsPage.tsx
 * Admin: product management — full CRUD + bulk actions + restock modal.
 *
 * Page structure (consistent across ALL admin list pages):
 *   1. useState declarations  (data hooks → filter/pagination → selection/bulk → modal/form)
 *   2. Derived / filtered data
 *   3. Modal helpers  (openAdd, openEdit, openView, openDelete, openBulkConfirm, openRestock, closeModal)
 *   4. API handlers   (handleSave, handleDelete, toggleStatus, handleBulkAction, handleRestock, handleImport)
 *   5. Return JSX     (ErrorBanner → AdminDataTable → modals)
 */

import React, { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PortalDropdown,
  MenuItem,
  closeAllDropdowns,
} from "../components/PortalDropdown";
import styled from "styled-components";
import {
  Plus,
  Search,
  Trash2,
  Package,
  RefreshCw,
  Edit2,
  Eye,
  Upload,
  AlertTriangle,
  TrendingDown,
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
  SectionTitle,
} from "../styles/adminShared";
import {
  PageSearchBar,
  PageSearchInp,
  BulkBar,
  BulkCount,
  BulkActionBtn,
  UploadBox,
  UploadInput,
  ModalCloseBtn,
  ModalTitle,
  ConfirmText,
  ErrorBanner,
} from "../styles/adminPageComponents";
import { adminProductsApi } from "../../api/admin";
import { API_BASE } from "../../api/client";
import { useAdminProducts, useAdminCategories } from "../../hooks/useAdminApi";
import { useAdminDispatch, showAdminToast } from "../store";
import { AdminProduct } from "../../api/admin";
import { ApiError } from "../../api/client";
import { formatDate } from "../utils/formatDate";
import AdminDataTable, {
  TR,
  TD,
  CheckBox,
  ColDef,
} from "../components/AdminDataTable";
import AdminDropdown from "../components/AdminDropdown";

// ── Page-specific styled components ──────────────────────────────────────────

const ProductCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProductThumb = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid ${t.colors.border};
  flex-shrink: 0;
`;

const ProductThumbPh = styled.div`
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

const ProductName = styled.div`
  font-weight: 600;
  color: ${t.colors.textPrimary};
  font-size: 0.875rem;
`;

const ProductSku = styled.div`
  font-size: 0.75rem;
  color: ${t.colors.textMuted};
  margin-top: 2px;
`;

const PreviewImg = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid ${t.colors.border};
`;

const LOW_STOCK_THRESHOLD = 5;

const StockBadge = styled.span<{ $out: boolean; $low?: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $out, $low }) =>
    $out ? t.colors.danger : $low ? "#ea580c" : t.colors.success};
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 20px;
  background: ${({ $out, $low }) =>
    $out ? t.colors.dangerBg : $low ? "#fff7ed" : t.colors.successBg};
  border: 1px solid
    ${({ $out, $low }) =>
      $out ? t.colors.danger : $low ? "#fb923c" : t.colors.success};
  transition: opacity 0.15s;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  &:hover {
    opacity: 0.75;
  }
  &:active {
    opacity: 0.55;
  }
`;

const ImportBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid ${t.colors.border};
  border-radius: 10px;
  padding: 0 14px;
  height: 40px;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${t.colors.textSecondary};
  cursor: pointer;
  font-family: ${t.fonts.body};
  &:hover {
    background: ${t.colors.surfaceAlt};
  }
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
type ModalMode =
  | "create"
  | "edit"
  | "view"
  | "delete"
  | "bulkConfirm"
  | "restock"
  | null;
type BulkAction = "active" | "inactive" | "delete";

const COLUMNS: ColDef[] = [
  { key: "product", label: "Products" },
  { key: "category", label: "Category" },
  { key: "brand", label: "Brand" },
  { key: "price", label: "Price" },
  { key: "status", label: "Status" },
  { key: "stock", label: "Stock" },
  { key: "createdAt", label: "Created At" },
  { key: "actions", label: "Actions", thProps: { $width: "200px" } },
];

const emptyForm = (): Partial<AdminProduct> & { imageFile?: File | null } => ({
  name: "",
  category: "" as string,
  price: 0,
  stock: 0,
  sku: "",
  description: "",
  image: "",
  status: "active",
  rating: 4.0,
  reviews: 0,
  badge: "",
  imageFile: null,
});

const resolveImageUrl = (url: string) =>
  url
    ? url.startsWith("http")
      ? url
      : `${process.env.REACT_APP_API_URL || "http://localhost:4000"}${url}`
    : "";

// ── Component ──────────────────────────────────────────────────────────────────

export const ProductsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const navigate = useNavigate();

  // 1a. Data hooks
  const {
    data: categoriesData,
    loading: catsLoading,
    refetch: refetchCats,
  } = useAdminCategories();
  const categories = (categoriesData ?? []).filter(
    (c) => c.status === "active",
  );

  React.useEffect(() => {
    refetchCats();
  }, [refetchCats]);

  // 1b. Filter / pagination
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  // 1c. Selection / bulk
  const [selIds, setSelIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);

  // 1d. Modal / form
  const [mode, setMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<
    Partial<AdminProduct> & { imageFile?: File | null }
  >(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Products query
  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search,
      category: catFilter === "all" ? "" : catFilter,
      status: statusFilter === "all" ? "" : statusFilter,
    }),
    [page, search, catFilter, statusFilter],
  );

  const {
    data: products,
    pagination,
    loading,
    error,
    refetch,
  } = useAdminProducts(query);

  const allIds = (products ?? []).map((p) => p.id);
  const allChecked = allIds.length > 0 && allIds.every((id) => selIds.has(id));

  const toggleAll = () => setSelIds(allChecked ? new Set() : new Set(allIds));
  const toggleOne = (id: string) =>
    setSelIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // 3. Modal helpers
  const openAdd = () => {
    closeAllDropdowns();
    setSelected(null);
    setForm({ ...emptyForm(), category: categories[0]?.name ?? "" });
    setImagePreview("");
    setMode("create");
  };

  const openEdit = (p: AdminProduct) => {
    closeAllDropdowns();
    setSelected(p);
    setForm({ ...p, imageFile: null });
    setImagePreview(resolveImageUrl(p.image || p.thumbnail || ""));
    setMode("edit");
  };

  const openDelete = (p: AdminProduct) => {
    closeAllDropdowns();
    setSelected(p);
    setMode("delete");
  };

  const openBulkConfirm = (action: BulkAction) => {
    setPendingBulk(action);
    setMode("bulkConfirm");
  };

  const openRestock = (p: AdminProduct) => {
    closeAllDropdowns();
    setSelected(p);
    setRestockQty(String(p.stock ?? 0));
    setMode("restock");
  };

  const closeModal = () => {
    setMode(null);
    setSelected(null);
    setForm(emptyForm());
    setImagePreview("");
    setPendingBulk(null);
    setRestockQty("");
  };

  const setField =
    (k: keyof AdminProduct) =>
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
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // 4a. Create / Update
  const handleSave = useCallback(async () => {
    if (!form.name || !form.sku || !form.price) {
      dispatch(
        showAdminToast({
          message: "Name, SKU and price are required",
          type: "error",
        }),
      );
      return;
    }
    setSaving(true);
    try {
      const { imageFile, ...rest } = form;
      if (imageFile) {
        const SERVER_FIELDS = new Set([
          "id",
          "createdAt",
          "updatedAt",
          "image",
          "thumbnail",
          "images",
          "reviewCount",
        ]);
        const fd = new FormData();
        Object.entries(rest).forEach(([k, v]) => {
          if (SERVER_FIELDS.has(k) || v === undefined || v === null) return;
          if (k === "tags") {
            const arr = Array.isArray(v)
              ? v
              : String(v)
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean);
            arr.forEach((tag: string) => fd.append("tags", tag));
            return;
          }
          fd.append(k, String(v));
        });
        if (!fd.has("badge")) fd.append("badge", "");
        fd.append("thumbnail", imageFile);
        const token = sessionStorage.getItem("vf_access");
        const url = selected
          ? `${API_BASE}/api/admin/products/${selected.id}`
          : `${API_BASE}/api/admin/products`;
        const res = await fetch(url, {
          method: selected ? "PUT" : "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok)
          throw new Error((await res.json()).error || "Upload failed");
      } else {
        const payload = { ...rest, badge: rest.badge ?? "" };
        if (selected) {
          await adminProductsApi.update(selected.id, payload as AdminProduct);
        } else {
          await adminProductsApi.create(payload as AdminProduct);
        }
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
      await adminProductsApi.delete(selected.id);
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
    async (p: AdminProduct) => {
      if (toggling) return;
      const next =
        p.status === "active"
          ? "inactive"
          : p.status === "inactive"
            ? "active"
            : "active";
      setToggling(p.id);
      try {
        await adminProductsApi.updateStatus(
          p.id,
          next as AdminProduct["status"],
        );
        dispatch(
          showAdminToast({
            message: `"${p.name}" set to ${next}`,
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
          await adminProductsApi.bulkSoftDelete(ids);
          dispatch(
            showAdminToast({
              message: `${ids.length} product(s) soft-deleted`,
              type: "warning",
            }),
          );
        } else {
          await adminProductsApi.bulkUpdateStatus(ids, action);
          dispatch(
            showAdminToast({
              message: `${ids.length} product(s) set to ${action}`,
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
    [selIds, dispatch, refetch], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // 4e. Restock
  const handleRestock = useCallback(async () => {
    if (!selected) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty < 0) {
      dispatch(
        showAdminToast({
          message: "Enter a valid stock quantity (≥ 0)",
          type: "error",
        }),
      );
      return;
    }
    setSaving(true);
    try {
      await adminProductsApi.update(selected.id, {
        stock: qty,
      } as Partial<AdminProduct>);
      dispatch(
        showAdminToast({
          message:
            qty === 0
              ? `"${selected.name}" marked Out of Stock`
              : `"${selected.name}" stock updated to ${qty} units`,
          type: qty === 0 ? "warning" : "success",
        }),
      );
      closeModal();
      refetch();
    } catch (err) {
      dispatch(
        showAdminToast({
          message: err instanceof ApiError ? err.message : "Restock failed",
          type: "error",
        }),
      );
    } finally {
      setSaving(false);
    }
  }, [selected, restockQty, dispatch, refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4f. CSV/Excel import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!importRef.current) return;
    importRef.current.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = sessionStorage.getItem("vf_access");
      const res = await fetch(`${API_BASE}/api/admin/products/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        dispatch(
          showAdminToast({
            message:
              data.message ||
              `Import complete: ${data.data?.created} products added`,
            type: "success",
          }),
        );
        refetch();
      } else {
        dispatch(
          showAdminToast({
            message: data.message || "Import failed",
            type: "error",
          }),
        );
      }
    } catch {
      dispatch(
        showAdminToast({
          message: "Import failed. Check file format.",
          type: "error",
        }),
      );
    } finally {
      setImporting(false);
    }
  };

  // 5. Render
  return (
    <section>
      {/* Error banner */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Data Table ──────────────────────────────────────────────────── */}
      <AdminDataTable
        title="Products List"
        subtitle="Track your store's progress to boost your sales."
        actions={
          <>
            <ExportDropdown
              loading={exportLoading}
              onExport={async (fmt) => {
                setExportLoading(true);
                try {
                  await exportData(
                    fmt,
                    "products",
                    [
                      { label: "Image", imageKey: "image" },
                      { label: "Name", key: "name" },
                      { label: "SKU", key: "sku" },
                      { label: "Category", key: "category" },
                      {
                        label: "Price ($)",
                        resolve: (row) =>
                          `$${((row.price as number) || 0).toFixed(2)}`,
                      },
                      { label: "Stock", key: "stock" },
                      {
                        label: "Status",
                        resolve: (row) =>
                          row["status"] === "active" ? "Active" : "Inactive",
                      },
                      { label: "Badge", key: "badge" },
                      { label: "Rating", key: "rating" },
                      {
                        label: "Created At",
                        resolve: (row) => {
                          const v = row["createdAt"] as string;
                          return v ? formatDate(v) : "—";
                        },
                      },
                    ],
                    (products ?? []) as unknown as Record<string, unknown>[],
                  );
                } finally {
                  setExportLoading(false);
                }
              }}
            />
            <input
              ref={importRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={handleImport}
            />
            <ImportBtn
              onClick={() => importRef.current?.click()}
              title="Import products from Excel/CSV"
            >
              {importing ? (
                <>
                  <RefreshCw
                    size={14}
                    style={{ animation: "adminSpin 0.8s linear infinite" }}
                  />{" "}
                  Importing…
                </>
              ) : (
                <>
                  <Upload size={15} /> Import
                </>
              )}
            </ImportBtn>
            <AdminBtn $variant="primary" onClick={openAdd}>
              <Plus size={15} /> Add Product
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
              placeholder="Search products…"
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
              value={catFilter}
              onChange={(val) => {
                setCatFilter(val);
                setPage(1);
              }}
              options={[
                {
                  value: "all",
                  label: catsLoading ? "Loading…" : "All Categories",
                },
                ...categories.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />
            <AdminDropdown
              style={{ minWidth: 150 }}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val as string);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </>
        }
        columns={COLUMNS}
        selectable
        allChecked={allChecked}
        onToggleAll={toggleAll}
        rows={products ?? []}
        loading={loading}
        emptyIcon={<Package size={36} />}
        emptyTitle="No products found"
        emptyText="Try adjusting your filters or add a new product."
        emptyAction={
          <AdminBtn $variant="primary" onClick={openAdd}>
            <Plus size={14} /> Add Product
          </AdminBtn>
        }
        renderRow={(p) => (
          <TR key={p.id}>
            <TD>
              <CheckBox
                checked={selIds.has(p.id)}
                onChange={() => toggleOne(p.id)}
              />
            </TD>
            <TD>
              <ProductCell>
                {p.image || p.thumbnail ? (
                  <ProductThumb
                    src={resolveImageUrl(p.image || p.thumbnail || "")}
                    alt={p.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/44x44/f9fafb/98a2b3?text=P";
                    }}
                  />
                ) : (
                  <ProductThumbPh>
                    <Package size={18} color={t.colors.textMuted} />
                  </ProductThumbPh>
                )}
                <div>
                  <ProductName>{p.name}</ProductName>
                  <ProductSku>{p.sku}</ProductSku>
                </div>
              </ProductCell>
            </TD>
            <TD style={{ textTransform: "capitalize" }}>{p.category || "—"}</TD>
            <TD style={{ color: t.colors.textMuted }}>{p.badge || "—"}</TD>
            <TD style={{ fontWeight: 600 }}>${p.price}</TD>
            <TD>
              {p.status === "active" || p.status === "inactive" ? (
                <ToggleTrack
                  $on={p.status === "active"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(p);
                  }}
                  title="Click to toggle status"
                  style={{
                    opacity: toggling === p.id ? 0.6 : 1,
                    cursor: toggling === p.id ? "wait" : "pointer",
                  }}
                >
                  <ToggleThumb $on={p.status === "active"} />
                </ToggleTrack>
              ) : (
                <StatusPill
                  $variant={
                    p.status === "out_of_stock"
                      ? "danger"
                      : p.status === "draft"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {p.status === "out_of_stock" ? "out of stock" : p.status}
                </StatusPill>
              )}
            </TD>
            <TD>
              <StockBadge
                $out={(p.stock ?? 0) === 0 || p.status === "out_of_stock"}
                $low={
                  (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD
                }
                title="Click to update stock"
                onClick={(e) => {
                  e.stopPropagation();
                  openRestock(p);
                }}
              >
                {(p.stock ?? 0) === 0 || p.status === "out_of_stock" ? (
                  <>
                    <AlertTriangle size={11} /> Out of Stock
                  </>
                ) : (p.stock ?? 0) <= LOW_STOCK_THRESHOLD ? (
                  <>
                    <TrendingDown size={11} /> {p.stock} left
                  </>
                ) : (
                  <>
                    <CheckCircle size={11} /> {p.stock} in stock
                  </>
                )}
              </StockBadge>
            </TD>
            <TD style={{ fontSize: "0.8rem" }}>{formatDate(p.createdAt)}</TD>
            <TD onClick={(e) => e.stopPropagation()}>
              <PortalDropdown>
                <MenuItem
                  onClick={() => {
                    closeAllDropdowns();
                    navigate(`/admin/products/${p.id}`);
                  }}
                >
                  <Eye size={14} /> View More
                </MenuItem>
                <MenuItem onClick={() => openEdit(p)}>
                  <Edit2 size={14} /> Edit
                </MenuItem>
                <MenuItem $danger onClick={() => openDelete(p)}>
                  <Trash2 size={14} /> Delete
                </MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={`Showing 1 to ${Math.min(page * PAGE_SIZE, pagination?.total ?? 0)} of ${pagination?.total ?? 0}`}
        currentPage={page}
        totalPages={pagination?.totalPages ?? 1}
        onPageChange={setPage}
      />

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {(mode === "create" || mode === "edit") && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="660px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {mode === "edit"
                  ? `Edit "${selected?.name}"`
                  : "Add New Product"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGrid $cols={2}>
                <FormGroup $span={2}>
                  <FormLabel>Product Name *</FormLabel>
                  <AdminInput
                    value={form.name ?? ""}
                    onChange={setField("name")}
                    placeholder="e.g. Cherry Tomatoes"
                    autoFocus
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>SKU *</FormLabel>
                  <AdminInput
                    value={form.sku ?? ""}
                    onChange={setField("sku")}
                    placeholder="VEG-013"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Category</FormLabel>
                  <AdminDropdown
                    value={form.category ?? ""}
                    onChange={(val) =>
                      setField("category")({ target: { value: val } } as any)
                    }
                    options={[
                      {
                        value: "",
                        label: catsLoading
                          ? "Loading categories…"
                          : "— Select category —",
                      },
                      ...categories.map((c) => ({
                        value: c.name,
                        label: c.name,
                      })),
                    ]}
                  />
                  {!catsLoading && categories.length === 0 && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#f79009",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      ⚠️ No categories yet — add them in{" "}
                      <strong>Products → Product Categories</strong> first.
                    </span>
                  )}
                </FormGroup>
                <FormGroup>
                  <FormLabel>Price ($) *</FormLabel>
                  <AdminInput
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.price ?? ""}
                    onChange={setField("price")}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Original Price ($)</FormLabel>
                  <AdminInput
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.originalPrice ?? ""}
                    onChange={setField("originalPrice")}
                    placeholder="Leave empty if no discount"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Stock (units)</FormLabel>
                  <AdminInput
                    type="number"
                    min={0}
                    value={form.stock ?? ""}
                    onChange={setField("stock")}
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
                      { value: "draft", label: "Draft" },
                    ]}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Brand / Badge</FormLabel>
                  <AdminInput
                    value={form.badge ?? ""}
                    onChange={setField("badge")}
                    placeholder="e.g. SALE, Organic"
                  />
                </FormGroup>
                <FormGroup $span={2}>
                  <FormLabel>Product Image</FormLabel>
                  <UploadBox htmlFor="product-img-upload">
                    <UploadInput
                      id="product-img-upload"
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      onChange={handleImageFile}
                    />
                    {imagePreview ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <PreviewImg
                          src={imagePreview}
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
                        <Package size={32} color={t.colors.textMuted} />
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
                <FormGroup $span={2}>
                  <FormLabel>Description</FormLabel>
                  <AdminTextarea
                    value={form.description ?? ""}
                    onChange={setField("description")}
                    placeholder="Describe the product…"
                    style={{ minHeight: 80 }}
                  />
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
                    : "Add Product"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── View Modal ───────────────────────────────────────────────────── */}
      {mode === "view" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="520px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{selected.name}</ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <ProductThumb
                  src={
                    resolveImageUrl(
                      selected.image || selected.thumbnail || "",
                    ) || "https://placehold.co/80x80/e8f5e9/4CAF50?text=P"
                  }
                  alt={selected.name}
                  style={{ width: 80, height: 80 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/80x80/e8f5e9/4CAF50?text=P";
                  }}
                />
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
                    style={{ color: t.colors.textMuted, fontSize: "0.8rem" }}
                  >
                    SKU: {selected.sku}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                    <StatusPill
                      $variant={
                        selected.status === "active" ? "success" : "neutral"
                      }
                    >
                      {selected.status}
                    </StatusPill>
                    <StockBadge $out={(selected.stock ?? 0) === 0}>
                      {(selected.stock ?? 0) === 0
                        ? "Out of Stock"
                        : "In Stock"}
                    </StockBadge>
                  </div>
                </div>
              </div>
              <FormGrid $cols={2}>
                <FormGroup>
                  <FormLabel>Category</FormLabel>
                  <div style={{ textTransform: "capitalize" }}>
                    {selected.category || "—"}
                  </div>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Price</FormLabel>
                  <div style={{ fontWeight: 700 }}>${selected.price}</div>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Stock</FormLabel>
                  <div>{selected.stock} units</div>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Rating</FormLabel>
                  <div>
                    ⭐ {selected.rating} ({selected.reviews} reviews)
                  </div>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Created</FormLabel>
                  <div>{formatDate(selected.createdAt)}</div>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Updated</FormLabel>
                  <div>{formatDate(selected.updatedAt)}</div>
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
                Edit Product
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Restock Modal ────────────────────────────────────────────────── */}
      {mode === "restock" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="460px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Package
                  size={16}
                  style={{
                    display: "inline",
                    marginRight: 8,
                    verticalAlign: "middle",
                  }}
                />
                Update Stock — {selected.name}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 20,
                  background:
                    (selected.stock ?? 0) === 0
                      ? t.colors.dangerBg
                      : (selected.stock ?? 0) <= LOW_STOCK_THRESHOLD
                        ? "#fff7ed"
                        : t.colors.successBg,
                  border: `1px solid ${
                    (selected.stock ?? 0) === 0
                      ? t.colors.danger
                      : (selected.stock ?? 0) <= LOW_STOCK_THRESHOLD
                        ? "#fb923c"
                        : t.colors.success
                  }`,
                }}
              >
                {(selected.stock ?? 0) === 0 ? (
                  <AlertTriangle size={16} color={t.colors.danger} />
                ) : (selected.stock ?? 0) <= LOW_STOCK_THRESHOLD ? (
                  <TrendingDown size={16} color="#ea580c" />
                ) : (
                  <CheckCircle size={16} color={t.colors.success} />
                )}
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color:
                      (selected.stock ?? 0) === 0
                        ? t.colors.danger
                        : (selected.stock ?? 0) <= LOW_STOCK_THRESHOLD
                          ? "#ea580c"
                          : t.colors.success,
                  }}
                >
                  Current stock: {selected.stock ?? 0} units
                  {(selected.stock ?? 0) === 0
                    ? " — Out of Stock"
                    : (selected.stock ?? 0) <= LOW_STOCK_THRESHOLD
                      ? " — Low Stock"
                      : " — In Stock"}
                </span>
              </div>
              <FormGroup>
                <FormLabel>New Stock Quantity</FormLabel>
                <AdminInput
                  type="number"
                  min="0"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="Enter new stock level"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleRestock()}
                  style={{ fontSize: "1.1rem", padding: "10px 14px" }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: t.colors.textMuted,
                    marginTop: 6,
                  }}
                >
                  Set to <strong>0</strong> to mark as out of stock.
                </p>
              </FormGroup>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 8,
                }}
              >
                {[0, 10, 25, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRestockQty(String(n))}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      border: `1px solid ${t.colors.border}`,
                      background:
                        restockQty === String(n) ? t.colors.primary : "white",
                      color:
                        restockQty === String(n)
                          ? "white"
                          : t.colors.textSecondary,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      fontWeight: 500,
                      fontFamily: t.fonts.body,
                    }}
                  >
                    {n === 0 ? "Out of Stock" : `+${n}`}
                  </button>
                ))}
              </div>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal}>
                Cancel
              </AdminBtn>
              <AdminBtn
                $variant={restockQty === "0" ? "danger" : "primary"}
                onClick={handleRestock}
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : restockQty === "0"
                    ? "Mark Out of Stock"
                    : "Update Stock"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {mode === "delete" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="420px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <SectionTitle style={{ color: t.colors.danger }}>
                Delete Product
              </SectionTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                Are you sure you want to delete{" "}
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
                {saving ? "Deleting…" : "Delete Product"}
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
                  ? "Delete Selected Products"
                  : pendingBulk === "active"
                    ? "Set Products Active"
                    : "Set Products Inactive"}
              </ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                {pendingBulk === "delete" ? (
                  <>
                    Are you sure you want to soft-delete{" "}
                    <strong>
                      {selIds.size} product{selIds.size > 1 ? "s" : ""}
                    </strong>
                    ? They will be hidden from the store but not permanently
                    removed.
                  </>
                ) : (
                  <>
                    Set{" "}
                    <strong>
                      {selIds.size} product{selIds.size > 1 ? "s" : ""}
                    </strong>{" "}
                    to <strong>{pendingBulk}</strong>?
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
                    ? `Delete ${selIds.size} Product${selIds.size > 1 ? "s" : ""}`
                    : pendingBulk === "active"
                      ? `Set ${selIds.size} Active`
                      : `Set ${selIds.size} Inactive`}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </section>
  );
};

export default ProductsPage;
