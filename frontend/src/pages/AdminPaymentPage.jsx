import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminOrders } from "../api";
import { formatNPR } from "../currency";
import { adminSharedStyles as s } from "../admin/sharedStyles";
import { apiErrorMessage, matchesSearch } from "../admin/adminUtils";

const PAYMENT_FILTERS = [
  { value: "all", label: "All payments" },
  { value: "Pending", label: "Pending" },
  { value: "Partially paid", label: "Partially paid" },
  { value: "Paid", label: "Paid" },
  { value: "Cancelled", label: "Cancelled" },
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
                <td style={s.td}>{o.status}</td>
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
