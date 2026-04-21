// ============================================================
// src/hooks/useApi.ts
// Data-fetching hooks.  Each hook exposes { data, loading, error, refetch }.
// Network reconnect logic is handled once in useFetch — never duplicated.
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useIonToast } from "@ionic/react";
import { Network } from "@capacitor/network";

import {
  productsApi,
  ApiProduct,
  slidersApi,
  ApiSlider,
  testimonialsApi,
  ApiTestimonial,
  blogsApi,
  ApiBlogPost,
  categoriesApi,
  ApiCategory,
} from "../api/storefront";
import { ApiError } from "../api/client";

// ── Shared option type ────────────────────────────────────────

export interface FetchOptions {
  /** Suppress the automatic error toast */
  silent?: boolean;
}

// ── Generic fetch hook ────────────────────────────────────────

export function useFetch<T>(
  fetchFn: () => Promise<{ success: boolean; data: T }>,
  deps: unknown[] = [],
  options: FetchOptions = {},
) {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [presentToast] = useIonToast();

  // Keep a stable ref to fetchFn so the run callback never needs it as a dep
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => { fetchFnRef.current = fetchFn; });

  const silentRef = useRef(options.silent);
  useEffect(() => { silentRef.current = options.silent; });

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFnRef.current();
      if (res.success) setData(res.data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Something went wrong";
      setError(msg);
      if (!silentRef.current) {
        presentToast({ message: msg, duration: 3000, color: "danger", position: "bottom" });
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Initial fetch
  useEffect(() => { run(); }, [run]);

  // Refetch on network reconnect
  useEffect(() => {
    let handle: Awaited<ReturnType<typeof Network.addListener>>;
    Network.addListener("networkStatusChange", (status) => {
      if (status.connected) run();
    }).then((h) => { handle = h; });
    return () => { handle?.remove(); };
  }, [run]);

  return { data, loading, error, refetch: run };
}

// ── Domain-specific hooks ─────────────────────────────────────

export const useProducts = (
  params: { category?: string; limit?: number } = {},
  options?: FetchOptions,
) =>
  useFetch<ApiProduct[]>(
    () => productsApi.list(params),
    [params.category, params.limit],
    options,
  );

export const useProduct = (
  id: string | number | null,
  options?: FetchOptions,
) =>
  useFetch<ApiProduct>(
    () => productsApi.getOne(id!),
    [id],
    options,
  );

export const useSliders = (options?: FetchOptions) =>
  useFetch<ApiSlider[]>(() => slidersApi.list(), [], options);

export const useTestimonials = (options?: FetchOptions) =>
  useFetch<ApiTestimonial[]>(() => testimonialsApi.list(), [], options);

export const useCategories = (options?: FetchOptions) =>
  useFetch<ApiCategory[]>(() => categoriesApi.list(), [], options);

// ── Blog hook (custom pagination state) ──────────────────────

export interface BlogParams {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
}

export interface BlogPagination {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export function useBlogs(params: BlogParams = {}, options: FetchOptions = {}) {
  const [data, setData]             = useState<ApiBlogPost[]>([]);
  const [pagination, setPagination] = useState<BlogPagination>({
    total: 0, totalPages: 1, page: 1, limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [presentToast] = useIonToast();
  const paramsRef      = useRef(params);
  const silentRef      = useRef(options.silent);
  useEffect(() => { paramsRef.current = params; });
  useEffect(() => { silentRef.current = options.silent; });

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blogsApi.list(paramsRef.current);
      if (res.success) {
        setData(res.data ?? []);
        setPagination((prev) => ({
          total:      res.pagination?.total      ?? prev.total,
          totalPages: res.pagination?.totalPages ?? prev.totalPages,
          page:       res.pagination?.page       ?? prev.page,
          limit:      res.pagination?.limit      ?? prev.limit,
        }));
      }
    } catch {
      const msg = "Failed to load posts";
      setError(msg);
      if (!silentRef.current) {
        presentToast({ message: msg, duration: 3000, color: "danger", position: "bottom" });
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.limit, params.tag, params.search]);

  useEffect(() => { run(); }, [run]);

  useEffect(() => {
    let handle: Awaited<ReturnType<typeof Network.addListener>>;
    Network.addListener("networkStatusChange", (status) => {
      if (status.connected) run();
    }).then((h) => { handle = h; });
    return () => { handle?.remove(); };
  }, [run]);

  return { data, pagination, loading, error, refetch: run };
}
