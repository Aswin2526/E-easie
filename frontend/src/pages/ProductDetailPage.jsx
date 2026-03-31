import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addToCart,
  addToWishlist,
  fetchProductByIdOrSlug,
  fetchWishlist,
  getStoredToken,
  removeFromWishlist,
} from "../api";
import { formatNPR } from "../currency";
import { getTrendingShowcase } from "../data/trendingShowcases";
import { getProductImageSrc, getProductImageStyle } from "../productImages";
import { BUY_NOW_OUT_OF_STOCK_TOAST, isProductOutOfStock } from "../productStock";
import ProductStarsLine from "../components/ProductStarsLine";
import ProductRatingsPanel from "../components/ProductRatingsPanel";
import ShopPoliciesCallout from "../components/ShopPoliciesCallout";
import ProductSpecsPanel from "../components/ProductSpecsPanel";
import { useNotify } from "../contexts/NotifyContext";

export default function ProductDetailPage() {
  const toast = useNotify();
  const navigate = useNavigate();
  const { slugOrId } = useParams();
  const showcase = useMemo(() => getTrendingShowcase(slugOrId), [slugOrId]);

  const [catalogProduct, setCatalogProduct] = useState(null);
  const [pending, setPending] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [wishlistEntryId, setWishlistEntryId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setPending(true);
    setFetchError(null);
    setCatalogProduct(null);

    const slug = showcase?.catalogSlug ?? slugOrId;

    (async () => {
      try {
        const p = await fetchProductByIdOrSlug(slug);
        if (!cancelled) setCatalogProduct(p);
      } catch (e) {
        if (!cancelled) {
          setCatalogProduct(null);
          setFetchError(e.message || "Could not load product.");
        }
      } finally {
        if (!cancelled) setPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slugOrId, showcase?.catalogSlug]);

  useEffect(() => {
    if (!catalogProduct?.id || !getStoredToken()) {
      setWishlistEntryId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWishlist();
        if (cancelled) return;
        const items = Array.isArray(data) ? data : data.results || [];
        const hit = items.find((w) => String(w.product) === String(catalogProduct.id));
        setWishlistEntryId(hit?.id || null);
      } catch {
        if (!cancelled) setWishlistEntryId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalogProduct?.id]);

  function customizeHref(p) {
    const q = new URLSearchParams({
      category: showcase?.showcaseSlug ? "trending" : p.product_type,
      product: String(p.id),
      primary: String(p.id),
    });
    if (showcase?.showcaseSlug) {
      q.set("showcase", showcase.showcaseSlug);
    }
    return `/customize?${q.toString()}`;
  }

  async function handleAddToCart(p) {
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

  async function handleWishlist(p, displayName) {
    if (!getStoredToken()) {
      toast.warning("Sign in required", "Please sign in to save items to your wishlist.");
      return;
    }
    try {
      if (wishlistEntryId) {
        await removeFromWishlist(wishlistEntryId);
        setWishlistEntryId(null);
        toast.info("Wishlist updated", `${displayName} was removed from your wishlist.`);
      } else {
        const created = await addToWishlist(p.id);
        setWishlistEntryId(created?.id ?? null);
        toast.success({ title: displayName });
      }
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      toast.error("Wishlist", err.message || "Could not update your wishlist.");
    }
  }

  function handleBuyNow(p) {
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

  if (pending && !showcase) {
    return (
      <div style={page.centered}>
        <p>Loading product…</p>
      </div>
    );
  }

  if (!showcase && (fetchError || !catalogProduct)) {
    return (
      <div style={page.centered}>
        <p style={{ color: "#b91c1c" }}>{fetchError || "Product not found."}</p>
        <p style={{ marginTop: "16px" }}>
          <Link to="/category" style={page.backLink}>
            Browse shop
          </Link>
          {" · "}
          <Link to="/" style={page.backLink}>
            Home
          </Link>
        </p>
      </div>
    );
  }

  const loggedIn = Boolean(getStoredToken());
  const isTrending = Boolean(showcase);

  const displayTitle = isTrending ? showcase.title : catalogProduct.name;
  const displayType = isTrending ? showcase.typeLabel : catalogProduct.product_type_display || catalogProduct.product_type;
  const displayPrice = isTrending ? showcase.price : catalogProduct.base_price;
  const displayDescription = isTrending ? showcase.description : catalogProduct.description;
  const imgSrc = isTrending ? showcase.img : getProductImageSrc(catalogProduct);
  const imgAlt = isTrending ? showcase.alt : catalogProduct.name;
  const ctaProduct = catalogProduct;
  const ctaDisabled = !catalogProduct;
  const orderLabel = isTrending ? showcase.title : catalogProduct.name;

  return (
    <div style={page.wrap}>
      <nav style={page.breadcrumb}>
        <Link to="/">Home</Link>
        <span style={page.crumbSep}> / </span>
        {isTrending ? (
          <>
            <Link to="/#trending">Trending styles</Link>
            <span style={page.crumbSep}> / </span>
          </>
        ) : (
          <>
            <Link to="/category">Shop</Link>
            <span style={page.crumbSep}> / </span>
          </>
        )}
        <span style={page.crumbCurrent}>{displayTitle}</span>
      </nav>

      {isTrending && pending ? (
        <p style={page.inlineNote}>Loading customization options…</p>
      ) : null}

      <div style={page.grid}>
        <div style={page.imageCol}>
          <div style={page.imgWrap}>
            <img
              src={imgSrc}
              alt={imgAlt}
              style={
                !isTrending && catalogProduct
                  ? { ...page.img, ...getProductImageStyle(catalogProduct) }
                  : page.img
              }
            />
            {ctaProduct ? (
              <button
                type="button"
                style={{
                  ...page.wishlistIconBtn,
                  ...(ctaDisabled ? page.btnDisabled : {}),
                }}
                disabled={ctaDisabled}
                onClick={() => ctaProduct && handleWishlist(ctaProduct, orderLabel)}
                title={wishlistEntryId ? "Remove from wishlist" : "Save to wishlist"}
                aria-label={wishlistEntryId ? "Remove from wishlist" : "Save to wishlist"}
              >
                {wishlistEntryId ? "❤️" : "♡"}
              </button>
            ) : null}
          </div>
        </div>
        <div style={page.detailCol}>
          <p style={page.typeLabel}>{displayType}</p>
          <h1 style={page.title}>{displayTitle}</h1>
          <p style={page.price}>{formatNPR(displayPrice)}</p>
          {isTrending ? (
            <p style={page.ratingNote}>
              You can post a review after an order for this product is delivered (from the product page or My Profile →
              Purchased orders).
            </p>
          ) : (
            <ProductStarsLine average={catalogProduct.rating_average} count={catalogProduct.rating_count} />
          )}
          {displayDescription ? <p style={page.description}>{displayDescription}</p> : null}
          {catalogProduct ? <ProductSpecsPanel product={catalogProduct} priceText={null} showStock /> : null}
          <ShopPoliciesCallout />

          {isTrending ? (
            <p style={page.ctaHint}>
              Add to cart, buy now, and customize use a matching base garment from our catalog (fabric and fit options in the
              designer).
            </p>
          ) : null}

          <div style={page.actions}>
            {ctaProduct ? (
              <Link to={customizeHref(ctaProduct)} style={page.ctaPrimary}>
                Customize
              </Link>
            ) : (
              <span style={{ ...page.ctaPrimary, opacity: 0.5, pointerEvents: "none" }}>Customize</span>
            )}
            <div style={page.row2}>
              <button
                type="button"
                style={{
                  ...page.btnCart,
                  ...(ctaDisabled ? page.btnDisabled : {}),
                }}
                disabled={ctaDisabled}
                onClick={() => ctaProduct && handleAddToCart(ctaProduct)}
              >
                Add to cart
              </button>
              <button
                type="button"
                style={{
                  ...page.btnBuy,
                  ...(ctaDisabled ? page.btnDisabled : {}),
                }}
                disabled={ctaDisabled}
                onClick={() => ctaProduct && handleBuyNow(ctaProduct)}
              >
                Buy now
              </button>
            </div>
          </div>

          {!isTrending && catalogProduct ? (
            <ProductRatingsPanel productId={catalogProduct.id} isLoggedIn={loggedIn} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

const page = {
  wrap: { padding: "40px 24px", maxWidth: "1100px", margin: "0 auto" },
  centered: { padding: "60px 24px", textAlign: "center" },
  inlineNote: { fontSize: "13px", color: "#64748b", marginBottom: "12px" },
  breadcrumb: { fontSize: "13px", color: "#64748b", marginBottom: "24px" },
  crumbSep: { color: "#94a3b8" },
  crumbCurrent: { color: "#1a1a2e", fontWeight: 600 },
  backLink: { color: "#1a1a2e", fontWeight: 600 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "40px",
    alignItems: "start",
  },
  imageCol: {
    minWidth: 0,
    alignSelf: "start",
    position: "sticky",
    top: "88px",
    zIndex: 1,
  },
  imgWrap: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    aspectRatio: "4 / 5",
    maxHeight: "520px",
  },
  wishlistIconBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "1px solid rgba(15, 23, 42, 0.12)",
    background: "rgba(255, 255, 255, 0.92)",
    boxShadow: "0 2px 12px rgba(15, 23, 42, 0.12)",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    zIndex: 2,
  },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  detailCol: { minWidth: 0 },
  typeLabel: {
    margin: "0 0 8px 0",
    fontSize: "13px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  title: { margin: "0 0 12px 0", fontSize: "28px", fontWeight: 800, color: "#1a1a2e", lineHeight: 1.2 },
  price: { margin: "0 0 12px 0", fontSize: "18px", color: "#334155", fontWeight: 700 },
  ratingNote: { margin: "0 0 8px 0", fontSize: "14px", color: "#64748b", lineHeight: 1.45 },
  description: { margin: "20px 0 0 0", fontSize: "15px", lineHeight: 1.6, color: "#475569" },
  ctaHint: {
    margin: "12px 0 0 0",
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#64748b",
    padding: "10px 12px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  actions: { marginTop: "28px", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" },
  ctaPrimary: {
    display: "block",
    textAlign: "center",
    padding: "12px 18px",
    background: "#fff",
    color: "#1a1a2e",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "15px",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  btnCart: {
    padding: "11px 14px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    color: "#1f2937",
  },
  btnBuy: {
    padding: "11px 14px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    color: "#1f2937",
  },
  btnDisabled: { opacity: 0.45, cursor: "not-allowed" },
};
