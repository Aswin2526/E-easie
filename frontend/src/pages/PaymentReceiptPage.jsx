import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchPaymentReceipt } from "../api";
import { formatNPR } from "../currency";

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

export default function PaymentReceiptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ref = searchParams.get("ref");
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    if (!ref) {
      setError("Missing receipt reference. Return to cart and complete payment again.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPaymentReceipt(ref);
        if (!cancelled) setReceipt(data);
      } catch (err) {
        const msg =
          typeof err?.data === "object" && err.data?.detail
            ? err.data.detail
            : err.message || "Could not load receipt.";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ref]);

  const orderNumberLabel = useCallback(() => {
    if (!receipt?.order_numbers?.length) return "—";
    if (receipt.order_numbers.length === 1) return `#${receipt.primary_order_id}`;
    return receipt.order_numbers.map((id) => `#${id}`).join(", ");
  }, [receipt]);

  const footerOrderPhrase = useCallback(() => {
    if (!receipt?.order_numbers?.length) return "your order";
    if (receipt.order_numbers.length === 1) return `order #${receipt.primary_order_id}`;
    return `orders ${receipt.order_numbers.map((id) => `#${id}`).join(", ")}`;
  }, [receipt]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const node = printRef.current;
    if (!node) return;
    const styles = `
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; padding: 24px; color: #1a1a2e; }
      h1 { font-size: 22px; margin: 0 0 8px; }
      .sub { color: #64748b; margin-bottom: 24px; }
      .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
      .label { color: #64748b; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
      td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
      .total-row { font-weight: 700; border-top: 2px solid #e5e7eb; }
      .banner { margin-top: 24px; padding: 16px; background: #28a745; color: #fff; border-radius: 8px; }
    `;
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) {
      window.print();
      return;
    }
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>E-easie Payment Receipt</title><style>${styles}</style></head><body>${node.innerHTML}</body></html>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 250);
  };

  if (loading) {
    return (
      <div style={s.page}>
        <p style={s.muted}>Loading receipt…</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div style={s.page}>
        <p style={s.err}>{error || "Receipt unavailable."}</p>
        <Link to="/cart" style={s.linkBtn}>
          Back to cart
        </Link>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{`
        @media print {
          nav { display: none !important; }
          footer { display: none !important; }
          .receipt-no-print { display: none !important; }
          .receipt-print-root { box-shadow: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="receipt-no-print" style={s.toolbar}>
        <Link to="/track-order" style={s.orderHistory}>
          Order history
        </Link>
        <div style={s.toolbarBtns}>
          <button type="button" style={s.btnGreen} onClick={handleDownloadPdf}>
            Download PDF
          </button>
          <button type="button" style={s.btnOutline} onClick={handlePrint}>
            Print receipt
          </button>
          <button type="button" style={s.btnBlue} onClick={() => navigate("/", { replace: true })}>
            Continue to home
          </button>
        </div>
      </div>

      <div ref={printRef} className="receipt-print-root" style={s.card}>
        <h1 style={s.title}>{receipt.title || "E-easie Payment Receipt"}</h1>
        <p style={s.subtitle}>{receipt.subtitle || "E-easie · Paid via eSewa"}</p>

        <div style={s.divider} />

        <ReceiptRow label="Order number" value={orderNumberLabel()} valueBold />
        <ReceiptRow label="Merchant code" value={receipt.merchant_code || "—"} />
        <ReceiptRow label="Payment status" value={receipt.payment_status || "—"} />
        <ReceiptRow label="Amount paid" value={formatNPR(receipt.amount_paid)} valueBold />
        <ReceiptRow label="Paid at" value={formatDateTime(receipt.paid_at)} />
        <ReceiptRow label="Customer name" value={receipt.customer_name || "—"} />
        <ReceiptRow label="Shipping address" value={receipt.shipping_address || "—"} />
        <ReceiptRow label="Order placed" value={formatDateTime(receipt.order_placed)} />

        {receipt.transaction_code ? (
          <ReceiptRow label="Transaction code" value={receipt.transaction_code} />
        ) : null}

        <h2 style={s.itemsHeading}>Items</h2>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Product</th>
              <th style={{ ...s.th, width: 56 }}>Qty</th>
              <th style={{ ...s.th, width: 110 }}>Unit</th>
              <th style={{ ...s.th, width: 120, textAlign: "right" }}>Line total</th>
            </tr>
          </thead>
          <tbody>
            {(receipt.items || []).map((row, idx) => (
              <tr key={`${row.product}-${idx}`}>
                <td style={s.td}>{row.product}</td>
                <td style={s.td}>{row.qty}</td>
                <td style={s.td}>{formatNPR(row.unit)}</td>
                <td style={{ ...s.td, textAlign: "right" }}>{formatNPR(row.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={s.totalRow}>
          <span style={s.totalLabel}>Order total</span>
          <span style={s.totalValue}>{formatNPR(receipt.amount_paid)}</span>
        </div>

        <p style={s.footerNote}>
          This receipt confirms payment processed through eSewa for {footerOrderPhrase()}. For support, contact E-easie with
          your order number{receipt.order_numbers?.length > 1 ? "s" : ""}.
        </p>

        <div style={s.successBanner}>
          <div style={s.successIcon} aria-hidden>
            ✓
          </div>
          <div>
            <div style={s.successTitle}>Payment successful</div>
            <div style={s.successSub}>Your eSewa payment was received. Keep this receipt for your records.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, valueBold }) {
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={{ ...s.detailValue, ...(valueBold ? s.detailValueBold : {}) }}>{value}</span>
    </div>
  );
}

const s = {
  page: {
    minHeight: "calc(100vh - 84px)",
    background: "#e8eef4",
    padding: "28px 20px 48px",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
  },
  muted: { color: "#64748b", textAlign: "center", padding: "40px" },
  err: { color: "#b91c1c", marginBottom: "16px", maxWidth: 520, margin: "0 auto 16px" },
  linkBtn: { color: "#2563eb", fontWeight: 600, display: "block", textAlign: "center" },
  toolbar: {
    maxWidth: 720,
    margin: "0 auto 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "14px",
  },
  orderHistory: {
    color: "#3b71ca",
    fontWeight: 600,
    fontSize: "15px",
    textDecoration: "none",
  },
  toolbarBtns: { display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" },
  btnGreen: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  btnOutline: {
    background: "#fff",
    color: "#1a1a2e",
    border: "1px solid #cbd5e1",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  btnBlue: {
    background: "#3b71ca",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  card: {
    maxWidth: 720,
    margin: "0 auto",
    background: "#fff",
    borderRadius: "16px",
    padding: "32px 36px 28px",
    boxShadow: "0 4px 24px rgba(15, 23, 42, 0.08)",
  },
  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 800,
    color: "#1a1a2e",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "10px 0 0",
    fontSize: "15px",
    color: "#64748b",
  },
  divider: { height: 1, background: "#e5e7eb", margin: "24px 0 8px" },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    padding: "14px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  detailLabel: { color: "#64748b", fontSize: "15px", flexShrink: 0 },
  detailValue: {
    fontSize: "15px",
    color: "#1a1a2e",
    textAlign: "right",
    maxWidth: "58%",
    wordBreak: "break-word",
  },
  detailValueBold: { fontWeight: 800, fontSize: "16px" },
  itemsHeading: {
    margin: "28px 0 12px",
    fontSize: "17px",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    fontSize: "15px",
    padding: "14px 0",
    borderBottom: "1px solid #f1f5f9",
    color: "#1a1a2e",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "20px",
    marginTop: "8px",
    borderTop: "2px solid #e5e7eb",
  },
  totalLabel: { fontSize: "16px", fontWeight: 700, color: "#1a1a2e" },
  totalValue: { fontSize: "18px", fontWeight: 800, color: "#1a1a2e" },
  footerNote: {
    marginTop: "28px",
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: 1.55,
  },
  successBanner: {
    marginTop: "28px",
    background: "#28a745",
    borderRadius: "10px",
    padding: "18px 20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    color: "#fff",
  },
  successIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 800,
    flexShrink: 0,
  },
  successTitle: { fontSize: "17px", fontWeight: 800, marginBottom: "6px" },
  successSub: { fontSize: "14px", opacity: 0.95, lineHeight: 1.45 },
};
