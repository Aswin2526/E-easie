import React, { useEffect, useMemo, useState } from "react";
import { adminPatchOrder, fetchAdminOrders } from "../api";
import { formatNPR } from "../currency";
import { adminSharedStyles as s } from "../admin/sharedStyles";
import { apiErrorMessage, matchesSearch } from "../admin/adminUtils";

const PAYMENT_FILTERS = [
  { value: "all", label: "All payments" },
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Paid" },
  { value: "Cancelled", label: "Cancelled" },
];

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function paymentBadgeStyle(status) {
  const st = String(status || "").toLowerCase();
  if (st === "paid") return { ...payBase, background: "#dcfce7", color: "#15803d" };
  if (st === "pending") return { ...payBase, background: "#fef9c3", color: "#a16207" };
  if (st.includes("partial")) return { ...payBase, background: "#ffedd5", color: "#c2410c" };
  if (st === "cancelled") return { ...payBase, background: "#f3f4f6", color: "#6b7280" };
  return { ...payBase, background: "#e0e7ff", color: "#4338ca" };
}

const payBase = {
  fontSize: "12px",
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: "999px",
  display: "inline-block",
};

export default function AdminPaymentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [updatingById, setUpdatingById] = useState({});
  const [statusDrafts, setStatusDrafts] = useState({});
  const [cancelDrafts, setCancelDrafts] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAdminOrders();
        if (!cancelled) setOrders(res?.orders || []);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Failed to load orders."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!orders.length) return;
    setStatusDrafts((prev) => {
      const next = { ...prev };
      for (const o of orders) {
        if (!next[o.id]) next[o.id] = String(o.status || "pending").toLowerCase();
      }
      return next;
    });
    setCancelDrafts((prev) => {
      const next = { ...prev };
      for (const o of orders) {
        if (next[o.id] == null) next[o.id] = o.cancel_description || "";
      }
      return next;
    });
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesNameOrProduct = matchesSearch(searchText, o.customer, o.product);
      if (!matchesNameOrProduct) return false;
      if (paymentFilter === "all") return true;
      const pay = String(o.payment_status || "").trim();
      return pay.toLowerCase() === paymentFilter.toLowerCase();
    });
  }, [orders, searchText, paymentFilter]);

  const totals = useMemo(() => {
    let paid = 0;
    let outstanding = 0;
    for (const o of filtered) {
      paid += Number(o.paid_amount || 0);
      outstanding += Number(o.balance_due || 0);
    }
    return { paid, outstanding };
  }, [filtered]);

  async function patchOrderStatus(orderId, nextStatus, cancelDescription = "") {
    setUpdatingById((prev) => ({ ...prev, [orderId]: true }));
    setError(null);
    try {
      const res = await adminPatchOrder(orderId, {
        status: nextStatus,
        cancel_description: nextStatus === "cancelled" ? cancelDescription : "",
      });
      const updated = res?.order;
      if (!updated) return;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setStatusDrafts((prev) => ({ ...prev, [orderId]: String(updated.status || "").toLowerCase() }));
      setCancelDrafts((prev) => ({ ...prev, [orderId]: updated.cancel_description || "" }));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to update order status."));
    } finally {
      setUpdatingById((prev) => ({ ...prev, [orderId]: false }));
    }
  }

  async function handleStatusChange(orderId, value) {
    const nextStatus = String(value || "").toLowerCase();
    const previousStatus = String(statusDrafts[orderId] || "pending").toLowerCase();
    const previousCancel = String(cancelDrafts[orderId] || "");

    let nextCancel = previousCancel;
    if (nextStatus === "cancelled") {
      nextCancel = window.prompt("Enter cancel description", previousCancel) ?? "";
      nextCancel = String(nextCancel).trim();
      if (!nextCancel) {
        // Keep previous selection if cancellation reason was not provided.
        setStatusDrafts((prev) => ({ ...prev, [orderId]: previousStatus }));
        return;
      }
    } else {
      nextCancel = "";
    }

    // Optimistic UI update.
    setStatusDrafts((prev) => ({ ...prev, [orderId]: nextStatus }));
    setCancelDrafts((prev) => ({ ...prev, [orderId]: nextCancel }));
    await patchOrderStatus(orderId, nextStatus, nextCancel);
  }

  if (loading) {
    return (
      <main style={inner}>
        <p style={s.muted}>Loading payments…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={inner}>
        <section style={s.panel}>
          <h2 style={s.heading}>Payment</h2>
          <p style={s.error}>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={inner}>
      <div style={s.summaryRow}>
        <article style={s.statCard}>
          <p style={s.statLabel}>Recorded paid (filtered)</p>
          <p style={s.statValue}>{formatNPR(totals.paid)}</p>
        </article>
        <article style={s.statCard}>
          <p style={s.statLabel}>Balance due (filtered)</p>
          <p style={s.statValue}>{formatNPR(totals.outstanding)}</p>
        </article>
        <article style={s.statCard}>
          <p style={s.statLabel}>Orders shown</p>
          <p style={s.statValue}>{filtered.length}</p>
        </article>
      </div>

      <section style={s.tableCard}>
        <div style={tableToolbar.wrap}>
          <div style={tableToolbar.titleBlock}>
            <h2 style={{ ...s.tableTitle, padding: 0 }}>Orders &amp; payment status</h2>
          </div>
          <div style={tableToolbar.controls}>
            <label style={tableToolbar.searchLabel} htmlFor="admin-payment-search">
              <input
                id="admin-payment-search"
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by customer name or product…"
                style={tableToolbar.searchInput}
                aria-label="Search by customer name or product"
              />
            </label>
            <div style={tableToolbar.filterWrap}>
              <select
                id="admin-payment-filter"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={tableToolbar.select}
                aria-label="Filter by payment status"
              >
                {PAYMENT_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Order</th>
              <th style={s.th}>Customer</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Product</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Cancel description</th>
              <th style={s.th}>Payment</th>
              <th style={s.th}>Paid</th>
              <th style={s.th}>Balance</th>
              <th style={s.th}>Total</th>
              <th style={s.th}>Placed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td style={s.td}>#{o.id}</td>
                <td style={s.td}>{o.customer}</td>
                <td style={{ ...s.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {o.customer_email || "—"}
                </td>
                <td style={{ ...s.td, whiteSpace: "normal" }}>{o.product}</td>
                <td style={s.td}>
                  <div style={orderEdit.cellStack}>
                    <select
                      value={statusDrafts[o.id] ?? String(o.status || "pending").toLowerCase()}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      style={orderEdit.select}
                      disabled={Boolean(updatingById[o.id])}
                      aria-label={`Update status for order ${o.id}`}
                    >
                      {ORDER_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {updatingById[o.id] ? <span style={orderEdit.savingText}>Updating...</span> : null}
                  </div>
                </td>
                <td style={s.td}>
                  {String(statusDrafts[o.id] ?? o.status).toLowerCase() === "cancelled" ? (
                    <textarea
                      value={cancelDrafts[o.id] ?? ""}
                      onChange={(e) =>
                        setCancelDrafts((prev) => ({
                          ...prev,
                          [o.id]: e.target.value,
                        }))
                      }
                      placeholder="Cancelled because..."
                      rows={2}
                      style={orderEdit.textarea}
                      aria-label={`Cancel description for order ${o.id}`}
                    />
                  ) : (
                    <span style={s.muted}>-</span>
                  )}
                </td>
                <td style={s.td}>
                  <span style={paymentBadgeStyle(o.payment_status)}>{o.payment_status}</span>
                </td>
                <td style={s.td}>{formatNPR(o.paid_amount)}</td>
                <td style={s.td}>{formatNPR(o.balance_due)}</td>
                <td style={s.td}>{formatNPR(o.total_price)}</td>
                <td style={s.td}>{formatDateTime(o.placed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p style={{ ...s.muted, padding: "16px" }}>No orders match your search or payment filter.</p>
        ) : null}
      </section>
    </main>
  );
}

const inner = {
  padding: "24px 28px 40px",
  maxWidth: "1280px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const tableToolbar = {
  wrap: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    padding: "16px 16px 12px",
    borderBottom: "1px solid #e6e8f0",
  },
  titleBlock: {
    flex: "1 1 240px",
    minWidth: 0,
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    flex: "1 1 280px",
    marginLeft: "auto",
  },
  searchLabel: {
    display: "block",
    flex: "1 1 200px",
    minWidth: "160px",
    maxWidth: "360px",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
  },
  filterWrap: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  select: {
    minWidth: "160px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
    background: "#fff",
    fontFamily: "inherit",
    cursor: "pointer",
  },
};

const orderEdit = {
  cellStack: {
    display: "grid",
    gap: "8px",
    minWidth: "150px",
  },
  select: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "8px 10px",
    fontSize: "14px",
    fontWeight: 600,
    background: "#fff",
    color: "#111827",
    fontFamily: "inherit",
  },
  saveButton: {
    border: "1px solid #111827",
    borderRadius: "8px",
    background: "#111827",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 700,
    padding: "6px 10px",
    fontFamily: "inherit",
  },
  savingText: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: 600,
  },
  textarea: {
    width: "240px",
    maxWidth: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "8px 10px",
    fontSize: "13px",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.4,
  },
};
