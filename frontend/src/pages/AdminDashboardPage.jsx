import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminDashboard } from "../api";
import { formatNPR } from "../currency";
import { apiErrorMessage } from "../admin/adminUtils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  const chartBars = useMemo(() => {
    const now = new Date();
    const bars = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      bars.push({
        key,
        label: MONTHS[d.getMonth()],
        confirmed: 0,
        pending: 0,
      });
    }
    const keyIndex = Object.fromEntries(bars.map((b, idx) => [b.key, idx]));
    for (const o of recentOrders) {
      if (!o.placed_at) continue;
      const dt = new Date(o.placed_at);
      if (Number.isNaN(dt.getTime())) continue;
      const k = `${dt.getFullYear()}-${dt.getMonth()}`;
      const idx = keyIndex[k];
      if (idx === undefined) continue;
      const amt = Number(o.total_price || 0);
      const st = String(o.status || "").toLowerCase();
      if (st === "shipped" || st === "confirmed") {
        bars[idx].confirmed += amt;
      } else {
        bars[idx].pending += amt;
      }
    }
    const maxVal = Math.max(1, ...bars.map((b) => b.confirmed + b.pending));
    return bars.map((b) => ({
      ...b,
      confirmedPct: (b.confirmed / maxVal) * 100,
      pendingPct: (b.pending / maxVal) * 100,
    }));
  }, [recentOrders]);

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
          <p style={styles.statLabel}>Registered users</p>
        </article>
        <article style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, background: "#fee2e2" }}>
            <span style={styles.statIcon}>🛒</span>
          </div>
          <p style={styles.statValue}>{formatNPR(totalRevenue)}</p>
          <p style={styles.statLabel}>Recent orders revenue</p>
        </article>
      </div>

      <div className="admin-dashboard-main-grid" style={styles.mainGrid}>
        <section style={styles.chartPanel}>
          <div style={styles.chartHeader}>
            <h2 style={styles.panelTitle}>Order summary</h2>
            <div style={styles.legend}>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendSwatch, background: "#7c3aed" }} /> Confirmed / shipped
              </span>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendSwatch, background: "#2563eb" }} /> Pending / other
              </span>
            </div>
          </div>
          <div style={styles.chartArea}>
            <div style={styles.yAxis}>
              {[90, 60, 30, 0].map((n) => (
                <span key={n} style={styles.yTick}>
                  {n}
                </span>
              ))}
            </div>
            <div style={styles.barsWrap}>
              {chartBars.map((b) => (
                <div key={b.key} style={styles.barColumn}>
                  <div style={styles.barStack}>
                    <div
                      style={{
                        ...styles.barSegment,
                        height: `${b.pendingPct}%`,
                        background: "#2563eb",
                        borderRadius: b.confirmedPct < 1 ? "6px 6px 0 0" : 0,
                      }}
                      title={`Pending: ${formatNPR(b.pending)}`}
                    />
                    <div
                      style={{
                        ...styles.barSegment,
                        height: `${b.confirmedPct}%`,
                        background: "#7c3aed",
                        borderRadius: "6px 6px 0 0",
                      }}
                      title={`Confirmed: ${formatNPR(b.confirmed)}`}
                    />
                  </div>
                  <span style={styles.barLabel}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={styles.chartNote}>Last 6 months · stacked by order status (from recent sample)</p>
        </section>

        <aside style={styles.sidePanel}>
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
        </aside>
      </div>
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
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 320px)",
    gap: "18px",
    alignItems: "stretch",
    marginBottom: "22px",
  },
  chartPanel: {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e6e8f0",
    boxShadow: "0 8px 24px rgba(26, 26, 46, 0.06)",
    padding: "22px 24px 18px",
  },
  sidePanel: {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e6e8f0",
    boxShadow: "0 8px 24px rgba(26, 26, 46, 0.06)",
    padding: "22px 20px",
    display: "flex",
    flexDirection: "column",
  },
  panelTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
    color: "#1a1a2e",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "18px",
  },
  legend: { display: "flex", gap: "16px", flexWrap: "wrap" },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 600,
  },
  legendSwatch: {
    width: "10px",
    height: "10px",
    borderRadius: "2px",
  },
  chartArea: {
    display: "flex",
    gap: "8px",
    minHeight: "220px",
  },
  yAxis: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    paddingBottom: "28px",
    width: "28px",
    flexShrink: 0,
  },
  yTick: {
    fontSize: "11px",
    color: "#94a3b8",
    textAlign: "right",
  },
  barsWrap: {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "8px",
    borderLeft: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    padding: "0 8px 0 12px",
    minHeight: "200px",
  },
  barColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "48px",
  },
  barStack: {
    width: "100%",
    height: "180px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "stretch",
  },
  barSegment: {
    width: "100%",
    minHeight: "2px",
    transition: "height 0.2s ease",
  },
  barLabel: {
    marginTop: "8px",
    fontSize: "11px",
    color: "#64748b",
    fontWeight: 600,
  },
  chartNote: {
    margin: "12px 0 0",
    fontSize: "11px",
    color: "#94a3b8",
  },
  txList: {
    listStyle: "none",
    margin: "16px 0 0",
    padding: 0,
    flex: 1,
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
    marginTop: "auto",
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
