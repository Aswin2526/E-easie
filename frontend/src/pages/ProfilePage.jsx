import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelMyOrder,
  fetchCart,
  fetchCurrentUser,
  fetchMyCustomizations,
  fetchMyOrders,
  fetchWishlist,
} from "../api";
import { apiErrorMessage } from "../admin/adminUtils";
import { formatNPR } from "../currency";
import { getProductImageSrc } from "../productImages";
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
  return s === "pending" || s === "confirmed";
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
                  <img src={getProductImageSrc(p)} alt="" style={styles.thumb} />
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
                  <img src={getProductImageSrc(p)} alt="" style={styles.thumb} />
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
            {scopedOrders.map((o) => (
              <li key={o.id} style={{ ...styles.listItem, alignItems: "flex-start" }}>
                <div style={styles.orderBadge}>#{o.id}</div>
                <div style={styles.listBody}>
                  <div style={styles.itemTitle}>
                    {o.customization_summary || "Order"} · {String(o.status || "").replace(/_/g, " ")}
                  </div>
                  <div style={styles.itemMeta}>
                    Qty {o.quantity} · {formatNPR(o.total_price)} · {formatWhen(o.placed_at)}
                  </div>
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
            ))}
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
};
