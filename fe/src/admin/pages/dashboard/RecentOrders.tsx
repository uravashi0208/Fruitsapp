/**
 * src/admin/pages/dashboard/RecentOrders.tsx
 * Last 5 orders table with product thumbnail, badge status, price.
 * Data from useAdminOrders. Styling from dashboardStyles.ts.
 *
 * Component structure:
 *   1. Data hook  (useAdminOrders — limit 5)
 *   2. Render     (header → table → loading/empty states)
 */

import React from "react";
import { Link } from "react-router-dom";
import { useAdminOrders } from "../../../hooks/useAdminApi";
import {
  DashCard,
  CardPadding,
  CardHeaderRow,
  CardTitle,
  CardSubtitle,
  DashTable,
  DashThead,
  DashTbody,
  DashTr,
  DashTh,
  DashTd,
  OutlineBtn,
  DashBadge,
  EmptyCell,
  statusBadgeColor,
} from "./dashboardStyles";
import { adminTheme as t } from "../../styles/adminTheme";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const BoxPlaceholder: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={t.colors.textMuted}>
    <path d="M3 6l9-4 9 4v1L12 11 3 7V6zm0 2.5l9 4 9-4V17l-9 4-9-4V8.5z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const RecentOrders: React.FC = () => {
  // 1. Data hook
  const {
    data: orders,
    pagination,
    loading,
  } = useAdminOrders({ limit: 5, page: 1 });
  const recent = (orders ?? []).slice(0, 5);
  const totalOrders = pagination?.total ?? 0;

  // 2. Render
  return (
    <DashCard $overflow="hidden">
      <CardPadding>
        <CardHeaderRow>
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardSubtitle>
              {loading
                ? "Loading…"
                : `${totalOrders.toLocaleString()} total orders`}
            </CardSubtitle>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <OutlineBtn as={Link as any} to="/admin/orders">
              See all
            </OutlineBtn>
          </div>
        </CardHeaderRow>

        <div style={{ overflowX: "auto" }}>
          <DashTable>
            <DashThead>
              <DashTr $noBottom>
                <DashTh>Products</DashTh>
                <DashTh>Location</DashTh>
                <DashTh>Price</DashTh>
                <DashTh>Status</DashTh>
              </DashTr>
            </DashThead>
            <DashTbody>
              {loading ? (
                <DashTr>
                  <EmptyCell colSpan={4}>Loading…</EmptyCell>
                </DashTr>
              ) : recent.length === 0 ? (
                <DashTr>
                  <EmptyCell colSpan={4}>No orders yet</EmptyCell>
                </DashTr>
              ) : (
                recent.map((order) => {
                  const firstItem = order.items?.[0];
                  const itemCount = order.items?.length ?? 1;
                  return (
                    <DashTr key={order.id}>
                      {/* Product cell */}
                      <DashTd>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          {firstItem?.image ? (
                            <div
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 8,
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={firstItem.image}
                                alt={firstItem.name}
                                style={{
                                  width: 50,
                                  height: 50,
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 8,
                                background: t.colors.surfaceAlt,
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <BoxPlaceholder />
                            </div>
                          )}
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 500,
                                fontSize: "0.8125rem",
                                color: t.colors.textPrimary,
                              }}
                            >
                              {firstItem?.name ??
                                `Order #${order.id.slice(-6)}`}
                            </p>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: t.colors.textMuted,
                              }}
                            >
                              {itemCount} item{itemCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </DashTd>

                      {/* Location */}
                      <DashTd>
                        {order.address?.city ?? order.userName ?? "—"}
                      </DashTd>

                      {/* Price */}
                      <DashTd>${(order.total ?? 0).toFixed(2)}</DashTd>

                      {/* Status badge */}
                      <DashTd>
                        <DashBadge $color={statusBadgeColor(order.status)} $sm>
                          {order.status
                            ? order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)
                            : "Pending"}
                        </DashBadge>
                      </DashTd>
                    </DashTr>
                  );
                })
              )}
            </DashTbody>
          </DashTable>
        </div>
      </CardPadding>
    </DashCard>
  );
};

export default RecentOrders;
