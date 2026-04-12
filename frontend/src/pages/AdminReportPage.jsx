import React, { useEffect, useState } from "react";
import { fetchAdminReport } from "../api";
import { formatNPR } from "../currency";
import { adminSharedStyles as s } from "../admin/sharedStyles";
import { apiErrorMessage } from "../admin/adminUtils";

export default function AdminReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAdminReport();
        if (!cancelled) setReport(res);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Failed to load report."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main style={inner}>
        <p style={s.muted}>Loading report…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={inner}>
        <section style={s.panel}>
          <h2 style={s.heading}>Report</h2>
          <p style={s.error}>{error}</p>
        </section>
      </main>
    );
  }

  const summary = report?.summary || {};
  const byStatus = report?.orders_by_status || [];
  const topProducts = report?.top_products || [];

  return (
    <main style={inner}>
      <div style={s.summaryRow}>
        <article style={s.statCard}>
          <p style={s.statLabel}>Total revenue (all orders)</p>
          <p style={s.statValue}>{formatNPR(summary.total_revenue)}</p>
        </article>
        <article style={s.statCard}>
          <p style={s.statLabel}>Total orders</p>
          <p style={s.statValue}>{summary.total_orders ?? 0}</p>
        </article>
        <article style={s.statCard}>
          <p style={s.statLabel}>Catalog products</p>
          <p style={s.statValue}>{summary.catalog_products ?? 0}</p>
        </article>
        <article style={s.statCard}>
          <p style={s.statLabel}>Active products</p>
          <p style={s.statValue}>{summary.active_products ?? 0}</p>
        </article>
        <article style={s.statCard}>
          <p style={s.statLabel}>Registered customers</p>
          <p style={s.statValue}>{summary.registered_users ?? 0}</p>
        </article>
      </div>

      <section style={{ ...s.tableCard, marginBottom: 20 }}>
        <h2 style={s.tableTitle}>Revenue by order status</h2>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Status</th>
              <th style={s.th}>Orders</th>
              <th style={s.th}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {byStatus.map((row) => (
              <tr key={row.status}>
                <td style={s.td}>{row.status}</td>
                <td style={s.td}>{row.count}</td>
                <td style={s.td}>{formatNPR(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={s.tableCard}>
        <h2 style={s.tableTitle}>Top products by revenue</h2>
        <p style={s.tableHint}>Aggregated from order line totals (customization product).</p>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Product</th>
              <th style={s.th}>Orders</th>
              <th style={s.th}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((row, idx) => (
              <tr key={row.customization__product_id ?? `row-${idx}`}>
                <td style={{ ...s.td, whiteSpace: "normal" }}>{row.customization__product__name || "—"}</td>
                <td style={s.td}>{row.order_count}</td>
                <td style={s.td}>{formatNPR(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
