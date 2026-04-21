// ============================================================
// src/utils/helpers.ts
// Pure utility functions — no side effects, fully typed
// ============================================================

import { VALID_PRODUCT_STATUSES } from "./constants";
import type { ProductStatus } from "../types";

/**
 * Normalises a raw status string from the API into a typed
 * ProductStatus, returning undefined for unrecognised values.
 */
export function normalizeStatus(raw?: string): ProductStatus | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase() as ProductStatus;
  return (VALID_PRODUCT_STATUSES as readonly string[]).includes(lower)
    ? lower
    : undefined;
}

/**
 * Formats a number as a USD price string, e.g. "$12.99".
 */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Truncates a string to `limit` chars, appending "…" if cut.
 */
export function truncate(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

/**
 * Returns true when a product should be considered purchasable.
 */
export function isProductInStock(
  status?: string,
  stock?: number
): boolean {
  if (status === "out_of_stock") return false;
  if (typeof stock === "number") return stock > 0;
  return status === "active" || status == null;
}
