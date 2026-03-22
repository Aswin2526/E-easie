import React, { useState } from "react";
import { trackOrder } from "../api";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!orderId.trim()) {
      setError("Enter your order number.");
      return;
    }
    setLoading(true);
    try {
      const data = await trackOrder(orderId.trim(), email.trim());
      setResult(data);
    } catch (err) {
      setError(
        typeof err.data === "object" && err.data?.detail
          ? err.data.detail
          : err.message || "Could not find that order."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <h1 style={s.title}>Track order</h1>
        <p style={s.sub}>
          Enter the order number from your confirmation. If you checked out as a guest,
          use the same email you entered when placing the order. If you are signed in,
          you can leave email blank for your own orders.
        </p>
      </header>

      <form onSubmit={handleSubmit} style={s.form}>
        <label style={s.label}>
          Order number
          <input
            style={s.input}
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. 1"
          />
        </label>
        <label style={s.label}>
          Email (guest checkout)
          <input
            type="email"
            style={s.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button type="submit" style={s.btn} disabled={loading}>
          {loading ? "Searching…" : "Track"}
        </button>
      </form>

      {error && <p style={s.err}>{error}</p>}

      {result && (
        <div style={s.card}>
          <h2 style={s.cardTitle}>Order #{result.id}</h2>
          <div style={s.rows}>
            <Row label="Status" value={result.status} />
            <Row label="Quantity" value={result.quantity} />
            <Row label="Total" value={`$${result.total_price}`} />
            <Row label="Placed" value={result.placed_at} />
            <Row label="Ship to" value={result.shipping_address} />
            <Row label="Design" value={result.customization_summary} />
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { padding: "40px", maxWidth: "560px", margin: "0 auto", paddingBottom: "80px" },
  header: { marginBottom: "24px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a1a2e" },
  sub: { marginTop: "10px", color: "#555", lineHeight: 1.55, fontSize: "15px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontWeight: "600", fontSize: "14px" },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
  },
  btn: {
    marginTop: "8px",
    padding: "12px 20px",
    background: "#1a1a2e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  err: { marginTop: "16px", color: "#b91c1c", fontSize: "15px" },
  card: {
    marginTop: "28px",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e5e5e5",
    background: "#fafafa",
  },
  cardTitle: { fontSize: "18px", fontWeight: "800", marginBottom: "12px" },
  rows: { display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" },
  row: { display: "grid", gridTemplateColumns: "110px 1fr", gap: "8px", alignItems: "start" },
  rowLabel: { fontWeight: "700", color: "#555" },
  rowValue: { color: "#111", lineHeight: 1.45 },
};
