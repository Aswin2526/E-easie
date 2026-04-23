import { normalizeHexColor } from "./colorUtils";

/**
 * Fallback default part colors when API `default_part_colors` is empty.
 * Mirrors backend `shop/default_part_colors.py` so each selected product gets a distinct base color.
 */

const SPECIAL_SLUG_COLORS = {
  "pastel-colorblock-button-down-shirt": {
    body: "#f7f4ef",
    sleeves: "#b8d4ec",
    collar: "#f3c4d3",
  },
  "hooded-denim-hybrid-jacket": { body: "#94a3b8", sleeves: "#cbd5e1" },
  "short-sleeve-textured-denim-jacket": { body: "#64748b", sleeves: "#64748b" },
  "adidas-3stripes-khaki-hooded": { body: "#c4b896", sleeves: "#a89b7a" },
};

function mainBodyHexFromSlug(slug) {
  const s = String(slug || "").toLowerCase();
  if (s.includes("off-white") || s.includes("offwhite")) return "#f2f0e8";
  if (s.includes("cream")) return "#f0ebe3";
  if (s.includes("white") && !s.includes("black")) return "#f5f5f5";
  if (s.includes("black") || s.includes("charcoal")) return "#1a1a1a";
  if (s.includes("yellow") || s.includes("gold")) return "#e8c547";
  if (s.includes("mint")) return "#99f6e4";
  if (s.includes("dusty") && s.includes("pink")) return "#e8b4bc";
  if (s.includes("pink") || s.includes("rose")) return "#fbcfe8";
  if (s.includes("lavender")) return "#ddd6fe";
  if (s.includes("taupe") || s.includes("greige")) return "#bfa98a";
  if (s.includes("heather")) return "#9ca3af";
  if (s.includes("light-grey") || s.includes("light-gray")) return "#d1d5db";
  if (s.includes("grey") || s.includes("gray")) return "#9ca3af";
  if (s.includes("beige")) return "#d6c4a8";
  if (s.includes("khaki")) return "#c4b896";
  if (s.includes("olive")) return "#5c6644";
  if (s.includes("navy")) return "#1e2a4a";
  if (s.includes("sky-blue") || s.includes("light-blue")) return "#93c5fd";
  if (s.includes("blue") || s.includes("gauze")) return "#3b82f6";
  if (s.includes("brown")) return "#8b5a3b";
  if (s.includes("linen")) return "#e5dcc8";
  if (s.includes("denim") || s.includes("jean")) return "#576275";
  if (s.includes("plaid")) return "#fce7f3";
  if (s.includes("legging")) return "#111827";
  return "#2d2d2d";
}

/**
 * @param {string} slug
 * @param {string} productType e.g. "tshirt", "shirt"
 * @returns {Record<string, string>}
 */
export function catalogDefaultPartColors(slug, productType) {
  const s = String(slug || "");
  const type = String(productType || "").toLowerCase();
  if (SPECIAL_SLUG_COLORS[s]) {
    return { ...SPECIAL_SLUG_COLORS[s] };
  }
  const body = mainBodyHexFromSlug(s);
  if (type === "pant") {
    return { front: body, back: body };
  }
  if (type === "skirt") {
    return { front: body, back: body, side: body };
  }
  if (type === "hoodie" || type === "jacket") {
    return { body, sleeves: body };
  }
  if (type === "tshirt") {
    return { body };
  }
  return { body, sleeves: body, collar: body };
}

/** API values override inferred catalog defaults when present and valid hex. */
export function mergePartColorDefaults(inferred, api) {
  const out = { ...inferred };
  const a = api && typeof api === "object" && !Array.isArray(api) ? api : {};
  for (const k of Object.keys(a)) {
    const v = normalizeHexColor(a[k]);
    if (v) out[k] = v;
  }
  return out;
}
