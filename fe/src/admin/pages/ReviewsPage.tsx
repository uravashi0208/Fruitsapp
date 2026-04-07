/**
 * src/admin/pages/ReviewsPage.tsx
 * Admin: product review moderation — view + delete per product.
 *
 * Page structure (consistent across ALL admin list pages):
 *   1. useState declarations  (data state → filter/pagination → modal/form)
 *   2. Derived / filtered data
 *   3. Modal helpers  (openDelete, closeModal)
 *   4. API handlers   (searchProducts, loadReviews, handleDelete)
 *   5. Return JSX     (ErrorBanner → search card → AdminDataTable → modals)
 */

import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { Search, Trash2, Star, RefreshCw, Package } from "lucide-react";
import { ExportDropdown } from "../components/ExportDropdown";
import { exportData } from "../utils/exportUtils";
import { adminTheme as t } from "../styles/adminTheme";
import {
  AdminCard,
  AdminFlex,
  AdminBtn,
  IconBtn,
  StatusPill,
  ModalBackdrop,
  ModalBox,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "../styles/adminShared";
import {
  PageSearchBar,
  PageSearchInp,
  ModalCloseBtn,
  ModalTitleDanger,
  ConfirmText,
  ErrorBanner,
} from "../styles/adminPageComponents";
import { useAdminDispatch, showAdminToast } from "../store";
import { adminReviewsApi, AdminReview } from "../../api/admin";
import { adminProductsApi, AdminProduct } from "../../api/admin";
import { ApiError } from "../../api/client";
import { formatDate } from "../utils/formatDate";
import AdminDataTable, { TR, TD, ColDef } from "../components/AdminDataTable";

// ── Page-specific styled components ──────────────────────────────────────────

const ProductDropdown = styled.div`
  border: 1px solid ${t.colors.border};
  border-radius: 8px;
  overflow: hidden;
  margin-top: 8px;
  background: ${t.colors.surface};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const ProductDropdownItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  transition: background 0.1s;
  border-bottom: 1px solid ${t.colors.border};
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${t.colors.surfaceAlt};
  }
`;

const RatingFilter = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
`;

const RatingBtn = styled.button<{ $active: boolean }>`
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid ${({ $active }) => ($active ? t.colors.primary : t.colors.border)};
  background: ${({ $active }) => ($active ? t.colors.primaryGhost : "white")};
  color: ${({ $active }) => ($active ? t.colors.primary : t.colors.textSecondary)};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-family: ${t.fonts.body};
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover {
    border-color: ${t.colors.primary};
    color: ${t.colors.primary};
  }
`;

const CommentCell = styled.div`
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${t.colors.textSecondary};
  font-size: 0.8125rem;
`;

const StarRow = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;
`;

// ── Sub-components ────────────────────────────────────────────────────────────

const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <StarRow>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={13}
        fill={n <= rating ? "#f59e0b" : "none"}
        color={n <= rating ? "#f59e0b" : "#d0d5dd"}
      />
    ))}
    <span style={{ fontSize: "0.75rem", color: t.colors.textMuted, marginLeft: 4 }}>
      {rating}/5
    </span>
  </StarRow>
);

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
type ModalMode = "delete" | null;

const COLUMNS: ColDef[] = [
  { key: "reviewer", label: "Reviewer" },
  { key: "rating", label: "Rating" },
  { key: "comment", label: "Comment" },
  { key: "type", label: "Type" },
  { key: "date", label: "Date" },
  { key: "actions", label: "", sortable: false, thProps: { $width: "60px" } },
];

// ── Component ──────────────────────────────────────────────────────────────────

export const ReviewsPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  // 1a. Product search state
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [selectedProd, setSelectedProd] = useState<AdminProduct | null>(null);

  // 1b. Review list state
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // 1c. Filter / pagination
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState(0);

  // 1d. Modal / form
  const [mode, setMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<AdminReview | null>(null);
  const [saving, setSaving] = useState(false);

  // 2. Derived / filtered data
  const filtered =
    ratingFilter > 0 ? reviews.filter((r) => r.rating === ratingFilter) : reviews;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  // 3. Modal helpers
  const openDelete = (review: AdminReview) => {
    setSelected(review);
    setMode("delete");
  };
  const closeModal = () => {
    setMode(null);
    setSelected(null);
  };

  // 4a. Product search
  const searchProducts = useCallback(async () => {
    if (!productSearch.trim()) return;
    setProductLoading(true);
    try {
      const res = await adminProductsApi.list({ search: productSearch, limit: 10 });
      setProducts(res.success ? res.data : []);
    } catch {
      setProducts([]);
    } finally {
      setProductLoading(false);
    }
  }, [productSearch]);

  // 4b. Load reviews for a product
  const loadReviews = useCallback(async (prodId: string, pg: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminReviewsApi.list(prodId, { page: pg, limit: PAGE_SIZE });
      setReviews(res.success ? res.data : []);
      setTotal(res.pagination?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reviews");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectProduct = (prod: AdminProduct) => {
    setSelectedProd(prod);
    setProducts([]);
    setProductSearch(prod.name);
    setPage(1);
    setRatingFilter(0);
    loadReviews(prod.id, 1);
  };

  const changePage = (p: number) => {
    setPage(p);
    if (selectedProd) loadReviews(selectedProd.id, p);
  };

  // 4c. Delete
  const handleDelete = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminReviewsApi.delete(selected.id);
      setReviews((prev) => prev.filter((r) => r.id !== selected.id));
      setTotal((prev) => prev - 1);
      closeModal();
      dispatch(showAdminToast({ message: "Review deleted", type: "warning" }));
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
  }, [selected, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. Render
  return (
    <section>
      {/* Error banner */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Product Selector ─────────────────────────────────────────────── */}
      <AdminCard style={{ marginBottom: 24 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.875rem",
            marginBottom: 12,
            color: t.colors.textPrimary,
          }}
        >
          Select a Product to Moderate Reviews
        </div>
        <AdminFlex as="div" $gap="10px">
          <PageSearchBar style={{ flex: 1, height: 40 }}>
            <Search size={15} color={t.colors.textMuted} />
            <PageSearchInp
              placeholder="Search product by name…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchProducts()}
            />
          </PageSearchBar>
          <AdminBtn
            $variant="primary"
            onClick={searchProducts}
            disabled={productLoading}
          >
            {productLoading ? (
              <RefreshCw
                size={14}
                style={{ animation: "adminSpin 0.8s linear infinite" }}
              />
            ) : (
              <Search size={14} />
            )}{" "}
            Search
          </AdminBtn>
        </AdminFlex>

        {products.length > 0 && (
          <ProductDropdown>
            {products.map((p) => (
              <ProductDropdownItem key={p.id} onClick={() => selectProduct(p)}>
                <Package size={14} color={t.colors.textMuted} />
                <span style={{ flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: "0.75rem", color: t.colors.textMuted }}>
                  {p.categoryName}
                </span>
              </ProductDropdownItem>
            ))}
          </ProductDropdown>
        )}
      </AdminCard>

      {/* ── Reviews Table ────────────────────────────────────────────────── */}
      {selectedProd && (
        <>
          <AdminFlex
            as="div"
            $justify="space-between"
            $wrap
            style={{ marginBottom: 16, gap: 12 }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: t.colors.textPrimary,
                }}
              >
                Reviews for: {selectedProd.name}
              </div>
              <div
                style={{ fontSize: "0.8125rem", color: t.colors.textMuted, marginTop: 2 }}
              >
                {total} review(s) · Avg rating: {avgRating} ★
              </div>
            </div>
            <RatingFilter>
              <span style={{ fontSize: "0.8125rem", color: t.colors.textMuted }}>
                Filter:
              </span>
              {[0, 5, 4, 3, 2, 1].map((r) => (
                <RatingBtn
                  key={r}
                  $active={ratingFilter === r}
                  onClick={() => setRatingFilter(r)}
                >
                  {r === 0 ? "All" : <>{r} ★</>}
                </RatingBtn>
              ))}
            </RatingFilter>
          </AdminFlex>

          <AdminDataTable
            title="Reviews"
            subtitle="Customer reviews for this product"
            actions={
              <ExportDropdown
                loading={exportLoading}
                onExport={async (fmt) => {
                  setExportLoading(true);
                  try {
                    await exportData(
                      fmt,
                      "reviews",
                      [
                        { key: "userName", label: "User" },
                        { key: "rating", label: "Rating" },
                        { key: "comment", label: "Comment" },
                        { key: "isGuest", label: "Guest" },
                        { key: "createdAt", label: "Date" },
                      ],
                      filtered as unknown as Record<string, unknown>[],
                    );
                  } finally {
                    setExportLoading(false);
                  }
                }}
              />
            }
            columns={COLUMNS}
            rows={filtered}
            loading={loading}
            emptyIcon={<Star size={36} />}
            emptyTitle={`No reviews found${ratingFilter > 0 ? ` with ${ratingFilter} stars` : ""}`}
            emptyText="No customer reviews match the current filter."
            renderRow={(review) => (
              <TR key={review.id}>
                <TD>
                  <div
                    style={{
                      fontWeight: 600,
                      color: t.colors.textPrimary,
                      fontSize: "0.875rem",
                    }}
                  >
                    {review.userName}
                  </div>
                  {review.userId && (
                    <div style={{ fontSize: "0.75rem", color: t.colors.textMuted }}>
                      uid: {review.userId.slice(0, 8)}…
                    </div>
                  )}
                </TD>
                <TD>
                  <Stars rating={review.rating} />
                </TD>
                <TD>
                  <CommentCell title={review.comment}>
                    {review.comment || (
                      <span
                        style={{ color: t.colors.textMuted, fontStyle: "italic" }}
                      >
                        No comment
                      </span>
                    )}
                  </CommentCell>
                </TD>
                <TD>
                  <StatusPill $variant={review.isGuest ? "neutral" : "success"}>
                    {review.isGuest ? "Guest" : "Member"}
                  </StatusPill>
                </TD>
                <TD style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                  {formatDate(review.createdAt)}
                </TD>
                <TD onClick={(e) => e.stopPropagation()}>
                  <IconBtn
                    $variant="danger"
                    title="Delete review"
                    onClick={() => openDelete(review)}
                  >
                    <Trash2 size={14} />
                  </IconBtn>
                </TD>
              </TR>
            )}
            showPagination
            paginationInfo={`Showing 1 to ${Math.min(page * PAGE_SIZE, total)} of ${total}`}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={changePage}
          />
        </>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {mode === "delete" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox $width="400px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitleDanger>Delete Review</ModalTitleDanger>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                Are you sure you want to delete the review by{" "}
                <strong>"{selected.userName}"</strong>? This cannot be undone.
              </ConfirmText>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </AdminBtn>
              <AdminBtn $variant="danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting…" : "Delete Review"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </section>
  );
};

export default ReviewsPage;
