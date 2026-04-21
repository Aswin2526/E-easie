import React from "react";
import { getProductStockQty } from "../productStock";

function fabricLabel(value) {
  if (!value) return "";
  const s = String(value).trim().toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function highlightLines(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Rich catalog copy: material, care, fit, highlights, default fabric, optional price + stock line.
 */
export default function ProductSpecsPanel({ product, priceText, showStock = true }) {
  if (!product) return null;
  const bullets = highlightLines(product.highlights);
  const hasAny =
    (product.material && String(product.material).trim()) ||
    (product.care_instructions && String(product.care_instructions).trim()) ||
    (product.fit_notes && String(product.fit_notes).trim()) ||
    bullets.length > 0 ||
    product.default_fabric;
  if (!hasAny) return null;

  const stock = showStock ? getProductStockQty(product) : null;

  return (
    <section style={box.section} aria-labelledby="product-specs-heading">
      <h2 id="product-specs-heading" style={box.title}>
        Product details
      </h2>
      {priceText ? (
        <p style={box.priceLine}>
          <strong style={box.strong}>Price</strong> {priceText}
        </p>
      ) : null}
      {showStock && stock !== null ? (
        <p style={box.meta}>
          <strong style={box.strong}>Availability</strong>{" "}
          {stock <= 0 ? "Out of stock" : `${stock} in stock`}
        </p>
      ) : null}
      {product.default_fabric ? (
        <p style={box.meta}>
          <strong style={box.strong}>Base fabric in catalog</strong> {fabricLabel(product.default_fabric)}
        </p>
      ) : null}
      {product.material ? (
        <p style={box.block}>
          <strong style={box.strong}>Material</strong>
          <br />
          <span style={box.text}>{product.material}</span>
        </p>
      ) : null}
      {bullets.length > 0 ? (
        <div style={box.block}>
          <strong style={box.strong}>Highlights</strong>
          <ul style={box.list}>
            {bullets.map((line) => (
              <li key={line} style={box.li}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {product.fit_notes ? (
        <p style={box.block}>
          <strong style={box.strong}>Fit &amp; sizing</strong>
          <br />
          <span style={box.text}>{product.fit_notes}</span>
        </p>
      ) : null}
      {product.care_instructions ? (
        <p style={box.block}>
          <strong style={box.strong}>Care</strong>
          <br />
          <span style={box.text}>{product.care_instructions}</span>
        </p>
      ) : null}
    </section>
  );
}

export function productSpecsSummaryLine(product) {
  if (!product?.material || !String(product.material).trim()) return null;
  const t = String(product.material).trim();
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
}

const box = {
  section: {
    marginTop: "20px",
    padding: "18px 18px 16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  title: {
    margin: "0 0 14px 0",
    fontSize: "17px",
    fontWeight: 800,
    color: "#0f172a",
  },
  priceLine: { margin: "0 0 8px 0", fontSize: "14px", color: "#334155", lineHeight: 1.5 },
  meta: { margin: "0 0 10px 0", fontSize: "14px", color: "#334155", lineHeight: 1.5 },
  block: { margin: "0 0 12px 0", fontSize: "14px", color: "#475569", lineHeight: 1.55 },
  strong: { color: "#1e293b", fontWeight: 700 },
  text: { display: "inline-block", marginTop: "4px" },
  list: { margin: "8px 0 0 0", paddingLeft: "20px" },
  li: { marginBottom: "6px" },
};
