import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelMyOrder,
  fetchCart,
  fetchCurrentUser,
  fetchMyCustomizations,
  fetchMyOrders,
  fetchWishlist,
  postProductRating,
} from "../api";
import { apiErrorMessage } from "../admin/adminUtils";
import { formatNPR } from "../currency";
import { getProductImageSrc, getProductImageStyle } from "../productImages";
import { useNotify } from "../contexts/NotifyContext";

function normalizeList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
}

function sameUserId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

function orderCanCancel(status) {
  const s = String(status || "").toLowerCase();
  return ["pending", "confirmed", "quality_check", "packed"].includes(s);
}

export default function ProfilePage() {
  const toast = useNotify();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customizations, setCustomizations] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  /** { orderId, productId, stars, comment } while editing a delivered-order review */
  const [reviewDraft, setReviewDraft] = useState(null);
  const [reviewSavingId, setReviewSavingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser();
        if (cancelled) return;
        setProfile(me);

        const [cartRes, wishRes, ordersRes, custRes] = await Promise.all([
          fetchCart().catch(() => null),
          fetchWishlist().catch(() => []),
          fetchMyOrders().catch(() => []),
          fetchMyCustomizations().catch(() => []),
        ]);
        if (cancelled) return;
        setCart(cartRes);
        setWishlist(normalizeList(wishRes));
        setOrders(normalizeList(ordersRes));
        setCustomizations(normalizeList(custRes));
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load profile."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCancelOrder(order) {
    if (!orderCanCancel(order.status)) return;
    const ok = window.confirm(`Cancel order #${order.id}? This cannot be undone.`);
    if (!ok) return;
    const note = window.prompt("Optional note (saved on your order):") ?? "";
    if (note === null) return;
    setCancellingId(order.id);
    try {
      await cancelMyOrder(order.id, { cancelDescription: note });
      toast.success("Order cancelled", `Order #${order.id} was updated.`);
      const next = await fetchMyOrders();
      setOrders(normalizeList(next));
    } catch (err) {
      toast.error("Could not cancel", err.message || "Try again or use Track order.");
    } finally {
      setCancellingId(null);
    }
  }

  function openOrderReviewForm(order) {
    const p = order.product;
    const pid = p?.id;
    if (!pid) return;
    const pr = order.product_review;
    setReviewDraft({
      orderId: order.id,
      productId: pid,
      stars: pr?.stars ?? 5,
      comment: pr?.comment ?? "",
    });
  }

  async function submitOrderReview() {
    if (!reviewDraft?.productId) return;
    setReviewSavingId(reviewDraft.orderId);
    try {
      await postProductRating(reviewDraft.productId, {
        stars: reviewDraft.stars,
        comment: (reviewDraft.comment || "").trim(),
      });
      toast.success("Review saved", "Thank you for your feedback.");
      const next = await fetchMyOrders();
      setOrders(normalizeList(next));
      setReviewDraft(null);
    } catch (err) {
      const raw = err?.data;
      let msg = err.message || "Could not save review.";
      if (typeof raw === "object" && raw?.detail) msg = String(raw.detail);
      toast.error("Review not saved", msg);
    } finally {
      setReviewSavingId(null);
    }
  }

  const myId = profile?.id;

  const scopedCart = useMemo(() => {
    if (!cart || myId == null) return cart;
    if (cart.user != null && !sameUserId(cart.user, myId)) {
      return { ...cart, items: [] };
    }
    return cart;
  }, [cart, myId]);

  const scopedWishlist = useMemo(() => {
    if (myId == null) return [];
    return wishlist.filter((w) => sameUserId(w.user, myId));
  }, [wishlist, myId]);

  const scopedOrders = useMemo(() => {
    if (myId == null) return [];
    return orders.filter((o) => sameUserId(o.user, myId));
  }, [orders, myId]);

  const scopedCustomizations = useMemo(() => {
    if (myId == null) return [];
    return customizations.filter((c) => sameUserId(c.user, myId));
  }, [customizations, myId]);

  const cartItems = scopedCart?.items || [];

  if (loading) {
    return (
      <main style={styles.wrap}>
        <p style={styles.muted}>Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.wrap}>
        <section style={styles.card}>
          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.error}>{error}</p>
        </section>
      </main>
    );
  }

  const displayName =
    (profile?.user?.name && String(profile.user.name).trim()) || profile?.user?.email || "-";
  const displayEmail = profile?.user?.email?.trim() || "-";

  return (
    <main style={styles.wrap}>
      <section style={styles.card}>
        <h1 style={styles.title}>My Profile</h1>
        <div style={styles.row}>
          <span style={styles.label}>Name</span>
          <span style={styles.value}>{displayName}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Email</span>
          <span style={styles.value}>{displayEmail}</span>
        </div>
      </section>

      <section style={{ ...styles.card, marginTop: 20 }}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Cart</h2>
          <Link to="/cart" style={styles.sectionLink}>
            Open cart
          </Link>
        </div>
        {cartItems.length === 0 ? (
          <p style={styles.muted}>Nothing in your cart. <Link to="/category">Browse products</Link></p>
        ) : (
          <ul style={styles.list}>
            {cartItems.map((item) => {
              const p = item.product_detail;
              const cust = item.customization_detail;
              if (!p) return null;
              return (
                <li key={item.id} style={styles.listItem}>
                  <img src={getProductImageSrc(p)} alt="" style={{ ...styles.thumb, ...getProductImageStyle(p) }} />
                  <div style={styles.listBody}>
                    <div style={styles.itemTitle}>{p.name}</div>
                    <div style={styles.itemMeta}>
                      {p.product_type_display || p.product_type} · {formatNPR(p.base_price)} · Qty {item.quantity}
                    </div>
                    {cust ? (
                      <div style={styles.itemDetail}>
                        Custom: {cust.fabric}, {cust.pattern}, size {cust.size}
                        {cust.title ? ` · “${cust.title}”` : ""}
                      </div>
                    ) : (
                      <div style={styles.itemDetail}>Standard item (not customized)</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section style={{ ...styles.card, marginTop: 20 }}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Wishlist</h2>
          <Link to="/wishlist" style={styles.sectionLink}>
            Manage wishlist
          </Link>
        </div>
        {scopedWishlist.length === 0 ? (
          <p style={styles.muted}>Wishlist is empty. <Link to="/category">Add products</Link></p>
        ) : (
          <ul style={styles.list}>
            {scopedWishlist.map((w) => {
              const p = w.product_detail;
              if (!p) return null;
              return (
                <li key={w.id} style={styles.listItem}>
                  <img src={getProductImageSrc(p)} alt="" style={{ ...styles.thumb, ...getProductImageStyle(p) }} />
                  <div style={styles.listBody}>
                    <div style={styles.itemTitle}>{p.name}</div>
                    <div style={styles.itemMeta}>
                      {p.product_type_display || p.product_type} · {formatNPR(p.base_price)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section style={{ ...styles.card, marginTop: 20 }}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Purchased orders</h2>
          <Link to="/track-order" style={styles.sectionLink}>
            Track orders
          </Link>
        </div>
        {scopedOrders.length === 0 ? (
          <p style={styles.muted}>No orders yet.</p>
        ) : (
          <ul style={styles.list}>
            {scopedOrders.map((o) => {
              const p = o.product;
              const showReview = o.review_eligible && p?.slug;
              const isEditing = reviewDraft && reviewDraft.orderId === o.id;
              return (
                <li key={o.id} style={{ ...styles.listItem, alignItems: "flex-start" }}>
                  {p?.slug ? (
                    <Link to={`/product/${p.slug}`} style={{ flexShrink: 0 }}>
                      <img
                        src={getProductImageSrc(p)}
                        alt=""
                        style={{ ...styles.thumb, ...getProductImageStyle(p) }}
                      />
                    </Link>
                  ) : (
                    <div style={styles.orderBadge}>#{o.id}</div>
                  )}
                  <div style={styles.listBody}>
                    <div style={styles.itemTitle}>
                      Order #{o.id}
                      {p?.name ? ` · ${p.name}` : ` · ${o.customization_summary || "Item"}`} ·{" "}
                      {String(o.status || "").replace(/_/g, " ")}
                    </div>
                    <div style={styles.itemMeta}>
                      Qty {o.quantity} · {formatNPR(o.total_price)} · {formatWhen(o.placed_at)}
                      {p?.slug ? (
                        <>
                          {" · "}
                          <Link to={`/product/${p.slug}`} style={styles.sectionLink}>
                            View product
                          </Link>
                        </>
                      ) : null}
                    </div>
                    {showReview ? (
                      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eef1f8" }}>
                        {o.product_review && !isEditing ? (
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                              Your review:{" "}
                              <span style={{ color: "#ca8a04" }}>
                                {"★".repeat(o.product_review.stars)}
                                {"☆".repeat(5 - o.product_review.stars)}
                              </span>
                            </div>
                            {o.product_review.comment ? (
                              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#475569", whiteSpace: "pre-wrap" }}>
                                {o.product_review.comment}
                              </p>
                            ) : null}
                            <button
                              type="button"
                              style={styles.reviewBtn}
                              onClick={() => openOrderReviewForm(o)}
                            >
                              Update review
                            </button>
                          </div>
                        ) : null}
                        {!o.product_review && !isEditing ? (
                          <button type="button" style={styles.reviewBtn} onClick={() => openOrderReviewForm(o)}>
                            Write a review
                          </button>
                        ) : null}
                        {isEditing ? (
                          <div style={{ marginTop: "8px" }}>
                            <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                              Rating
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() =>
                                    setReviewDraft((d) => (d && d.orderId === o.id ? { ...d, stars: n } : d))
                                  }
                                  style={{
                                    fontSize: "20px",
                                    lineHeight: 1,
                                    padding: "2px 4px",
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: n <= (reviewDraft?.stars ?? 5) ? "#ca8a04" : "#cbd5e1",
                                  }}
                                  aria-label={`${n} stars`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                              Comment (optional)
                              <textarea
                                value={reviewDraft?.comment ?? ""}
                                onChange={(e) =>
                                  setReviewDraft((d) =>
                                    d && d.orderId === o.id ? { ...d, comment: e.target.value } : d
                                  )
                                }
                                rows={3}
                                maxLength={2000}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  marginTop: "6px",
                                  padding: "8px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "14px",
                                  fontFamily: "inherit",
                                  boxSizing: "border-box",
                                }}
                              />
                            </label>
                            <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button
                                type="button"
                                style={styles.reviewSubmitBtn}
                                disabled={reviewSavingId === o.id}
                                onClick={submitOrderReview}
                              >
                                {reviewSavingId === o.id ? "Saving…" : "Submit review"}
                              </button>
                              <button
                                type="button"
                                style={styles.reviewCancelBtn}
                                disabled={reviewSavingId === o.id}
                                onClick={() => setReviewDraft(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {orderCanCancel(o.status) ? (
                      <div style={{ marginTop: "10px" }}>
                        <button
                          type="button"
                          style={styles.cancelBtn}
                          disabled={cancellingId === o.id}
                          onClick={() => handleCancelOrder(o)}
                        >
                          {cancellingId === o.id ? "Cancelling…" : "Cancel order"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section style={{ ...styles.card, marginTop: 20 }}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Saved customizations</h2>
          <Link to="/customize" style={styles.sectionLink}>
            Customize
          </Link>
        </div>
        {scopedCustomizations.length === 0 ? (
          <p style={styles.muted}>No saved designs yet. <Link to="/customize">Create one</Link></p>
        ) : (
          <ul style={styles.list}>
            {scopedCustomizations.map((c) => (
              <li key={c.id} style={{ ...styles.listItem, alignItems: "flex-start" }}>
                <div style={styles.orderBadge}>#{c.id}</div>
                <div style={styles.listBody}>
                  <div style={styles.itemTitle}>{c.product_name || "Product"}</div>
                  <div style={styles.itemMeta}>
                    {c.product_type} · {c.fabric} · {c.pattern} · size {c.size}
                    {c.custom_size ? ` (${c.custom_size})` : ""}
                  </div>
                  {c.title ? <div style={styles.itemDetail}>“{c.title}”</div> : null}
                  <div style={styles.itemDetail}>Updated {formatWhen(c.updated_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

const styles = {
  wrap: {
    padding: "24px 28px 40px",
    maxWidth: "980px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  card: {
    background: "#fff",
    border: "1px solid #e6e8f0",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(26, 26, 46, 0.04)",
  },
  title: {
    margin: 0,
    color: "#1a1a2e",
    fontSize: "24px",
    fontWeight: 800,
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },
  sectionTitle: {
    margin: 0,
    color: "#1a1a2e",
    fontSize: "18px",
    fontWeight: 800,
  },
  sectionLink: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#2563eb",
    textDecoration: "none",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #eef1f8",
  },
  label: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
  },
  value: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 600,
  },
  muted: {
    color: "#51607a",
    padding: "8px 0",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  error: {
    marginTop: "12px",
    color: "#b91c1c",
    fontSize: "15px",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  listItem: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "12px",
    border: "1px solid #eef1f8",
    borderRadius: "10px",
    background: "#fafbff",
    overflow: "hidden",
  },
  thumb: {
    width: 52,
    height: 52,
    objectFit: "cover",
    borderRadius: "8px",
    flexShrink: 0,
  },
  listBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  itemMeta: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#475569",
    fontWeight: 500,
  },
  cancelBtn: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#b91c1c",
    background: "#fff",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    cursor: "pointer",
  },
  itemDetail: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.45,
  },
  orderBadge: {
    flexShrink: 0,
    minWidth: "44px",
    padding: "8px 6px",
    borderRadius: "8px",
    background: "#e0e7ff",
    color: "#3730a3",
    fontSize: "12px",
    fontWeight: 800,
    textAlign: "center",
  },
  reviewBtn: {
    marginTop: "10px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#1e40af",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    cursor: "pointer",
  },
  reviewSubmitBtn: {
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#fff",
    background: "#1a1a2e",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  reviewCancelBtn: {
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#475569",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
