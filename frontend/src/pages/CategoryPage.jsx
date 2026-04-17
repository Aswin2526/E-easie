import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchProducts,
  addToCart,
  addToWishlist,
  fetchWishlist,
  removeFromWishlist,
  getStoredToken,
  placeOrder,
} from "../api";
import { formatNPR } from "../currency";
import { getProductImageSrc } from "../productImages";
import ProductStarsLine from "../components/ProductStarsLine";
import ShopPoliciesCallout from "../components/ShopPoliciesCallout";
import { useNotify } from "../contexts/NotifyContext";

const CATEGORY_SELECTIONS_KEY = "categorySelections";

export default function CategoryPage() {
  const toast = useNotify();
  const [searchParams] = useSearchParams();
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

  const byType = useMemo(() => {
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const map = {};
    for (const p of products) {
      if (q) {
        const haystack = `${p.name || ""} ${p.product_type_display || p.product_type || ""}`.toLowerCase();
        if (!haystack.includes(q)) continue;
      }
      const key = p.product_type_display || p.product_type || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [products, searchParams]);

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

  async function handleBuyNow(p, e) {
    e.preventDefault();
    if (!getStoredToken()) {
      toast.warning("Sign in required", "Please sign in to place an order.");
      return;
    }
    const shippingAddress = window.prompt("Enter shipping address:");
    if (!shippingAddress || !shippingAddress.trim()) return;

    const payload = {
      product: p.id,
      quantity: 1,
      shipping_address: shippingAddress.trim(),
    };
    try {
      await placeOrder(payload);
      toast.success(
        "Order placed",
        `${p.name} — Track status anytime from Track Order in the menu.`
      );
    } catch (err) {
      toast.error("Order failed", err.message || "We could not place your order. Please try again.");
    }
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
          Pick a base garment, then customize fabric, colors, and details.
        </p>
        {(searchParams.get("q") || "").trim() ? (
          <p style={page.searchInfo}>
            Showing results for: <strong>{searchParams.get("q")}</strong>
          </p>
        ) : null}
        <ShopPoliciesCallout />
      </header>

      {Object.entries(byType).length === 0 ? (
        <p style={page.emptyText}>No products match your search.</p>
      ) : null}

      {Object.entries(byType).map(([typeName, items]) => (
        <section key={typeName} style={page.section}>
          <h2 style={page.typeHeading}>{typeName}</h2>
          <div style={page.grid}>
            {items.map((p) => (
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
                      style={page.img}
                    />
                  </Link>
                </div>
                <div style={page.cardBody}>
                  <Link to={productDetailPath(p)} style={page.cardTitleLink}>
                    <h3 style={page.cardTitle}>{p.name}</h3>
                  </Link>
                  <p style={page.price}>{formatNPR(p.base_price)}</p>
                  <ProductStarsLine average={p.rating_average} count={p.rating_count} />
                  <div style={page.cardActions}>
                    <Link
                      to={customizeLink(p.product_type, p.id)}
                      onClick={() => handleCustomizeClick(p.product_type, p.id)}
                      style={page.cta}
                    >
                      Customize
                    </Link>
                    <div style={page.cartBuyRow}>
                      <button style={page.addToCartBtn} onClick={(e) => handleAddToCart(p, e)} title="Add to Cart">
                        🛒 Add to cart
                      </button>
                      <button style={page.buyNowBtn} onClick={(e) => handleBuyNow(p, e)} title="Buy Now">
                        Buy now
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
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
