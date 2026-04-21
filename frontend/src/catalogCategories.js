/**
 * Canonical shop garment types (matches backend `Product.ProductType`).
 * Used for category filter dropdown and search routing.
 */
export const CATALOG_CATEGORIES = [
  { type: "tshirt", label: "T-shirt" },
  { type: "hoodie", label: "Hoodie" },
  { type: "pant", label: "Pant" },
  { type: "shirt", label: "Shirt" },
  { type: "skirt", label: "Skirt" },
  { type: "jacket", label: "Jacket" },
];

export const CATALOG_CATEGORY_SLUGS = CATALOG_CATEGORIES.map((c) => c.type);

/** Normalize user/search text to a category slug, or null. */
export function matchCategorySlug(raw) {
  const t = String(raw || "").trim().toLowerCase();
  if (!t) return null;
  if (CATALOG_CATEGORY_SLUGS.includes(t)) return t;
  if (t === "t-shirt" || t === "tee" || t === "tees") return "tshirt";
  if (t === "hoodies") return "hoodie";
  if (t === "pants" || t === "trousers") return "pant";
  if (t === "shirts") return "shirt";
  if (t === "skirts") return "skirt";
  if (t === "jackets") return "jacket";
  return null;
}
