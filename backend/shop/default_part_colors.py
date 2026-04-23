"""Default part_colors for catalog products (customize UI). Used by seed commands."""

from __future__ import annotations

SPECIAL_SLUG_COLORS: dict[str, dict[str, str]] = {
    "pastel-colorblock-button-down-shirt": {
        "body": "#f7f4ef",
        "sleeves": "#b8d4ec",
        "collar": "#f3c4d3",
    },
    "hooded-denim-hybrid-jacket": {"body": "#94a3b8", "sleeves": "#cbd5e1"},
    "short-sleeve-textured-denim-jacket": {"body": "#64748b", "sleeves": "#64748b"},
    "adidas-3stripes-khaki-hooded": {"body": "#c4b896", "sleeves": "#a89b7a"},
}


def _main_body_hex(slug: str) -> str:
    s = slug.lower()
    if "off-white" in s or "offwhite" in s:
        return "#f2f0e8"
    if "cream" in s:
        return "#f0ebe3"
    if "white" in s and "black" not in s:
        return "#f5f5f5"
    if "black" in s or "charcoal" in s:
        return "#1a1a1a"
    if "yellow" in s or "gold" in s:
        return "#e8c547"
    if "mint" in s:
        return "#99f6e4"
    if "dusty" in s and "pink" in s:
        return "#e8b4bc"
    if "pink" in s or "rose" in s:
        return "#fbcfe8"
    if "lavender" in s:
        return "#ddd6fe"
    if "taupe" in s or "greige" in s:
        return "#bfa98a"
    if "heather" in s:
        return "#9ca3af"
    if "light-grey" in s or "light-gray" in s:
        return "#d1d5db"
    if "grey" in s or "gray" in s:
        return "#9ca3af"
    if "beige" in s:
        return "#d6c4a8"
    if "khaki" in s:
        return "#c4b896"
    if "olive" in s:
        return "#5c6644"
    if "navy" in s:
        return "#1e2a4a"
    if "sky-blue" in s or "light-blue" in s:
        return "#93c5fd"
    if "blue" in s or "gauze" in s:
        return "#3b82f6"
    if "brown" in s:
        return "#8b5a3b"
    if "linen" in s:
        return "#e5dcc8"
    if "denim" in s or "jean" in s:
        return "#576275"
    if "plaid" in s:
        return "#fce7f3"
    if "legging" in s:
        return "#111827"
    return "#2d2d2d"


def default_part_colors_for_seed(slug: str, product_type: str) -> dict[str, str]:
    """Return part name -> hex for Product.default_part_colors."""
    if slug in SPECIAL_SLUG_COLORS:
        return dict(SPECIAL_SLUG_COLORS[slug])
    body = _main_body_hex(slug)
    if product_type == "pant":
        return {"front": body, "back": body}
    if product_type == "skirt":
        return {"front": body, "back": body, "side": body}
    if product_type in ("hoodie", "jacket"):
        return {"body": body, "sleeves": body}
    if product_type == "tshirt":
        return {"body": body}
    return {"body": body, "sleeves": body, "collar": body}


def default_fabric_for_seed(slug: str) -> str:
    """Catalog fabric default: denim for denim/jean slugs, else cotton."""
    s = (slug or "").lower()
    if "denim" in s or "jean" in s:
        return "denim"
    return "cotton"
