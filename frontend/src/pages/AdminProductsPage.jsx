import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchAdminProductsCatalog } from "../api";
import { formatNPR } from "../currency";
import { adminSharedStyles as s } from "../admin/sharedStyles";
import { apiErrorMessage, matchesSearch } from "../admin/adminUtils";

export default function AdminProductsPage() {
  const { searchQuery } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAdminProductsCatalog();
        if (!cancelled) setProducts(res?.products || []);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Failed to load products."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) =>
      matchesSearch(searchQuery, p.id, p.name, p.slug, p.product_type),
    );
  }, [products, searchQuery]);

  if (loading) {
    return (
      <main style={inner}>
        <p style={s.muted}>Loading products…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={inner}>
        <section style={s.panel}>
          <h2 style={s.heading}>Products</h2>
          <p style={s.error}>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={inner}>
      <section style={s.tableCard}>
        <h2 style={s.tableTitle}>Catalog</h2>
        <p style={s.tableHint}>All products including inactive. Storefront only shows active items.</p>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Preview</th>
              <th style={s.th}>Name</th>
              <th style={s.th}>Type</th>
              <th style={s.th}>Price</th>
              <th style={s.th}>Quantity</th>
              <th style={s.th}>Slug</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={s.td}>
                  {p.image ? (
                    <img src={p.image} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <span style={s.actionMuted}>—</span>
                  )}
                </td>
                <td style={s.td}>{p.name}</td>
                <td style={s.td}>{p.product_type}</td>
                <td style={s.td}>{formatNPR(p.base_price)}</td>
                <td style={s.td}>
                  <span style={qtyValue}>{Number.isFinite(Number(p.quantity)) ? Number(p.quantity) : 0}</span>
                </td>
                <td style={{ ...s.td, whiteSpace: "normal" }}>{p.slug}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p style={{ ...s.muted, padding: "16px" }}>No products match your search.</p> : null}
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

const qtyValue = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#111827",
};
