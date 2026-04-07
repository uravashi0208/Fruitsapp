/**
 * src/admin/pages/WishlistPage.tsx
 * Admin: wishlist management — view and remove customer wishlist entries.
 *
 * Page structure (consistent across ALL admin list pages):
 *   1. useState declarations  (data hooks → filter/pagination → modal/form)
 *   2. Derived / filtered data
 *   3. Modal helpers  (openDelete, closeModal)
 *   4. API handlers   (handleRemove)
 *   5. Return JSX     (ErrorBanner → stats → filter → groups → AdminDataTable)
 */

import React, { useState } from "react";
import styled from "styled-components";
import {
  Heart,
  Search,
  Trash2,
  ShoppingCart,
  Package,
  RefreshCw,
  Users,
} from "lucide-react";
import { ExportDropdown } from "../components/ExportDropdown";
import { exportData } from "../utils/exportUtils";
import { adminTheme as t } from "../styles/adminTheme";
import {
  AdminCard,
  AdminFlex,
  AdminBtn,
  IconBtn,
  AdminGrid,
  EmptyState,
} from "../styles/adminShared";
import {
  PageSearchBar,
  PageSearchInp,
  ErrorBanner,
} from "../styles/adminPageComponents";
import {
  adminWishlistApi,
  WishlistByUser,
  WishlistAdminEntry,
} from "../../api/admin";
import { useAdminWishlist } from "../../hooks/useAdminApi";
import { useAdminDispatch, showAdminToast } from "../store";
import { ApiError } from "../../api/client";
import { formatDate } from "../utils/formatDate";
import AdminDataTable, { TR, TD, ColDef } from "../components/AdminDataTable";
import AdminDropdown from "../components/AdminDropdown";

// ── Page-specific styled components ──────────────────────────────────────────

const StatCard = styled(AdminCard)`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 1.25rem 1.5rem;
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StatVal = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
  line-height: 1;
`;

const StatLbl = styled.div`
  font-size: 0.75rem;
  color: ${t.colors.textMuted};
  margin-top: 2px;
`;

const PThumb = styled.img`
  width: 38px;
  height: 38px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid ${t.colors.border};
  flex-shrink: 0;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${t.colors.primary}, ${t.colors.primaryDark});
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const CatTag = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${t.colors.primaryGhost};
  color: ${t.colors.primary};
`;

const Skeleton = styled.div`
  height: 60px;
  background: linear-gradient(
    90deg,
    ${t.colors.border} 25%,
    ${t.colors.surfaceAlt} 50%,
    ${t.colors.border} 75%
  );
  background-size: 200%;
  animation: adminPulse 1.5s ease infinite;
  border-radius: ${t.radii.md};
  margin-bottom: 8px;
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const WISHLIST_COLS: ColDef[] = [
  { key: "product", label: "Product" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price" },
  { key: "added", label: "Added" },
  {
    key: "actions",
    label: "",
    sortable: false,
    thProps: { style: { textAlign: "right" } },
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export const AdminWishlistPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  // 1a. Data hooks
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const { data, loading, error, refetch } = useAdminWishlist({
    search,
    userId: userFilter || undefined,
  });

  // 2. Derived data
  const entries = data?.entries ?? [];
  const byUser = data?.byUser ?? [];
  const total = data?.total ?? 0;
  const uniqueUsers = byUser.length;
  const uniqueProds = new Set(entries.map((e) => String(e.productId))).size;

  const topProductName =
    Object.entries(
      entries.reduce<Record<string, number>>((acc, e) => {
        acc[e.productName] = (acc[e.productName] || 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // 3. Modal helpers — none needed (no modal for this page, inline remove only)

  // 4. API handlers
  const handleRemove = async (id: string) => {
    try {
      await adminWishlistApi.remove(id);
      dispatch(
        showAdminToast({ message: "Wishlist entry removed", type: "warning" }),
      );
      refetch();
    } catch (err) {
      dispatch(
        showAdminToast({
          message: err instanceof ApiError ? err.message : "Remove failed",
          type: "error",
        }),
      );
    }
  };

  // 5. Render
  return (
    <section>
      {/* Error banner */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <AdminGrid
        $cols={4}
        $colsMd={2}
        $gap={t.spacing.lg}
        style={{ marginBottom: t.spacing.xl }}
      >
        <StatCard>
          <StatIcon $color="rgba(76,175,80,0.12)">
            <Heart size={20} color={t.colors.primary} />
          </StatIcon>
          <div>
            <StatVal>{total}</StatVal>
            <StatLbl>Total Wishlisted</StatLbl>
          </div>
        </StatCard>
        <StatCard>
          <StatIcon $color="rgba(11,165,236,0.12)">
            <Users size={20} color={t.colors.info} />
          </StatIcon>
          <div>
            <StatVal>{uniqueUsers}</StatVal>
            <StatLbl>Unique Users</StatLbl>
          </div>
        </StatCard>
        <StatCard>
          <StatIcon $color="rgba(247,144,9,0.12)">
            <Package size={20} color={t.colors.warning} />
          </StatIcon>
          <div>
            <StatVal>{uniqueProds}</StatVal>
            <StatLbl>Unique Products</StatLbl>
          </div>
        </StatCard>
        <StatCard>
          <StatIcon $color="rgba(70,95,255,0.12)">
            <ShoppingCart size={20} color={t.colors.primary} />
          </StatIcon>
          <div>
            <StatVal
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 120,
              }}
              title={topProductName}
            >
              {topProductName}
            </StatVal>
            <StatLbl>Most Wishlisted</StatLbl>
          </div>
        </StatCard>
      </AdminGrid>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <AdminFlex
        as="div"
        $justify="space-between"
        $wrap
        style={{ marginBottom: t.spacing.lg, gap: 12 }}
      >
        <AdminFlex as="div" $gap="12px" $wrap>
          <PageSearchBar style={{ minWidth: 280 }}>
            <Search size={15} color={t.colors.textMuted} />
            <PageSearchInp
              placeholder="User name, email or product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </PageSearchBar>
          {byUser.length > 0 && (
            <AdminDropdown
              value={userFilter}
              onChange={(val) => setUserFilter(val)}
              style={{ minWidth: 140 }}
              options={[
                { value: "", label: "All Users" },
                ...byUser.map((u) => ({ value: u.userId, label: u.userName })),
              ]}
            />
          )}
          <IconBtn onClick={refetch} title="Refresh">
            <RefreshCw size={14} />
          </IconBtn>
        </AdminFlex>
        <ExportDropdown
          loading={exportLoading}
          onExport={async (fmt) => {
            setExportLoading(true);
            try {
              await exportData(
                fmt,
                "wishlist",
                [
                  { key: "userName", label: "User" },
                  { key: "userEmail", label: "Email" },
                  { key: "productName", label: "Product" },
                  { key: "productSku", label: "SKU" },
                  { key: "price", label: "Price ($)" },
                  { key: "addedAt", label: "Added At" },
                ],
                entries as unknown as Record<string, unknown>[],
              );
            } finally {
              setExportLoading(false);
            }
          }}
        />
      </AdminFlex>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : byUser.length === 0 ? (
        <AdminCard>
          <EmptyState>
            <Heart size={40} />
            <h3>No wishlist entries</h3>
            <p>No items match your current filters.</p>
          </EmptyState>
        </AdminCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: t.spacing.lg }}>
          {byUser.map((group: WishlistByUser) => (
            <AdminCard key={group.userId} $p="0">
              {/* User header */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: `1px solid ${t.colors.border}`,
                  background: t.colors.surfaceAlt,
                  borderRadius: `${t.radii.lg} ${t.radii.lg} 0 0`,
                }}
              >
                <AdminFlex
                  as="div"
                  $gap="12px"
                  style={{ justifyContent: "space-between" }}
                >
                  <AdminFlex as="div" $gap="10px">
                    <Avatar>
                      {group.userName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {group.userName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: t.colors.textMuted }}>
                        {group.userEmail}
                      </div>
                    </div>
                  </AdminFlex>
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "0.8rem",
                      color: t.colors.textMuted,
                    }}
                  >
                    <strong style={{ color: t.colors.primary, fontSize: "1rem" }}>
                      {group.items.length}
                    </strong>{" "}
                    item{group.items.length !== 1 ? "s" : ""}
                  </div>
                </AdminFlex>
              </div>

              {/* Items table */}
              <AdminDataTable
                columns={WISHLIST_COLS}
                rows={group.items}
                showPagination={false}
                renderRow={(w: WishlistAdminEntry) => (
                  <TR key={w.id}>
                    <TD>
                      <AdminFlex as="div" $gap="10px">
                        <PThumb
                          src={w.productImage}
                          alt={w.productName}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/38x38/e8f5e9/4CAF50?text=${w.productName[0]}`;
                          }}
                        />
                        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                          {w.productName}
                        </span>
                      </AdminFlex>
                    </TD>
                    <TD>
                      <CatTag>{w.productCategory}</CatTag>
                    </TD>
                    <TD style={{ fontWeight: 700, color: t.colors.primary }}>
                      ${w.productPrice}
                    </TD>
                    <TD style={{ fontSize: "0.8rem", color: t.colors.textMuted }}>
                      {formatDate(w.addedAt)}
                    </TD>
                    <TD>
                      <AdminFlex
                        as="div"
                        $gap="4px"
                        style={{ justifyContent: "flex-end" }}
                      >
                        <AdminBtn
                          $variant="ghost"
                          $size="sm"
                          as="a"
                          href={`/product/${w.productId}`}
                          target="_blank"
                        >
                          <ShoppingCart size={13} /> View
                        </AdminBtn>
                        <IconBtn
                          $variant="danger"
                          title="Remove"
                          onClick={() => handleRemove(w.id)}
                        >
                          <Trash2 size={14} />
                        </IconBtn>
                      </AdminFlex>
                    </TD>
                  </TR>
                )}
              />
            </AdminCard>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminWishlistPage;
