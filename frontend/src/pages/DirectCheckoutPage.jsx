import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProduct, checkoutBuyNowWithEsewa, submitEsewaPaymentForm } from "../api";
import { formatNPR } from "../currency";
import { getProductImageSrc } from "../productImages";
import { useNotify } from "../contexts/NotifyContext";

export default function DirectCheckoutPage() {
  const toast = useNotify();
  const [searchParams, setSearchParams] = useSearchParams();
  const productIdParam = (searchParams.get("product") || "").trim();

  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [step, setStep] = useState("address");
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [esewaBusy, setEsewaBusy] = useState(false);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) return;
    const labels = {
      failed: "eSewa payment was cancelled or did not complete.",
      invalid_signature: "Payment verification failed (signature). Contact support if money was debited.",
      missing_data: "Payment response was incomplete. Try again or contact support.",
      not_complete: "Payment was not completed.",
      no_uuid: "Payment reference missing. Contact support if money was debited.",
      session_expired: "Payment session expired. If you were charged, contact support with your eSewa receipt.",
      bad_amount: "Payment amount mismatch.",
      amount_mismatch: "Payment amount did not match your order total.",
      status_check_failed: "Could not confirm payment with eSewa. Try again later or contact support.",
    };
    const message = labels[payment] || `Payment: ${payment.replace(/_/g, " ")}`;
    toast.warning({ title: "Payment", message, duration: 9000 });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("payment");
        return next;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    if (!productIdParam || !/^\d+$/.test(productIdParam)) {
      setLoadingProduct(false);
      setProduct(null);
      setLoadError("Missing or invalid product.");
      return;
    }
    let cancelled = false;
    setLoadingProduct(true);
    setLoadError(null);
    (async () => {
      try {
        const p = await fetchProduct(productIdParam);
        if (!cancelled) {
          setProduct(p);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setProduct(null);
          setLoadError(e.message || "Could not load this product.");
        }
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productIdParam]);

  const lineTotal = useMemo(() => {
    if (!product) return 0;
    const unit = Number(product.base_price);
    if (Number.isNaN(unit)) return 0;
    return unit * quantity;
  }, [product, quantity]);

  function combinedShippingForOrder() {
    const addr = shippingAddress.trim();
    const phone = phoneNumber.trim();
    if (!phone) return addr;
    return `Phone: ${phone}\n\n${addr}`;
  }

  function goProceed(e) {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      toast.warning("Shipping address", "Please enter your full shipping address to continue.");
      return;
    }
    const phone = phoneNumber.trim();
    if (!phone) {
      toast.warning("Phone number", "Please enter a contact phone number for delivery updates.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 8) {
      toast.warning("Phone number", "Please enter a valid phone number (at least 8 digits).");
      return;
    }
    setStep("payment");
  }

  async function handleEsewa(e) {
    e.preventDefault();
    if (!product) return;
    if (!shippingAddress.trim() || !phoneNumber.trim()) {
      toast.warning("Shipping details", "Please enter your shipping address and phone number before paying with eSewa.");
      return;
    }
    setEsewaBusy(true);
    try {
      const res = await checkoutBuyNowWithEsewa({
        product: product.id,
        quantity,
        shippingAddress: combinedShippingForOrder(),
      });
      if (res?.epay_url && res?.fields) {
        submitEsewaPaymentForm(res.epay_url, res.fields);
        return;
      }
      toast.error("eSewa", "Payment could not be started — gateway data was missing. Try again or contact support.");
    } catch (err) {
      toast.error("eSewa checkout", err.message || "Could not start eSewa. Check your connection and try again.");
    } finally {
      setEsewaBusy(false);
    }
  }

  if (!productIdParam) {
    return (
      <div style={s.wrap}>
        <p>No product selected.</p>
        <Link to="/category" style={s.link}>
          Browse shop
        </Link>
      </div>
    );
  }

  if (loadingProduct) {
    return (
      <div style={s.centered}>
        <p>Loading checkout…</p>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div style={s.wrap}>
        <p style={{ color: "#b91c1c" }}>{loadError || "Product not found."}</p>
        <p style={{ marginTop: "16px" }}>
          <Link to="/category" style={s.link}>
            Back to shop
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <nav style={s.breadcrumb}>
        <Link to="/category">Shop</Link>
        <span style={s.crumbSep}> / </span>
        <span style={s.crumbCurrent}>Checkout</span>
      </nav>
      <h1 style={s.title}>Checkout</h1>
      <p style={s.subtitle}>Review your item, enter your shipping details, then complete payment with eSewa.</p>

      <div style={s.container}>
        <div style={s.summaryCard}>
          <img src={getProductImageSrc(product)} alt={product.name} style={s.thumb} />
          <div style={s.summaryBody}>
            <h2 style={s.productName}>{product.name}</h2>
            <p style={s.meta}>{product.product_type_display || product.product_type}</p>
            <p style={s.priceLine}>
              {formatNPR(product.base_price)}
              {quantity > 1 ? ` × ${quantity}` : null}
            </p>
            {step === "address" ? (
              <div style={s.qtyRow} aria-label="Quantity">
                <span style={s.qtyLabel}>Quantity</span>
                <div style={s.qtyStepper}>
                  <button
                    type="button"
                    style={s.qtyBtn}
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span style={s.qtyValue}>{quantity}</span>
                  <button
                    type="button"
                    style={s.qtyBtn}
                    disabled={quantity >= 99}
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : null}
            <div style={s.totalRow}>
              <span>Total</span>
              <strong>{formatNPR(lineTotal)}</strong>
            </div>
          </div>
        </div>

        <div style={s.checkoutBox}>
          {step === "address" ? (
            <form onSubmit={goProceed}>
              <h2 style={s.boxTitle}>Shipping</h2>
              <label style={s.label}>
                Shipping address
                <textarea
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  style={s.textarea}
                  placeholder="Street, city, postal code…"
                  rows={5}
                />
              </label>
              <label style={{ ...s.label, marginTop: "16px" }}>
                Phone number
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={s.input}
                  placeholder="e.g. 98XXXXXXXX or +977-98XXXXXXXX"
                />
              </label>
              <button type="submit" style={s.primaryBtn}>
                Proceed to checkout
              </button>
            </form>
          ) : (
            <div>
              <h2 style={s.boxTitle}>Payment</h2>
              <div style={s.shipBlock}>
                <p style={s.shipPreview}>
                  <span style={s.shipLabel}>Phone</span>
                  <span style={s.shipText}>{phoneNumber.trim()}</span>
                </p>
                <p style={s.shipPreview}>
                  <span style={s.shipLabel}>Address</span>
                  <span style={s.shipText}>{shippingAddress.trim()}</span>
                </p>
              </div>
              <button type="button" style={s.textBtn} onClick={() => setStep("address")}>
                Edit address
              </button>
              <div style={{ marginTop: "20px" }}>
                <button type="button" disabled={esewaBusy} style={s.esewaBtn} onClick={handleEsewa}>
                  {esewaBusy ? "Starting eSewa…" : "Pay with eSewa"}
                </button>
                <p style={s.payHint}>
                  eSewa opens in a secure window. Test wallet: 9806800001 / Nepal@123 (token 123456).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { padding: "40px 24px", maxWidth: "900px", margin: "0 auto" },
  centered: { padding: "60px 24px", textAlign: "center" },
  breadcrumb: { fontSize: "13px", color: "#64748b", marginBottom: "16px" },
  crumbSep: { color: "#94a3b8" },
  crumbCurrent: { color: "#1a1a2e", fontWeight: 600 },
  link: { color: "#1a1a2e", fontWeight: 700 },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a1a2e", margin: "0 0 8px 0" },
  subtitle: { color: "#64748b", margin: "0 0 28px 0", maxWidth: "560px", lineHeight: 1.5 },
  container: { display: "flex", gap: "28px", alignItems: "flex-start", flexWrap: "wrap" },
  summaryCard: {
    flex: "1 1 320px",
    display: "flex",
    gap: "20px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    background: "#fff",
  },
  thumb: { width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", background: "#f1f5f9" },
  summaryBody: { flex: 1, minWidth: 0 },
  productName: { margin: "0 0 6px 0", fontSize: "18px", fontWeight: 800, color: "#1a1a2e" },
  meta: { margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", fontWeight: 600 },
  priceLine: { margin: "0 0 12px 0", fontWeight: 700, color: "#334155" },
  qtyRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  qtyLabel: { fontSize: "14px", fontWeight: 600, color: "#475569" },
  qtyStepper: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#fff",
  },
  qtyBtn: {
    width: "34px",
    height: "34px",
    border: "none",
    background: "#f0f2f5",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: 700,
    lineHeight: 1,
    color: "#1a1a2e",
    padding: 0,
  },
  qtyValue: {
    minWidth: "34px",
    textAlign: "center",
    fontSize: "15px",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "12px",
    borderTop: "1px solid #e2e8f0",
    fontSize: "17px",
    color: "#1a1a2e",
  },
  checkoutBox: {
    flex: "0 1 360px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "24px",
    background: "#fafafa",
  },
  boxTitle: { fontSize: "18px", fontWeight: 800, margin: "0 0 16px 0", color: "#1a1a2e" },
  label: { display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#334155" },
  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    minHeight: "120px",
    marginTop: "8px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    marginTop: "8px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: "15px",
  },
  shipBlock: { marginBottom: "4px" },
  primaryBtn: {
    width: "100%",
    marginTop: "18px",
    background: "#1a1a2e",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  shipPreview: { margin: "0 0 10px 0", fontSize: "14px", lineHeight: 1.5, color: "#475569" },
  shipLabel: { display: "block", fontWeight: 700, color: "#1a1a2e", marginBottom: "4px" },
  shipText: { whiteSpace: "pre-wrap" },
  textBtn: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#2563eb",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "underline",
  },
  esewaBtn: {
    width: "100%",
    background: "#60bb46",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  payHint: { fontSize: "12px", color: "#64748b", marginTop: "12px", lineHeight: 1.4, marginBottom: 0 },
};
