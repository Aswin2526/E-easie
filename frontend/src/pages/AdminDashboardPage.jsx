import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminDashboard } from "../api";
import { formatNPR } from "../currency";
import { apiErrorMessage } from "../admin/adminUtils";

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (s < 604800) {
    const days = Math.floor(s / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  return d.toLocaleDateString();
}

function countStatusFromRecent(recentOrders) {
  const acc = { pending: 0, confirmed: 0, shipped: 0, cancelled: 0, returned: 0 };
  for (const o of recentOrders || []) {
    const st = String(o.status || "").toLowerCase();
    if (st === "pending") acc.pending += 1;
    else if (st === "confirmed") acc.confirmed += 1;
    else if (st === "shipped") acc.shipped += 1;
    else if (st === "cancelled") acc.cancelled += 1;
  }
  return acc;
}

function buildDonutSlices(counts) {
  const pending = Number(counts?.pending) || 0;
  const confirmedDb = Number(counts?.confirmed) || 0;
  const shipped = Number(counts?.shipped) || 0;
  const cancelled = Number(counts?.cancelled) || 0;
  const returned = Number(counts?.returned) || 0;
  const confirmed = confirmedDb + shipped;
  return [
    { key: "pending", label: "Pending", count: pending, color: "#f59e0b" },
    { key: "confirmed", label: "Confirmed", count: confirmed, color: "#7c3aed" },
    { key: "cancelled", label: "Cancelled", count: cancelled, color: "#ef4444" },
    { key: "returned", label: "Returned", count: returned, color: "#64748b" },
  ];
}

function donutConicGradient(slices) {
  const total = slices.reduce((a, s) => a + s.count, 0);
  if (total <= 0) return null;
  let deg = 0;
  const parts = [];
  for (const s of slices) {
    if (s.count <= 0) continue;
    const span = (s.count / total) * 360;
    const start = deg;
    const end = deg + span;
    parts.push(`${s.color} ${start}deg ${end}deg`);
    deg = end;
  }
  if (parts.length === 0) return null;
  return `conic-gradient(from -90deg, ${parts.join(", ")})`;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dash = await fetchAdminDashboard();
        if (!cancelled) setData(dash);
      } catch (err) {
        const message = apiErrorMessage(err, "Failed to load dashboard.");
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = data?.totals || {};
  const recentOrders = data?.recent_orders || [];

  const totalRevenue = useMemo(() => {
    return recentOrders.reduce((acc, o) => acc + Number(o.total_price || 0), 0);
  }, [recentOrders]);

  const statusCounts = useMemo(() => {
    if (data?.order_status_counts && typeof data.order_status_counts === "object") {
      return data.order_status_counts;
    }
    return countStatusFromRecent(recentOrders);
  }, [data?.order_status_counts, recentOrders]);

  const donutSlices = useMemo(() => buildDonutSlices(statusCounts), [statusCounts]);

  const donutTotal = useMemo(() => donutSlices.reduce((a, s) => a + s.count, 0), [donutSlices]);

  const donutBackground = useMemo(() => donutConicGradient(donutSlices), [donutSlices]);

  const salesOverviewRows = useMemo(() => {
    return [...recentOrders]
      .sort((a, b) => new Date(b.placed_at) - new Date(a.placed_at))
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        name: o.product || `Order #${o.id}`,
        ago: timeAgo(o.placed_at),
        amount: Number(o.total_price || 0),
        positive: String(o.status || "").toLowerCase() !== "cancelled",
      }));
  }, [recentOrders]);

  const progressPct = useMemo(() => {
    const goal = Math.max(totalRevenue * 1.5, 1);
    return Math.min(100, Math.round((totalRevenue / goal) * 100));
  }, [totalRevenue]);

  if (loading) {
    return (
      <main style={styles.contentInner}>
        <p style={styles.muted}>Loading dashboard…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.contentInner}>
        <section style={styles.panel}>
          <h2 style={styles.heading}>Admin</h2>
          <p style={styles.error}>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.contentInner}>
      <div style={styles.summaryRow}>
        <article style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, background: "#dcfce7" }}>
            <span style={styles.statIcon}>📦</span>
          </div>
          <p style={styles.statValue}>{totals.orders ?? 0}</p>
          <p style={styles.statLabel}>Total orders</p>
        </article>
        <article style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, background: "#fef9c3" }}>
            <span style={styles.statIcon}>⚡</span>
          </div>
          <p style={styles.statValue}>{totals.users ?? 0}</p>
          <p style={styles.statLabel}>Registered customers</p>
        </article>
        <article style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, background: "#fee2e2" }}>
            <span style={styles.statIcon}>🛒</span>
          </div>
          <p style={styles.statValue}>{formatNPR(totalRevenue)}</p>
          <p style={styles.statLabel}>Recent orders revenue</p>
        </article>
      </div>

      <section className="admin-dashboard-main-grid" style={styles.donutPanel}>
        <div style={styles.donutHeader}>
          <h2 style={styles.panelTitle}>Orders by status</h2>
          <p style={styles.donutHint}>
            Confirmed includes shipped orders. Returned is reserved for future returns tracking.
          </p>
        </div>
        <div style={styles.donutBody}>
          <div style={styles.donutChartWrap}>
            <div
              style={{
                ...styles.donutRing,
                background: donutBackground || "#e2e8f0",
              }}
              aria-hidden
            />
            <div style={styles.donutHole}>
              <p style={styles.donutTotal}>{donutTotal}</p>
              <p style={styles.donutTotalLabel}>Orders</p>
            </div>
          </div>
          <ul style={styles.donutLegend}>
            {donutSlices.map((s) => (
              <li key={s.key} style={styles.legendRow}>
                <span style={{ ...styles.legendDot, background: s.color }} aria-hidden />
                <span style={styles.legendText}>
                  <strong>{s.label}</strong>
                  <span style={styles.legendCount}>{s.count}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section style={styles.salesPanel}>
        <h2 style={styles.panelTitle}>Sales overview</h2>
        <ul style={styles.txList}>
          {salesOverviewRows.length === 0 ? (
            <li style={styles.txEmpty}>No recent orders</li>
          ) : (
            salesOverviewRows.map((row) => (
              <li key={row.id} style={styles.txItem}>
                <div>
                  <p style={styles.txName}>{row.name}</p>
                  <p style={styles.txAgo}>{row.ago}</p>
                </div>
                <span
                  style={{
                    ...styles.txAmount,
                    color: row.positive ? "#15803d" : "#b91c1c",
                  }}
                >
                  {row.positive ? "+" : "-"} {formatNPR(row.amount)}
                </span>
              </li>
            ))
          )}
        </ul>
        <div style={styles.totalSales}>
          <p style={styles.totalLabel}>Total sales (recent)</p>
          <p style={styles.totalValue}>{formatNPR(totalRevenue)}</p>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
          </div>
        </div>
      </section>
    </main>
  );
}

const styles = {
  contentInner: {
    padding: "24px 28px 40px",
    maxWidth: "1280px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  muted: { color: "#51607a", padding: "8px 0" },
  heading: { margin: "0 0 8px", color: "#1a1a2e", fontSize: "20px" },
  error: { marginTop: "12px", color: "#b91c1c", fontSize: "15px" },
  panel: {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e6e8f0",
    padding: "24px",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  statCard: {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e6e8f0",
    boxShadow: "0 8px 24px rgba(26, 26, 46, 0.06)",
    padding: "20px 22px",
    position: "relative",
  },
  statIconWrap: {
    position: "absolute",
    top: "18px",
    right: "18px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statIcon: { fontSize: "18px" },
  statValue: {
    margin: "0 0 6px",
    fontSize: "28px",
    fontWeight: 800,
    color: "#1a1a2e",
    lineHeight: 1.1,
  },
  statLabel: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 600,
  },
  donutPanel: {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e6e8f0",
    boxShadow: "0 8px 24px rgba(26, 26, 46, 0.06)",
    padding: "22px 24px 24px",
    marginBottom: "20px",
  },
  donutHeader: {
    marginBottom: "18px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
    color: "#1a1a2e",
  },
  donutHint: {
    margin: "8px 0 0",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.45,
    maxWidth: "720px",
  },
  donutBody: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: "32px 48px",
  },
  donutChartWrap: {
    position: "relative",
    width: "220px",
    height: "220px",
    flexShrink: 0,
  },
  donutRing: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    boxSizing: "border-box",
  },
  donutHole: {
    position: "absolute",
    inset: "22%",
    borderRadius: "50%",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.06)",
  },
  donutTotal: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 800,
    color: "#1a1a2e",
    lineHeight: 1,
  },
  donutTotalLabel: {
    margin: "6px 0 0",
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
  },
  donutLegend: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    minWidth: "200px",
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 0",
    borderBottom: "1px solid #eef1f8",
  },
  legendDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  legendText: {
    display: "flex",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "#334155",
  },
  legendCount: {
    fontWeight: 700,
    color: "#0f172a",
  },
  salesPanel: {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e6e8f0",
    boxShadow: "0 8px 24px rgba(26, 26, 46, 0.06)",
    padding: "22px 24px",
    display: "flex",
    flexDirection: "column",
  },
  txList: {
    listStyle: "none",
    margin: "16px 0 0",
    padding: 0,
  },
  txEmpty: {
    padding: "12px 0",
    color: "#94a3b8",
    fontSize: "14px",
  },
  txItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 0",
    borderBottom: "1px solid #eef1f8",
  },
  txName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  txAgo: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#94a3b8",
  },
  txAmount: {
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  totalSales: {
    marginTop: "18px",
    paddingTop: "18px",
    borderTop: "1px solid #eef1f8",
  },
  totalLabel: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 600,
  },
  totalValue: {
    margin: "6px 0 12px",
    fontSize: "22px",
    fontWeight: 800,
    color: "#2563eb",
  },
  progressTrack: {
    height: "8px",
    background: "#e2e8f0",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2563eb, #3b82f6)",
    borderRadius: "999px",
  },
};
