/**
 * src/hooks/useAdminApi.ts
 * Admin-specific data-fetching hooks with loading/error state.
 */

import { useState, useEffect, useCallback } from "react";
import { ApiError } from "../api/client";
import {
  adminDashboardApi,
  adminProductsApi,
  adminOrdersApi,
  adminUsersApi,
  adminCardsApi,
  adminContactsApi,
  adminWishlistApi,
  adminBlogsApi,
  adminSettingsApi,
  adminCategoriesApi,
  adminTestimonialsApi,
  adminSlidersApi,
  adminNewsletterApi,
  adminCouponsApi,
  DashboardStats,
  ChartPeriod,
  AdminProduct,
  Order,
  AdminUser,
  CardDetail,
  Contact,
  WishlistAdminEntry,
  WishlistByUser,
  AdminBlogPost,
  SiteSettings,
  AdminCategory,
  AdminTestimonial,
  AdminSlider,
  NewsletterSubscriber,
  AdminCoupon,
  ProductQuery,
  OrderQuery,
  UserQuery,
  CardQuery,
  ContactQuery,
  BlogQuery,
} from "../api/admin";

// ── Generic admin fetch hook ──────────────────────────────────
function useAdminFetch<T>(
  fetchFn: () => Promise<{ success: boolean; data: T }>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      if (res.success) setData(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);
  return { data, loading, error, refetch: run };
}

// ── Generic paginated hook ────────────────────────────────────
function useAdminPaged<T>(
  fetchFn: () => Promise<{
    success: boolean;
    data: T[];
    pagination: {
      total: number;
      totalPages: number;
      page: number;
      limit: number;
    };
  }>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      if (res.success) {
        setData(res.data ?? []);
        // Safely merge pagination — backend may return partial or differently-shaped object
        setPagination((prev) => ({
          total: res.pagination?.total ?? prev.total,
          totalPages: res.pagination?.totalPages ?? prev.totalPages,
          page: res.pagination?.page ?? prev.page,
          limit: res.pagination?.limit ?? prev.limit,
        }));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);
  return { data, pagination, loading, error, refetch: run };
}

// ── Dashboard ─────────────────────────────────────────────────
export const useAdminDashboard = (params?: {
  period?: ChartPeriod;
  startDate?: string;
  endDate?: string;
}) =>
  useAdminFetch<DashboardStats>(
    () => adminDashboardApi.getStats(params),
    [params?.period, params?.startDate, params?.endDate],
  );

// ── Products ─────────────────────────────────────────────────
export const useAdminProducts = (query: ProductQuery = {}) =>
  useAdminPaged<AdminProduct>(
    () => adminProductsApi.list(query),
    [
      query.page,
      query.limit,
      query.search,
      query.category,
      query.status,
      query.sortDir,
    ],
  );

// ── Orders ────────────────────────────────────────────────────
export const useAdminOrders = (query: OrderQuery = {}) =>
  useAdminPaged<Order>(
    () => adminOrdersApi.list(query),
    [query.page, query.limit, query.search, query.status, query.paymentStatus],
  );

// ── Users ─────────────────────────────────────────────────────
export const useAdminUsers = (query: UserQuery = {}) =>
  useAdminPaged<AdminUser>(
    () => adminUsersApi.list(query),
    [query.page, query.limit, query.search, query.status, query.role],
  );

// ── Cards ─────────────────────────────────────────────────────
export const useAdminCards = (query: CardQuery = {}) =>
  useAdminPaged<CardDetail>(
    () => adminCardsApi.list(query),
    [query.page, query.limit, query.search, query.userId],
  );

// ── Contacts ──────────────────────────────────────────────────
export const useAdminContacts = (query: ContactQuery = {}) =>
  useAdminPaged<Contact>(
    () => adminContactsApi.list(query),
    [query.page, query.limit, query.search, query.status],
  );

// ── Wishlist ──────────────────────────────────────────────────
export const useAdminWishlist = (
  query: { search?: string; userId?: string } = {},
) =>
  useAdminFetch<{
    entries: WishlistAdminEntry[];
    byUser: WishlistByUser[];
    total: number;
  }>(() => adminWishlistApi.list(query), [query.search, query.userId]);

// ── Blogs ─────────────────────────────────────────────────────
export const useAdminBlogs = (query: BlogQuery = {}) =>
  useAdminPaged<AdminBlogPost>(
    () => adminBlogsApi.list(query),
    [query.page, query.limit, query.search, query.status, query.tag],
  );

// ── Settings ──────────────────────────────────────────────────
export const useAdminSettings = () =>
  useAdminFetch<SiteSettings>(() => adminSettingsApi.get());

// ── Categories ────────────────────────────────────────────────
export const useAdminCategories = () =>
  useAdminFetch<AdminCategory[]>(() => adminCategoriesApi.list());

// ── Testimonials ──────────────────────────────────────────────
export const useAdminTestimonials = () =>
  useAdminFetch<AdminTestimonial[]>(() => adminTestimonialsApi.list());

// ── Sliders ───────────────────────────────────────────────────
export const useAdminSliders = () =>
  useAdminFetch<AdminSlider[]>(() => adminSlidersApi.list());

// ── Coupons ───────────────────────────────────────────────────
export const useAdminCoupons = () =>
  useAdminFetch<AdminCoupon[]>(() => adminCouponsApi.list());

// ── Newsletter ─────────────────────────────────────────────────
export const useAdminNewsletter = (
  params: { page?: number; limit?: number; status?: string } = {},
) => {
  const [data, setData] = useState<NewsletterSubscriber[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminNewsletterApi.list(params);
      if (res.success) {
        setData(res.data ?? []);
        setPagination((prev) => ({
          total: res.pagination?.total ?? prev.total,
          totalPages: res.pagination?.totalPages ?? prev.totalPages,
          page: res.pagination?.page ?? prev.page,
          limit: res.pagination?.limit ?? prev.limit,
        }));
      }
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Failed to load subscribers",
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.limit, params.status]);

  useEffect(() => {
    run();
  }, [run]);
  return { data, pagination, loading, error, refetch: run };
};
