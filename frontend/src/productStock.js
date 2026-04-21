/** Catalog stock from API (`Product.quantity`). `null` = unknown (treat as in stock for legacy payloads). */
export function getProductStockQty(product) {
  if (!product || product.quantity === undefined || product.quantity === null) return null;
  const n = Number(product.quantity);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

export function isProductOutOfStock(product) {
  const q = getProductStockQty(product);
  return q !== null && q <= 0;
}

/** Shown when Buy now / checkout is blocked because catalog quantity is 0 (admin inventory). */
export const BUY_NOW_OUT_OF_STOCK_TOAST = {
  title: "Out of stock!",
  message: "May want to add in wishlist or add to cart.",
};
