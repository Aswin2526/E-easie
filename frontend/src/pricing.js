/**
 * Matches backend `Customization.unit_price_for_order`:
 * ×1.25 when fabric differs from the product's original `default_fabric`,
 * ×1.20 when part colors differ from merged catalog defaults (original look).
 */
import { catalogDefaultPartColors, mergePartColorDefaults } from "./catalogColorDefaults";
import { normalizeHexColor } from "./colorUtils";

const FABRIC_MARKUP = 0.25;
const NON_DEFAULT_COLOR_MARKUP = 0.2;

export function fabricMarkupApplies(fabric, defaultFabric) {
  const f = String(fabric || "").toLowerCase();
  const d = String(defaultFabric || "cotton").toLowerCase() || "cotton";
  return f !== d;
}

/** Merged catalog part colors (same as customize UI / `Product.effective_catalog_part_colors`). */
export function effectiveCatalogPartColors(product, categoryFallback = "") {
  if (!product) return {};
  const slug = product.slug || "";
  const ptype = product.product_type || categoryFallback || "";
  const inferred = catalogDefaultPartColors(slug, ptype);
  return mergePartColorDefaults(inferred, product.default_part_colors);
}

export function nonDefaultPartColorsMarkup(partColors, catalogRef) {
  if (!catalogRef || typeof catalogRef !== "object") return false;
  const actual = partColors && typeof partColors === "object" ? partColors : {};
  for (const key of Object.keys(catalogRef)) {
    const def = normalizeHexColor(catalogRef[key]);
    if (!def) continue;
    if (!(key in actual)) continue;
    const an = normalizeHexColor(String(actual[key]));
    if (!an || an !== def) return true;
  }
  return false;
}

/**
 * @param {string|number} basePrice
 * @param {string} fabric
 * @param {{ partColors?: object, catalogReferencePartColors?: object|null, defaultFabric?: string }} [opts]
 */
export function customizationUnitPrice(basePrice, fabric, opts = {}) {
  const {
    partColors = {},
    catalogReferencePartColors = null,
    defaultFabric = "cotton",
  } = opts;
  const base = Number(basePrice);
  if (Number.isNaN(base)) return 0;
  let mult = 1;
  if (fabricMarkupApplies(fabric, defaultFabric)) mult *= 1 + FABRIC_MARKUP;
  if (
    catalogReferencePartColors &&
    nonDefaultPartColorsMarkup(partColors, catalogReferencePartColors)
  ) {
    mult *= 1 + NON_DEFAULT_COLOR_MARKUP;
  }
  return Math.round(base * mult * 100) / 100;
}
