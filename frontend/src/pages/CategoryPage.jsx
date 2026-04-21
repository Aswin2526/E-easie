import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchProducts,
  addToCart,
  addToWishlist,
  fetchWishlist,
  removeFromWishlist,
  getStoredToken,
} from "../api";
import { formatNPR } from "../currency";
import { getProductImageSrc, getProductImageStyle } from "../productImages";
import { BUY_NOW_OUT_OF_STOCK_TOAST, isProductOutOfStock } from "../productStock";
import ProductStarsLine from "../components/ProductStarsLine";
import ShopPoliciesCallout from "../components/ShopPoliciesCallout";
import { productSpecsSummaryLine } from "../components/ProductSpecsPanel";
import { useNotify } from "../contexts/NotifyContext";
import { CATALOG_CATEGORIES, CATALOG_CATEGORY_SLUGS } from "../catalogCategories";

const CATEGORY_SELECTIONS_KEY = "categorySelections";

/** NPR from API (number or decimal string). */
function parseCatalogPrice(product) {
  const raw = product?.base_price;
  if (raw == null || raw === "") return NaN;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = parseFloat(String(raw).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function matchesPriceBand(priceN, band) {
  if (!Number.isFinite(priceN)) return false;
  const b = String(band || "all").trim().toLowerCase();
  if (!b || b === "all") return true;
  if (b === "under-500" || b === "0-499") return priceN < 500;
  if (b === "500-999") return priceN >= 500 && priceN < 1000;
  if (b === "1000-plus" || b === "1000+" || b === "gte-1000" || b === "1000plus") return priceN >= 1000;
  return true;
}

/** Map URL param to a controlled <select> value (supports older bookmarked links). */
function priceParamToSelectValue(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (!v || v === "all") return "all";
  if (v === "0-499" || v === "under-500") return "under-500";
  if (v === "500-999") return "500-999";
  if (v === "1000-plus" || v === "1000+" || v === "gte-1000" || v === "1000plus") return "1000-plus";
  return "all";
}

function sortProductList(items, sortKey) {
  const out = [...items];
  switch (sortKey) {
    case "price_asc":
      out.sort((a, b) => parseCatalogPrice(a) - parseCatalogPrice(b));
      break;
    case "price_desc":
      out.sort((a, b) => parseCatalogPrice(b) - parseCatalogPrice(a));
      break;
    case "bestseller":
      out.sort((a, b) => (Number(b.units_sold) || 0) - (Number(a.units_sold) || 0));
      break;
    case "rating":
      out.sort((a, b) => (Number(b.rating_average) || 0) - (Number(a.rating_average) || 0));
      break;
    default:
      out.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }));
  }
  return out;
}

export default function CategoryPage() {
  const toast = useNotify();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectionByType, setSelectionByType] = useState(() => {
    try {
      const raw = window.localStorage.getItem(CATEGORY_SELECTIONS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [wishlistByProductId, setWishlistByProductId] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProducts();
        if (!cancelled) setProducts(Array.isArray(data) ? data : data.results || []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load products.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!getStoredToken()) {
      setWishlistByProductId({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWishlist();
        if (cancelled) return;
        const items = Array.isArray(data) ? data : data.results || [];
        const next = {};
        for (const item of items) {
          if (item?.product) next[String(item.product)] = item.id;
        }
        setWishlistByProductId(next);
      } catch {
        if (!cancelled) setWishlistByProductId({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const haystack = `${p.name || ""} ${p.product_type_display || p.product_type || ""}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    const rawCat = (searchParams.get("cat") || "").trim().toLowerCase();
    const cat = rawCat && CATALOG_CATEGORY_SLUGS.includes(rawCat) ? rawCat : "all";
    if (cat !== "all") {
      list = list.filter((p) => String(p.product_type || "").trim().toLowerCase() === cat);
    }
    const priceBand = (searchParams.get("price") || "all").trim();
    if (priceBand !== "all") {
      list = list.filter((p) => matchesPriceBand(parseCatalogPrice(p), priceBand));
    }
    return list;
  }, [products, searchParams]);

  const byType = useMemo(() => {
    const sort = (searchParams.get("sort") || "name").trim();
    const map = {};
    for (const p of filteredProducts) {
      const key = p.product_type_display || p.product_type || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    for (const k of Object.keys(map)) {
      map[k] = sortProductList(map[k], sort);
    }
    return map;
  }, [filteredProducts, searchParams]);

  const categorySectionOrder = useMemo(() => CATALOG_CATEGORIES.map((c) => c.type), []);

  const sortedSectionEntries = useMemo(() => {
    const entries = Object.entries(byType);
    const rank = (entry) => {
      const slug = String(entry[1][0]?.product_type || "").toLowerCase();
      const idx = categorySectionOrder.indexOf(slug);
      return idx === -1 ? 999 : idx;
    };
    entries.sort((a, b) => {
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      return String(a[0]).localeCompare(String(b[0]), undefined, { sensitivity: "base" });
    });
    return entries;
  }, [byType, categorySectionOrder]);

  const categorySelectValue = useMemo(() => {
    const raw = (searchParams.get("cat") || "").trim().toLowerCase();
    if (raw && CATALOG_CATEGORY_SLUGS.includes(raw)) return raw;
    return "all";
  }, [searchParams]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    const rawCat = (searchParams.get("cat") || "").trim().toLowerCase();
    if (rawCat && CATALOG_CATEGORY_SLUGS.includes(rawCat)) n += 1;
    if ((searchParams.get("price") || "all") !== "all") n += 1;
    if ((searchParams.get("sort") || "name") !== "name") n += 1;
    return n;
  }, [searchParams]);

  function setParam(key, value, emptyValues) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const isEmpty = emptyValues.includes(value);
        if (isEmpty) next.delete(key);
        else next.set(key, String(value));
        return next;
      },
      { replace: true },
    );
  }

  function clearProductFilters() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        ["cat", "price", "stars", "sort", "q"].forEach((k) => next.delete(k));
        return next;
      },
      { replace: true },
    );
  }

  function handleCategoryFilterChange(e) {
    const v = (e.target.value || "all").trim().toLowerCase();
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!v || v === "all") {
          next.delete("cat");
        } else {
          next.set("cat", v);
          next.delete("q");
        }
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    window.localStorage.setItem(CATEGORY_SELECTIONS_KEY, JSON.stringify(selectionByType));
  }, [selectionByType]);

  function computeNextSelection(productType, clickedId) {
    const sid = String(clickedId);
    const current = selectionByType[productType] || {};
    const currentPrimary = String(current.primaryId || "");
    const currentSecondary = String(current.secondaryId || "");

    if (!currentPrimary) return { primaryId: sid, secondaryId: "" };
    if (currentPrimary === sid) {
      return { primaryId: currentPrimary, secondaryId: currentSecondary };
    }
    return { primaryId: sid, secondaryId: currentPrimary };
  }

  function handleCustomizeClick(productType, productId) {
    const next = computeNextSelection(productType, productId);
    setSelectionByType((prev) => ({ ...prev, [productType]: next }));
  }

  function customizeLink(productType, productId) {
    const next = computeNextSelection(productType, productId);
    const q = new URLSearchParams({
      category: productType,
      product: next.primaryId,
      primary: next.primaryId,
    });
    if (next.secondaryId) q.set("secondary", next.secondaryId);
    return `/customize?${q.toString()}`;
  }

  function productDetailPath(p) {
    const key = (p.slug && String(p.slug).trim()) || String(p.id);
    return `/product/${encodeURIComponent(key)}`;
  }

  async function handleAddToCart(p, e) {
    e.preventDefault();
    if (!getStoredToken()) {
      toast.warning("Sign in required", "Please sign in to add items to your cart.");
      return;
    }
    try {
      await addToCart({ product: p.id, quantity: 1 });
      window.dispatchEvent(new Event("cart-updated"));
      toast.success({ title: "Added to cart" });
    } catch (err) {
      toast.error("Could not add to cart", err.message || "Something went wrong. Please try again.");
    }
  }

  async function handleWishlist(p, e) {
    e.preventDefault();
    if (!getStoredToken()) {
      toast.warning("Sign in required", "Please sign in to save items to your wishlist.");
      return;
    }
    const key = String(p.id);
    const existingWishlistId = wishlistByProductId[key];
    try {
      if (existingWishlistId) {
        await removeFromWishlist(existingWishlistId);
        setWishlistByProductId((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        toast.info("Wishlist updated", `${p.name} was removed from your wishlist.`);
      } else {
        const created = await addToWishlist(p.id);
        setWishlistByProductId((prev) => ({ ...prev, [key]: created?.id || true }));
        toast.success("Saved to wishlist", `${p.name} — view it anytime under Wishlist.`);
      }
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      toast.error("Wishlist", err.message || "Could not update your wishlist.");
    }
  }

  function handleBuyNow(p, e) {
    e.preventDefault();
    if (isProductOutOfStock(p)) {
      toast.warning(BUY_NOW_OUT_OF_STOCK_TOAST);
      return;
    }
    if (!getStoredToken()) {
      toast.warning("Sign in required", "Please sign in to place an order.");
      return;
    }
    navigate(`/checkout/buy?product=${encodeURIComponent(p.id)}`);
  }

  if (loading) {
    return (
      <div style={page.centered}>
        <p>Loading categories…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div style={page.centered}>
        <p style={{ color: "#b91c1c" }}>{error}</p>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
          Start Django: <code>python manage.py runserver</code> then refresh.
        </p>
      </div>
    );
  }

  return (
    <div style={page.wrap}>
      <header style={page.header}>
        <h1 style={page.title}>Shop by category</h1>
        <p style={page.sub}>
          Every item below supports <strong>Customize</strong>, <strong>Add to cart</strong>, and{" "}
          <strong>Buy now</strong> (shipping + eSewa). Customize opens with each product&apos;s original fabric and
          colors; other fabric <strong>+25%</strong>, other colors <strong>+20%</strong> at payment.
        </p>
        {(searchParams.get("q") || "").trim() ? (
          <p style={page.searchInfo}>
            Showing results for: <strong>{searchParams.get("q")}</strong>
          </p>
        ) : (searchParams.get("cat") || "").trim() &&
          CATALOG_CATEGORY_SLUGS.includes((searchParams.get("cat") || "").trim().toLowerCase()) ? (
          <p style={page.searchInfo}>
            Category:{" "}
            <strong>
              {CATALOG_CATEGORIES.find((c) => c.type === (searchParams.get("cat") || "").trim().toLowerCase())?.label ||
                searchParams.get("cat")}
            </strong>
          </p>
        ) : null}
        <ShopPoliciesCallout />
      </header>

      <section style={page.filterBar} aria-label="Product filters">
        <div style={page.filterRow}>
          <div style={page.filterGroup}>
            <span style={page.filterLabel}>Category</span>
            <select
              value={categorySelectValue}
              onChange={handleCategoryFilterChange}
              style={page.filterSelect}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {CATALOG_CATEGORIES.map(({ type, label }) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div style={page.filterGroup}>
            <span style={page.filterLabel}>Price</span>
            <select
              value={priceParamToSelectValue(searchParams.get("price"))}
              onChange={(e) => setParam("price", e.target.value, ["all"])}
              style={page.filterSelect}
              aria-label="Filter by price"
            >
              <option value="all">All prices</option>
              <option value="under-500">Under Rs. 500</option>
              <option value="500-999">Rs. 500 – 999</option>
              <option value="1000-plus">Rs. 1,000+</option>
            </select>
          </div>
          <div style={page.filterGroup}>
            <span style={page.filterLabel}>Sort</span>
            <select
              value={searchParams.get("sort") || "name"}
              onChange={(e) => setParam("sort", e.target.value, ["name"])}
              style={page.filterSelect}
              aria-label="Sort products"
            >
              <option value="name">Name (A–Z)</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="bestseller">Most bought</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>
          {activeFilterCount > 0 ? (
            <button type="button" style={page.filterClear} onClick={clearProductFilters}>
              Clear filters ({activeFilterCount})
            </button>
          ) : null}
        </div>
      </section>

      {sortedSectionEntries.length === 0 ? (
        <p style={page.emptyText}>No products match your filters or search.</p>
      ) : null}

      {sortedSectionEntries.map(([typeName, items]) => (
        <section key={typeName} style={page.section}>
          <h2 style={page.typeHeading}>{typeName}</h2>
          <div style={page.grid}>
            {items.map((p) => {
              return (
              <article key={p.id} style={page.card}>
                <div style={page.imgWrap}>
                  <button
                    type="button"
                    style={page.wishlistEmojiBtn}
                    onClick={(e) => handleWishlist(p, e)}
                    title="Add to Wishlist"
                    aria-label={`Add ${p.name} to wishlist`}
                  >
                    {wishlistByProductId[String(p.id)] ? "❤️" : "♡"}
                  </button>
                  <Link
                    to={productDetailPath(p)}
                    style={page.imgLink}
                    aria-label={`View details for ${p.name}`}
                  >
                    <img
                      src={getProductImageSrc(p)}
                      alt={p.name}
                      style={{ ...page.img, ...getProductImageStyle(p) }}
                    />
                  </Link>
                </div>
                <div style={page.cardBody}>
                  <Link to={productDetailPath(p)} style={page.cardTitleLink}>
                    <h3 style={page.cardTitle}>{p.name}</h3>
                  </Link>
                  <p style={page.price}>{formatNPR(p.base_price)}</p>
                  <ProductStarsLine average={p.rating_average} count={p.rating_count} />
                  {productSpecsSummaryLine(p) ? (
                    <p style={page.materialTeaser} title={p.material}>
                      {productSpecsSummaryLine(p)}
                    </p>
                  ) : null}
                  <div style={page.cardActions}>
                    <Link
                      to={customizeLink(p.product_type, p.id)}
                      onClick={() => handleCustomizeClick(p.product_type, p.id)}
                      style={page.cta}
                    >
                      Customize
                    </Link>
                    <div style={page.cartBuyRow}>
                      <button
                        style={page.addToCartBtn}
                        onClick={(e) => handleAddToCart(p, e)}
                        title="Add to Cart"
                        type="button"
                      >
                        🛒 Add to cart
                      </button>
                      <button
                        style={page.buyNowBtn}
                        onClick={(e) => handleBuyNow(p, e)}
                        title="Buy Now"
                        type="button"
                      >
                        Buy now
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

const page = {
  wrap: { padding: "40px", maxWidth: "1200px", margin: "0 auto" },
  centered: { padding: "60px 24px", textAlign: "center" },
  header: { marginBottom: "32px" },
  filterBar: {
    marginBottom: "28px",
    padding: "14px 16px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e8e8ec",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: "14px 20px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "min(160px, 100%)",
  },
  filterLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  filterSelect: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "8px 10px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f172a",
    background: "#fff",
    fontFamily: "inherit",
    cursor: "pointer",
    minWidth: "0",
    width: "100%",
    maxWidth: "220px",
  },
  filterClear: {
    marginLeft: "auto",
    alignSelf: "center",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "inherit",
    padding: "8px 12px",
    cursor: "pointer",
  },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a1a2e" },
  sub: { marginTop: "10px", color: "#555", maxWidth: "560px" },
  searchInfo: { marginTop: "8px", color: "#1a1a2e", fontSize: "14px" },
  emptyText: { marginTop: "20px", color: "#666", fontSize: "15px" },
  section: { marginBottom: "48px" },
  typeHeading: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#1a1a2e",
    borderBottom: "1px solid #eee",
    paddingBottom: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "24px",
    alignItems: "stretch",
  },
  card: {
    background: "#fafafa",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  imgWrap: {
    height: "220px",
    background: "#e5e5e5",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imgLink: {
    display: "block",
    width: "100%",
    height: "100%",
    lineHeight: 0,
    color: "inherit",
    textDecoration: "none",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  cardTitleLink: {
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },
  cardBody: {
    padding: "16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    lineHeight: 1.35,
    minHeight: "2.7em",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  price: {
    color: "#444",
    margin: "0 0 8px 0",
    lineHeight: 1.35,
    minHeight: "1.35em",
  },
  materialTeaser: {
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.45,
    margin: "0 0 8px 0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardActions: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingTop: "4px",
  },
  cartBuyRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    width: "100%",
  },
  addToCartBtn: {
    width: "100%",
    padding: "10px 12px",
    background: "#fff6df",
    border: "1px solid #f0e1b7",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "700",
    color: "#1f2937",
  },
  buyNowBtn: {
    width: "100%",
    padding: "10px 12px",
    background: "#e7f8ea",
    color: "#1f2937",
    border: "1px solid #c8e9cd",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "700",
  },
  cta: {
    display: "block",
    textAlign: "center",
    padding: "10px 16px",
    background: "#1a1a2e",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
  },
  wishlistEmojiBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "22px",
    lineHeight: 1,
    padding: 0,
    zIndex: 1,
  }
};
