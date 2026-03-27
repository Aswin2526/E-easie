import React, { useEffect, useMemo, useState } from "react";
import { fetchTrackedOrders, getStoredToken, trackOrder } from "../api";
import { formatNPR } from "../currency";

const STATUS_COLORS = {
  Paid: "#15803d",
  Pending: "#ca8a04",
  "Partially Paid": "#ea580c",
};

export default function TrackOrderPage() {
  const loggedIn = Boolean(getStoredToken());
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [designDecision, setDesignDecision] = useState("");
  const [revisionText, setRevisionText] = useState("");

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    setLoading(true);
    fetchTrackedOrders()
      .then((data) => {
        if (cancelled) return;
        const loaded = Array.isArray(data?.orders) ? data.orders : [];
        setOrders(loaded);
        if (loaded.length > 0) {
          setResult(loaded[0]);
          setOrderId(String(loaded[0].order_id));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          typeof err?.data === "object" && err.data?.detail
            ? err.data.detail
            : err.message || "Failed to load your orders."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    setDesignDecision("");
    setRevisionText("");
  }, [result?.order_id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!orderId.trim()) {
      setError("Enter your order number.");
      return;
    }
    if (!loggedIn && !email.trim()) {
      setError("Email is required for guest tracking.");
      return;
    }
    setLoading(true);
    try {
      const data = await trackOrder(orderId.trim(), email.trim());
      setResult(data);
      if (loggedIn) {
        setOrders((prev) => {
          const existing = prev.filter((o) => o.order_id !== data.order_id);
          return [data, ...existing];
        });
      }
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

  const selectedOrder = useMemo(() => result, [result]);

  const handleCopyTracking = async () => {
    if (!selectedOrder?.shipping?.tracking_number) return;
    try {
      await navigator.clipboard.writeText(selectedOrder.shipping.tracking_number);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(""), 1200);
    } catch {
      setCopyFeedback("Copy failed");
      setTimeout(() => setCopyFeedback(""), 1200);
    }
  };

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <h1 style={s.title}>Track order</h1>
        <p style={s.sub}>
          Track one order with order number, or view your recent orders when signed in.
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
        {!loggedIn ? (
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
        ) : null}
        <button type="submit" style={s.btn} disabled={loading}>
          {loading ? "Searching…" : "Track"}
        </button>
      </form>

      {error && <p style={s.err}>{error}</p>}

      {loggedIn && orders.length > 0 ? (
        <div style={s.quickList}>
          {orders.map((o) => (
            <button
              key={o.order_id}
              type="button"
              style={{ ...s.orderChip, ...(selectedOrder?.order_id === o.order_id ? s.orderChipActive : null) }}
              onClick={() => {
                setResult(o);
                setOrderId(String(o.order_id));
              }}
            >
              #{o.order_id} • {o.order_status}
            </button>
          ))}
        </div>
      ) : null}

      {selectedOrder && (
        <div style={s.stack}>
          <div style={s.card}>
            <h2 style={s.cardTitle}>Order Details</h2>
            <div style={s.rows}>
              <Row label="Order ID" value={`#${selectedOrder.order_id}`} />
              <Row label="Placed on" value={selectedOrder.placed_date} />
              <Row label="Expected delivery" value={selectedOrder.expected_delivery_date} />
              <Row label="Customer" value={selectedOrder.customer_name} />
              <Row label="Clothing type" value={selectedOrder.order_details?.clothing_type} />
              <Row label="Size" value={selectedOrder.order_details?.size} />
              <Row label="Color" value={selectedOrder.order_details?.color} />
              <Row label="Design" value={selectedOrder.order_details?.design_description} />
              {selectedOrder.order_details?.design_image_url ? (
                <div style={s.designThumbWrap}>
                  <span style={s.rowLabel}>Design image</span>
                  <img src={selectedOrder.order_details.design_image_url} alt="Design" style={s.designThumb} />
                </div>
              ) : null}
            </div>
          </div>

          <div style={s.card}>
            <h2 style={s.cardTitle}>Order Status</h2>
            <div style={s.statusRail}>
              {(selectedOrder.status_steps || []).map((step) => (
                <div key={step.title} style={s.stepItem}>
                  <span
                    style={{
                      ...s.stepDot,
                      ...(step.state === "done" ? s.stepDone : null),
                      ...(step.state === "current" ? s.stepCurrent : null),
                    }}
                  >
                    {step.state === "done" ? "✓" : ""}
                  </span>
                  <span
                    style={{
                      ...s.stepLabel,
                      color: step.state === "current" ? "#0f172a" : step.state === "done" ? "#1e3a8a" : "#8b8b93",
                      fontWeight: step.state === "current" ? 800 : 600,
                    }}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <h2 style={s.cardTitle}>Payment Details</h2>
            <div style={s.rows}>
              <Row label="Total price" value={formatNPR(selectedOrder.payment?.total_price)} />
              <Row label="Paid" value={formatNPR(selectedOrder.payment?.paid_amount)} />
              <Row label="Remaining" value={formatNPR(selectedOrder.payment?.remaining_amount)} />
              <div style={s.row}>
                <span style={s.rowLabel}>Status</span>
                <span
                  style={{
                    ...s.paymentTag,
                    background: STATUS_COLORS[selectedOrder.payment?.status] || "#64748b",
                  }}
                >
                  {selectedOrder.payment?.status}
                </span>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <h2 style={s.cardTitle}>Shipping Details</h2>
            <div style={s.rows}>
              <Row label="Method" value={selectedOrder.shipping?.method} />
              <div style={s.row}>
                <span style={s.rowLabel}>Tracking no.</span>
                <div style={s.trackWrap}>
                  <span style={s.rowValue}>{selectedOrder.shipping?.tracking_number}</span>
                  <button type="button" style={s.copyBtn} onClick={handleCopyTracking}>
                    Copy
                  </button>
                  {copyFeedback ? <span style={s.copyFeedback}>{copyFeedback}</span> : null}
                </div>
              </div>
              <Row label="Address" value={selectedOrder.shipping?.address} />
            </div>
          </div>

          {selectedOrder.design_approval?.show ? (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Design Approval</h2>
              {selectedOrder.design_approval?.design_image_url ? (
                <img src={selectedOrder.design_approval.design_image_url} alt="Design approval" style={s.approvalImg} />
              ) : null}
              <div style={s.approvalActions}>
                <button type="button" style={s.approveBtn} onClick={() => setDesignDecision("approved")}>
                  Approve Design ✓
                </button>
                <button type="button" style={s.reviseBtn} onClick={() => setDesignDecision("revision")}>
                  Request Revision ✗
                </button>
              </div>
              {designDecision === "revision" ? (
                <textarea
                  style={s.revisionInput}
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  placeholder="Tell us what to change in your design..."
                />
              ) : null}
            </div>
          ) : null}

          <div style={s.card}>
            <h2 style={s.cardTitle}>Messages</h2>
            <div style={s.msgList}>
              {(selectedOrder.messages || []).map((m, idx) => (
                <div key={`${m.created_at}-${idx}`} style={s.msgItem}>
                  <p style={s.msgMeta}>{m.from === "admin" ? "Admin update" : "Message"}</p>
                  <p style={s.msgText}>{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowValue}>{value || "-"}</span>
    </div>
  );
}

const s = {
  wrap: { padding: "40px", maxWidth: "980px", margin: "0 auto", paddingBottom: "80px" },
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
  quickList: { marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "10px" },
  orderChip: {
    border: "1px solid #d6dced",
    background: "#f8fafc",
    color: "#1e293b",
    borderRadius: "999px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  orderChipActive: { background: "#dbeafe", borderColor: "#93c5fd" },
  stack: { marginTop: "24px", display: "grid", gap: "16px" },
  card: {
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
  designThumbWrap: { display: "grid", gridTemplateColumns: "110px 1fr", gap: "8px", alignItems: "start" },
  designThumb: { width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" },
  statusRail: { display: "grid", gap: "10px" },
  stepItem: { display: "flex", alignItems: "center", gap: "10px" },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#e5e7eb",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: 13,
    fontWeight: 800,
    flexShrink: 0,
  },
  stepDone: { background: "#1e3a8a" },
  stepCurrent: { background: "#0f172a" },
  stepLabel: { fontSize: 14 },
  paymentTag: {
    color: "#fff",
    display: "inline-block",
    borderRadius: 999,
    padding: "4px 10px",
    fontWeight: 700,
    width: "fit-content",
  },
  trackWrap: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  copyBtn: {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    padding: "4px 8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  copyFeedback: { color: "#0f766e", fontWeight: 700, fontSize: 12 },
  approvalImg: { width: "100%", maxWidth: 300, borderRadius: 10, border: "1px solid #ddd", marginBottom: 12 },
  approvalActions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  approveBtn: {
    background: "#15803d",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  reviseBtn: {
    background: "#b45309",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  revisionInput: {
    marginTop: "10px",
    width: "100%",
    minHeight: 84,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "10px",
    fontFamily: "inherit",
    fontSize: "14px",
    resize: "vertical",
  },
  msgList: { display: "grid", gap: "10px" },
  msgItem: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px", background: "#fff" },
  msgMeta: { margin: 0, color: "#334155", fontSize: 12, fontWeight: 700 },
  msgText: { margin: "4px 0 0", color: "#0f172a", lineHeight: 1.5 },
};
