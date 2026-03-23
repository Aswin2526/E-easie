import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../api";
import { formatNPR } from "../currency";
import { getProductImageSrc } from "../productImages";

export default function CategoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProducts();
        if (!cancelled) setProducts(Array.isArray(data) ? data : data.results || []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load products.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byType = useMemo(() => {
    const map = {};
    for (const p of products) {
      const key = p.product_type_display || p.product_type || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [products]);

  if (loading) {
    return (
      <div style={page.centered}>
        <p>Loading categories…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div style={page.centered}>
        <p style={{ color: "#b91c1c" }}>{error}</p>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
          Start Django: <code>python manage.py runserver</code> then refresh.
        </p>
      </div>
    );
  }

  return (
    <div style={page.wrap}>
      <header style={page.header}>
        <h1 style={page.title}>Shop by category</h1>
        <p style={page.sub}>
          Pick a base garment, then customize fabric, colors, and details.
        </p>
      </header>

      {Object.entries(byType).map(([typeName, items]) => (
        <section key={typeName} style={page.section}>
          <h2 style={page.typeHeading}>{typeName}</h2>
          <div style={page.grid}>
            {items.map((p) => (
              <article key={p.id} style={page.card}>
                <div style={page.imgWrap}>
                  <img
                    src={getProductImageSrc(p)}
                    alt={p.name}
                    style={page.img}
                  />
                </div>
                <div style={page.cardBody}>
                  <h3 style={page.cardTitle}>{p.name}</h3>
                  <p style={page.price}>{formatNPR(p.base_price)}</p>
                  <Link
                    to={`/customize?product=${p.id}`}
                    style={page.cta}
                  >
                    Customize
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const page = {
  wrap: { padding: "40px", maxWidth: "1200px", margin: "0 auto" },
  centered: { padding: "60px 24px", textAlign: "center" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a1a2e" },
  sub: { marginTop: "10px", color: "#555", maxWidth: "560px" },
  section: { marginBottom: "48px" },
  typeHeading: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#1a1a2e",
    borderBottom: "1px solid #eee",
    paddingBottom: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "#fafafa",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #eee",
  },
  imgWrap: {
    height: "220px",
    background: "#e5e5e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  cardBody: { padding: "16px" },
  cardTitle: { fontSize: "16px", fontWeight: "700", marginBottom: "6px" },
  price: { color: "#444", marginBottom: "12px" },
  cta: {
    display: "inline-block",
    padding: "10px 16px",
    background: "#1a1a2e",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
  },
};
