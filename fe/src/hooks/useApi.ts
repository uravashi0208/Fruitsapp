/**
 * src/hooks/useApi.ts
 * Lightweight data-fetching hooks that call the backend.
 * Each hook exposes { data, loading, error, refetch }.
 */

import { useState, useEffect, useCallback } from 'react';
import { productsApi, ApiProduct, slidersApi, ApiSlider, testimonialsApi, ApiTestimonial, blogsApi, ApiBlogPost } from '../api/storefront';
import { ApiError } from '../api/client';

// ── Generic fetch hook ────────────────────────────────────────
export function useFetch<T>(
  fetchFn: () => Promise<{ success: boolean; data: T }>,
  deps: unknown[] = []
) {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      if (res.success) setData(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── Products hooks ────────────────────────────────────────────
export const useProducts = (params: { category?: string; limit?: number } = {}) =>
  useFetch<ApiProduct[]>(() => productsApi.list(params), [params.category, params.limit]);

export const useProduct = (id: string | number | null) =>
  useFetch<ApiProduct>(
    () => productsApi.getOne(id!),
    [id]
  );

// ── Sliders hook ──────────────────────────────────────────────
export const useSliders = () =>
  useFetch<ApiSlider[]>(() => slidersApi.list());

// ── Testimonials hook ─────────────────────────────────────────
export const useTestimonials = () =>
  useFetch<ApiTestimonial[]>(() => testimonialsApi.list());

// ── Blogs hook ────────────────────────────────────────────────
export const useBlogs = (params: { page?: number; limit?: number; tag?: string; search?: string } = {}) => {
  const [data,       setData]       = useState<ApiBlogPost[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await blogsApi.list(params);
      if (res.success) {
        setData(res.data ?? []);
        setPagination(prev => ({
          total:      res.pagination?.total      ?? prev.total,
          totalPages: res.pagination?.totalPages ?? prev.totalPages,
          page:       res.pagination?.page       ?? prev.page,
          limit:      res.pagination?.limit      ?? prev.limit,
        }));
      }
    } catch (e) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.limit, params.tag, params.search]);

  useEffect(() => { run(); }, [run]);
  return { data, pagination, loading, error, refetch: run };
};