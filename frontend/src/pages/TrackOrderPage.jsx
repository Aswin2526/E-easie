import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  cancelMyOrder,
  fetchTrackedOrders,
  getStoredToken,
  payOrderWithEsewa,
  submitEsewaPaymentForm,
  trackOrder,
} from "../api";
import { formatNPR } from "../currency";
import { useNotify } from "../contexts/NotifyContext";

const STATUS_COLORS = {
  Paid: "#15803d",
  Pending: "#ca8a04",
  Cancelled: "#64748b",
};

export default function TrackOrderPage() {
  const toast = useNotify();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [paymentNotice, setPaymentNotice] = useState("");
  const [esewaResumeBusy, setEsewaResumeBusy] = useState(false);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) return;

    if (payment === "success") {
      setPaymentNotice("eSewa payment completed. Your order(s) are confirmed.");
    } else if (payment === "failed") {
      setPaymentNotice("Payment was cancelled or did not complete.");
    } else {
      setPaymentNotice(`Payment notice: ${payment.replace(/_/g, " ")}`);
    }

    const oid = searchParams.get("order");
    const next = new URLSearchParams(searchParams);
    next.delete("payment");
    next.delete("order");
    next.delete("updated");
    setSearchParams(next, { replace: true });

    if (!loggedIn || payment !== "success") return;

    setLoading(true);
    fetchTrackedOrders()
      .then((data) => {
        const loaded = Array.isArray(data?.orders) ? data.orders : [];
        setOrders(loaded);
        if (oid) {
          const found = loaded.find((o) => String(o.order_id) === oid);
          if (found) {
            setResult(found);
            setOrderId(String(found.order_id));
          }
        } else if (loaded.length > 0) {
          setResult(loaded[0]);
          setOrderId(String(loaded[0].order_id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loggedIn, searchParams, setSearchParams]);

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
    if (!loggedIn) return;
    function refreshOrdersFromServer() {
      if (document.visibilityState !== "visible") return;
      fetchTrackedOrders()
        .then((data) => {
          const loaded = Array.isArray(data?.orders) ? data.orders : [];
          setOrders(loaded);
          setResult((prev) => {
            if (!prev?.order_id) return loaded[0] ?? null;
            return loaded.find((o) => o.order_id === prev.order_id) ?? prev;
          });
        })
        .catch(() => {});
    }
    document.addEventListener("visibilitychange", refreshOrdersFromServer);
    return () => document.removeEventListener("visibilitychange", refreshOrdersFromServer);
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

  async function handleCancelOrder() {
    if (!selectedOrder?.cancel_eligible || !loggedIn) return;
    const ok = window.confirm(
      "Cancel this order? You can only cancel before it has shipped. This cannot be undone."
    );
    if (!ok) return;
    const note = window.prompt("Optional note (saved on your order record):") ?? "";
    if (note === null) return;
    setLoading(true);
    try {
      await cancelMyOrder(selectedOrder.order_id, { cancelDescription: note });
      toast.success("Order cancelled", "Your order has been updated.");
      const data = await trackOrder(String(selectedOrder.order_id), "");
      setResult(data);
      const list = await fetchTrackedOrders();
      const loaded = Array.isArray(list?.orders) ? list.orders : [];
      setOrders(loaded);
    } catch (err) {
      toast.error("Could not cancel", err.message || "Try again or contact support.");
    } finally {
      setLoading(false);
    }
  }

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

  const canPayPendingOnline = Boolean(
    loggedIn &&
      selectedOrder?.payment?.status === "Pending" &&
      Number(selectedOrder.payment?.remaining_amount) > 0
  );

  async function handlePayPendingWithEsewa() {
    if (!selectedOrder || !loggedIn) return;
    setEsewaResumeBusy(true);
    try {
      const res = await payOrderWithEsewa(selectedOrder.order_id);
      if (res?.epay_url && res?.fields) {
        submitEsewaPaymentForm(res.epay_url, res.fields);
        return;
      }
      toast.error("eSewa", "Payment could not be started. Try again or contact support.");
    } catch (err) {
      toast.error(
        "eSewa checkout",
        err.message || "Could not start payment. You may need to sign in again."
      );
    } finally {
      setEsewaResumeBusy(false);
    }
  }

  const handlePrintReport = () => {
    if (!selectedOrder) return;
    const reportWindow = window.open("", "_blank", "width=900,height=700");
    if (!reportWindow) {
      alert("Please allow popups to print the order report.");
      return;
    }

    const statusRows = (selectedOrder.status_steps || [])
      .map((step) => `<li><strong>${step.title}</strong> - ${step.state}</li>`)
      .join("");
    const msgRows = (selectedOrder.messages || [])
      .map((m) => `<li><strong>${m.from}</strong>: ${m.text}</li>`)
      .join("");
    const designImage = selectedOrder.order_details?.design_image_url
      ? `<img src="${selectedOrder.order_details.design_image_url}" alt="Design" style="max-width:180px;border:1px solid #ddd;border-radius:8px;" />`
      : "<p>-</p>";

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Order Report #${selectedOrder.order_id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 12px; color: #0f172a; }
            h2 { margin: 22px 0 8px; color: #0f172a; font-size: 18px; }
            .grid { display: grid; grid-template-columns: 180px 1fr; gap: 8px 12px; }
            .k { color: #475569; font-weight: 700; }
            .v { color: #111827; }
            ul { margin: 6px 0 0; padding-left: 18px; }
            .tag { display: inline-block; padding: 4px 10px; border-radius: 999px; color: #fff; font-weight: 700; }
            .paid { background: #15803d; }
            .pending { background: #ca8a04; }
            .cancelled { background: #64748b; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Order Report #${selectedOrder.order_id}</h1>
          <div class="grid">
            <div class="k">Placed date</div><div class="v">${selectedOrder.placed_date || "-"}</div>
            <div class="k">Expected delivery</div><div class="v">${selectedOrder.expected_delivery_date || "-"}</div>
            <div class="k">Customer</div><div class="v">${selectedOrder.customer_name || "-"}</div>
            <div class="k">Order status</div><div class="v">${selectedOrder.order_status || "-"}</div>
          </div>

          <h2>Order Details</h2>
          <div class="grid">
            <div class="k">Clothing type</div><div class="v">${selectedOrder.order_details?.clothing_type || "-"}</div>
            <div class="k">Size</div><div class="v">${selectedOrder.order_details?.size || "-"}</div>
            <div class="k">Color</div><div class="v">${selectedOrder.order_details?.color || "-"}</div>
            <div class="k">Design description</div><div class="v">${selectedOrder.order_details?.design_description || "-"}</div>
            <div class="k">Design image</div><div class="v">${designImage}</div>
          </div>

          <h2>Status Timeline</h2>
          <ul>${statusRows || "<li>-</li>"}</ul>

          <h2>Payment</h2>
          <div class="grid">
            <div class="k">Total</div><div class="v">${formatNPR(selectedOrder.payment?.total_price)}</div>
            <div class="k">Paid</div><div class="v">${formatNPR(selectedOrder.payment?.paid_amount)}</div>
            <div class="k">Remaining</div><div class="v">${formatNPR(selectedOrder.payment?.remaining_amount)}</div>
            <div class="k">Status</div><div class="v">
              <span class="tag ${
                selectedOrder.payment?.status === "Paid"
                  ? "paid"
                  : selectedOrder.payment?.status === "Pending"
                    ? "pending"
                    : "cancelled"
              }">${selectedOrder.payment?.status || "-"}</span>
            </div>
          </div>

          <h2>Shipping</h2>
          <div class="grid">
            <div class="k">Method</div><div class="v">${selectedOrder.shipping?.method || "-"}</div>
            <div class="k">Tracking number</div><div class="v">${selectedOrder.shipping?.tracking_number || "-"}</div>
            <div class="k">Address</div><div class="v">${selectedOrder.shipping?.address || "-"}</div>
          </div>

          <h2>Messages</h2>
          <ul>${msgRows || "<li>-</li>"}</ul>

          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <h1 style={s.title}>Track order</h1>
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

      {paymentNotice ? <p style={s.notice}>{paymentNotice}</p> : null}

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
              {o.order_id} • {o.order_status}
            </button>
          ))}
        </div>
      ) : null}

      {selectedOrder && (
        <div style={s.stack}>
          <div style={s.reportActions}>
            <button type="button" style={s.reportBtn} onClick={handlePrintReport}>
              Print / Save PDF
            </button>
          </div>
          {loggedIn && selectedOrder.cancel_eligible ? (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Cancel order</h2>
              <p style={s.policyText}>
                You can cancel while the order is still <strong>pending</strong>, <strong>confirmed</strong>, in{" "}
                <strong>quality check</strong>, or <strong>packed</strong> (before it ships). After cancellation,
                payment handling follows our standard refund timeline.
              </p>
              <button type="button" style={s.cancelOrderBtn} disabled={loading} onClick={handleCancelOrder}>
                {loading ? "Please wait…" : "Cancel this order"}
              </button>
            </div>
          ) : null}

          {selectedOrder.return_eligible ? (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Return (7-day window)</h2>
              <p style={s.policyText}>
                This order is eligible for a return under our <strong>7-day</strong> policy (from delivery). Return the
                item unworn with tags. Request a return by{" "}
                <strong>{selectedOrder.return_deadline_date || "the deadline shown in your email"}</strong> — email{" "}
                <a href="mailto:support@e-easie.com">support@e-easie.com</a> with your order number.
              </p>
            </div>
          ) : null}

          <div style={s.card}>
            <h2 style={s.cardTitle}>Order Details</h2>
            <div style={s.rows}>
              <Row label="Order ID" value={`${selectedOrder.order_id}`} />
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
                {canPayPendingOnline ? (
                  <button
                    type="button"
                    style={{
                      ...s.paymentTag,
                      ...s.paymentTagBtn,
                      background: STATUS_COLORS[selectedOrder.payment?.status] || "#64748b",
                    }}
                    onClick={handlePayPendingWithEsewa}
                    disabled={esewaResumeBusy}
                    title="Pay the remaining balance with eSewa"
                    aria-label="Pay with eSewa; order payment is pending"
                  >
                    {esewaResumeBusy ? "Opening eSewa…" : selectedOrder.payment?.status}
                  </button>
                ) : (
                  <span
                    style={{
                      ...s.paymentTag,
                      background: STATUS_COLORS[selectedOrder.payment?.status] || "#64748b",
                    }}
                  >
                    {selectedOrder.payment?.status}
                  </span>
                )}
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
                <div
                  key={`${m.created_at}-${idx}`}
                  style={{
                    ...s.msgItem,
                    ...(idx > 0 ? s.msgItemDivider : {}),
                  }}
                >
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
  notice: {
    marginTop: "16px",
    padding: "12px 14px",
    background: "#ecfdf5",
    border: "1px solid #6ee7b7",
    borderRadius: "8px",
    color: "#065f46",
    fontSize: "15px",
    lineHeight: 1.45,
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
  reportActions: { display: "flex", justifyContent: "flex-end" },
  reportBtn: {
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
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
  paymentTagBtn: {
    border: "none",
    cursor: "pointer",
    font: "inherit",
    textAlign: "left",
    boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
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
  msgList: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    overflow: "hidden",
  },
  msgItem: { padding: "12px 14px" },
  msgItemDivider: { borderTop: "1px solid #e2e8f0" },
  msgMeta: { margin: 0, color: "#334155", fontSize: 12, fontWeight: 700 },
  msgText: { margin: "4px 0 0", color: "#0f172a", lineHeight: 1.5 },
  policyText: { margin: "0 0 12px 0", color: "#475569", fontSize: "14px", lineHeight: 1.55 },
  cancelOrderBtn: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #b91c1c",
    background: "#fff",
    color: "#b91c1c",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },
};
