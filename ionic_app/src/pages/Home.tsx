// ============================================================
// src/pages/Home.tsx
// ============================================================

import React, { useMemo, useState } from "react";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonText,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import { notificationsOutline, searchOutline } from "ionicons/icons";
import { InfiniteScrollCustomEvent } from "@ionic/core";
import { useHistory } from "react-router-dom";

import { useProducts, useCategories } from "../hooks/useApi";
import { normalizeStatus } from "../utils/helpers";
import { PAGE_SIZE, ROUTES } from "../utils/constants";

import ProductCard    from "../components/common/ProductCard";
import CategoryChip   from "../components/common/CategoryChip";
import BottomNav      from "../components/layout/BottomNav";

// ── Skeleton Loader ───────────────────────────────────────────

const CategorySkeleton: React.FC = () => (
  <div style={{ display: "flex", gap: 9, marginBottom: 22 }}>
    {[80, 110, 70, 90, 100].map((w, i) => (
      <div
        key={i}
        style={{
          width: w,
          height: 38,
          borderRadius: "var(--radius-full)",
          background: "var(--color-border)",
          flexShrink: 0,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    ))}
    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
  </div>
);

// ── Page Component ────────────────────────────────────────────

const Home: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch]                 = useState("");
  const [visible, setVisible]               = useState(PAGE_SIZE);
  const history                             = useHistory();

  const { data: dbCategories, loading: catLoading } = useCategories({ silent: true });

  const categories = useMemo(() => {
    if (!dbCategories) return ["All"];
    return ["All", ...dbCategories.map((c) => c.name)];
  }, [dbCategories]);

  const apiCategory = activeCategory === "All" ? undefined : activeCategory.toLowerCase();

  const { data: apiProducts, loading, refetch } = useProducts({
    category: apiCategory,
    limit: 200,
  });

  const filtered = useMemo(() => {
    const list = [...(apiProducts ?? [])];
    if (!search.trim()) return list;
    return list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [apiProducts, search]);

  const visibleProducts = filtered.slice(0, visible);
  const hasMore         = visible < filtered.length;

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setVisible(PAGE_SIZE);
  };

  const handleInfiniteScroll = (e: InfiniteScrollCustomEvent) => {
    setVisible((v) => v + PAGE_SIZE);
    e.target.complete();
  };

  return (
    <IonPage>
      <IonContent style={{ "--background": "var(--color-bg)" }}>
        <IonRefresher
          slot="fixed"
          onIonRefresh={(e) => refetch().finally(() => e.detail.complete())}
        >
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: "52px 18px 10px" }}>
          {/* ── Header ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 22,
            }}
          >
            <IonText>
              <h1
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 28,
                  lineHeight: 1.25,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-primary)",
                }}
              >
                Daily
                <br />
                Grocery Food
              </h1>
            </IonText>

            <button
              onClick={() => history.push(ROUTES.NOTIFICATIONS)}
              aria-label="Notifications"
              style={{
                background: "var(--color-surface)",
                border: "none",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "var(--shadow-md)",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <IonIcon
                icon={notificationsOutline}
                style={{ fontSize: 22, color: "var(--color-text)" }}
              />
            </button>
          </div>

          {/* ── Search Bar ── */}
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              padding: "10px 20px",
              gap: 10,
              marginBottom: 18,
              boxShadow: "var(--shadow-sm)",
              border:"1px solid #80808033"
            }}
          >
            <IonIcon
              icon={searchOutline}
              style={{ fontSize: 18, color: "var(--color-text-sub)" }}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search products…"
              aria-label="Search products"
              style={{
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "var(--color-text-sub)",
                fontFamily: "var(--font-primary)",
                width: "100%",
                background: "transparent",
              }}
            />
          </div>

          {/* ── Category Chips ── */}
          {catLoading ? (
            <CategorySkeleton />
          ) : (
            <div
              style={{
                display: "flex",
                gap: 9,
                overflowX: "auto",
                marginBottom: 22,
                paddingBottom: 4,
                scrollbarWidth: "none",
              }}
            >
              {categories.map((cat) => {
                const catData = dbCategories?.find((c) => c.name === cat);
                return (
                  <CategoryChip
                    key={cat}
                    label={cat}
                    isActive={activeCategory === cat}
                    imageUrl={catData?.image}
                    onClick={() => handleCategoryChange(cat)}
                  />
                );
              })}
            </div>
          )}

          {/* ── Section Header ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <IonText>
              <h2
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-primary)",
                }}
              >
                Popular {activeCategory}
              </h2>
            </IonText>
            <span
              style={{
                fontSize: 13,
                color: "var(--color-accent)",
                cursor: "pointer",
                fontWeight: 500,
                fontFamily: "var(--font-primary)",
              }}
            >
              See all
            </span>
          </div>

          {/* ── Products Grid ── */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 220 }}>
              <IonSpinner
                name="crescent"
                style={{ color: "var(--color-primary)", width: 36, height: 36 }}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-sub)" }}>
              <p style={{ margin: 0, fontSize: 15, fontFamily: "var(--font-primary)" }}>
                No products found.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {visibleProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{ ...p, id: String(p.id), status: normalizeStatus(p.status) }}
                />
              ))}
            </div>
          )}

          {/* ── All Loaded Divider ── */}
          {!loading && !hasMore && filtered.length > PAGE_SIZE && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
              <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
              <span style={{ fontSize: 12, color: "var(--color-text-sub)", whiteSpace: "nowrap", fontFamily: "var(--font-primary)" }}>
                All products loaded
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            </div>
          )}
        </div>

        <IonInfiniteScroll
          disabled={!hasMore || loading}
          threshold="150px"
          onIonInfinite={handleInfiniteScroll}
        >
          <IonInfiniteScrollContent loadingText="Loading more…" />
        </IonInfiniteScroll>

        <BottomNav />
      </IonContent>
    </IonPage>
  );
};

export default Home;
