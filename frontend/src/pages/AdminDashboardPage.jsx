import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminDashboard } from "../api";
import { formatNPR } from "../currency";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchAdminDashboard();
        if (!cancelled) setData(response);
      } catch (err) {
        const message =
          typeof err?.data === "object" && err.data?.detail
            ? String(err.data.detail)
            : err.message || "Failed to load dashboard.";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCards = useMemo(() => {
    const totals = data?.totals || {};
    return [
      { label: "Total Users", value: totals.users ?? 0 },
      { label: "Total Products", value: totals.products ?? 0 },
      { label: "Total Orders", value: totals.orders ?? 0 },
      { label: "Total Customizations", value: totals.customizations ?? 0 },
    ];
  }, [data]);

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.text}>Loading dashboard data...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.error}>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <p style={styles.text}>Live overview of users, products, customizations, and orders.</p>

        <div style={styles.statsGrid}>
          {totalCards.map((item) => (
            <article key={item.label} style={styles.statCard}>
              <p style={styles.statLabel}>{item.label}</p>
              <p style={styles.statValue}>{item.value}</p>
            </article>
          ))}
        </div>

        <div style={styles.tablesWrap}>
          <section style={styles.tableCard}>
            <h2 style={styles.tableTitle}>Recent Users</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent_users || []).map((u) => (
                  <tr key={u.id}>
                    <td style={styles.td}>{u.name}</td>
                    <td style={styles.td}>{u.email || "-"}</td>
                    <td style={styles.td}>{u.role}</td>
                    <td style={styles.td}>{formatDateTime(u.date_joined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={styles.tableCard}>
            <h2 style={styles.tableTitle}>Recent Orders</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Placed</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent_orders || []).map((o) => (
                  <tr key={o.id}>
                    <td style={styles.td}>#{o.id}</td>
                    <td style={styles.td}>{o.customer}</td>
                    <td style={styles.td}>{o.product}</td>
                    <td style={styles.td}>{o.status}</td>
                    <td style={styles.td}>{formatNPR(o.total_price)}</td>
                    <td style={styles.td}>{formatDateTime(o.placed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </section>
    </main>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

const styles = {
  page: {
    minHeight: "calc(100vh - 84px)",
    background: "#f4f6fb",
    padding: "24px",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e6e8f0",
    boxShadow: "0 14px 34px rgba(26, 26, 46, 0.08)",
    maxWidth: "1200px",
    width: "100%",
    padding: "28px",
    margin: "0 auto",
  },
  title: {
    margin: 0,
    color: "#1a1a2e",
    fontSize: "30px",
  },
  text: {
    marginTop: "12px",
    color: "#4a4f66",
    fontSize: "16px",
  },
  error: {
    marginTop: "12px",
    color: "#b91c1c",
    fontSize: "15px",
  },
  statsGrid: {
    marginTop: "24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  statCard: {
    border: "1px solid #e6e8f0",
    borderRadius: "12px",
    background: "#f8faff",
    padding: "16px",
  },
  statLabel: {
    margin: 0,
    color: "#51607a",
    fontWeight: 600,
    fontSize: "13px",
  },
  statValue: {
    margin: "8px 0 0",
    color: "#1a1a2e",
    fontSize: "30px",
    fontWeight: 800,
  },
  tablesWrap: {
    marginTop: "26px",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  tableCard: {
    border: "1px solid #e6e8f0",
    borderRadius: "12px",
    overflowX: "auto",
    background: "#fff",
  },
  tableTitle: {
    margin: 0,
    padding: "14px 14px 0",
    color: "#1a1a2e",
    fontSize: "17px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  th: {
    textAlign: "left",
    fontSize: "12px",
    color: "#5e6880",
    borderBottom: "1px solid #e6e8f0",
    padding: "10px 14px",
    whiteSpace: "nowrap",
  },
  td: {
    textAlign: "left",
    fontSize: "13px",
    color: "#1c2438",
    borderBottom: "1px solid #eef1f8",
    padding: "10px 14px",
    whiteSpace: "nowrap",
  },
};
