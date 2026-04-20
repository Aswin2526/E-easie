import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchCart, patchCartItem, removeCartItem, checkoutCartWithEsewa, submitEsewaPaymentForm } from "../api";
import { formatNPR } from "../currency";
import {
  customizationUnitPrice,
  effectiveCatalogPartColors,
  fabricMarkupApplies,
  nonDefaultPartColorsMarkup,
} from "../pricing";
import { getProductImageSrc, getProductImageStyle } from "../productImages";
import { useNotify } from "../contexts/NotifyContext";

export default function CartPage() {
  const toast = useNotify();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [esewaBusy, setEsewaBusy] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [qtyBusyId, setQtyBusyId] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadCart();
  }, []);

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
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, toast]);

  async function loadCart() {
    setLoading(true);
    try {
      const data = await fetchCart();
      setCart(data);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError(err.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  async function changeCartItemQuantity(item, delta) {
    const next = Math.min(99, Math.max(1, item.quantity + delta));
    if (next === item.quantity) return;
    setQtyBusyId(item.id);
    try {
      await patchCartItem(item.id, { quantity: next });
      await loadCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      toast.error("Cart", err.message || "Could not update quantity.");
    } finally {
      setQtyBusyId(null);
    }
  }

  async function handleRemove(itemId) {
    if (!window.confirm("Remove this item from your cart?")) return;
    try {
      await removeCartItem(itemId);
      await loadCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      toast.error("Cart", err.message || "Could not remove this item.");
    }
  }

  function combinedShippingForCheckout() {
    const addr = shippingAddress.trim();
    const phone = contactNumber.trim();
    if (!phone) return addr;
    return `Phone: ${phone}\n\n${addr}`;
  }

  async function handleEsewaCheckout(e) {
    e.preventDefault();
    if (!cart || !cart.items || cart.items.length === 0) return;
    if (!shippingAddress.trim()) {
      toast.warning("Shipping address", "Please enter your shipping address before paying with eSewa.");
      return;
    }
    const phone = contactNumber.trim();
    if (!phone) {
      toast.warning("Contact number", "Please enter a contact phone number for delivery updates.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 8) {
      toast.warning("Contact number", "Please enter a valid phone number (at least 8 digits).");
      return;
    }
    setEsewaBusy(true);
    try {
      const res = await checkoutCartWithEsewa(combinedShippingForCheckout());
      window.dispatchEvent(new Event("cart-updated"));
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

  if (loading) return <div style={s.centered}>Loading Cart...</div>;
  if (error) return <div style={s.centered}><p style={{color:"red"}}>{error}</p></div>;

  function cartLineUnit(item) {
    const p = item.product_detail;
    if (!item.customization || !item.customization_detail) return parseFloat(p.base_price);
    const cust = item.customization_detail;
    const ref = effectiveCatalogPartColors(p, p.product_type);
    return customizationUnitPrice(p.base_price, cust.fabric, {
      partColors: cust.part_colors || {},
      catalogReferencePartColors: ref,
      defaultFabric: p.default_fabric,
    });
  }

  const items = cart?.items || [];
  const total = items.reduce((acc, item) => acc + cartLineUnit(item) * item.quantity, 0);

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Shopping Cart</h1>
      {items.length === 0 ? (
        <p style={{ marginTop: 20 }}>Your cart is empty. <Link to="/category">Browse Products</Link></p>
      ) : (
        <div style={s.container}>
          <div style={s.itemsList}>
            {items.map((item) => {
              const p = item.product_detail;
              const unit = cartLineUnit(item);
              const cust = item.customization_detail;
              const ref = cust ? effectiveCatalogPartColors(p, p.product_type) : {};
              const fabAdj = cust && fabricMarkupApplies(cust.fabric, p.default_fabric);
              const colAdj = cust && nonDefaultPartColorsMarkup(cust.part_colors || {}, ref);
              return (
                <div key={item.id} style={s.cartItem}>
                  <img src={getProductImageSrc(p)} alt={p.name} style={{ ...s.itemImage, ...getProductImageStyle(p) }} />
                  <div style={s.itemDetails}>
                    <h3 style={s.itemName}>{p.name}</h3>
                    <div style={s.qtyRow} aria-label="Quantity">
                      <span style={s.itemMeta}>Qty</span>
                      <div style={s.qtyStepper}>
                        <button
                          type="button"
                          style={s.qtyBtn}
                          disabled={qtyBusyId === item.id || item.quantity <= 1}
                          onClick={() => changeCartItemQuantity(item, -1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span style={s.qtyValue}>{item.quantity}</span>
                        <button
                          type="button"
                          style={s.qtyBtn}
                          disabled={qtyBusyId === item.id || item.quantity >= 99}
                          onClick={() => changeCartItemQuantity(item, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p style={s.itemPrice}>{formatNPR(unit)}</p>
                    {!item.customization ? (
                      <p style={s.warningText}>Direct purchase item (no customization)</p>
                    ) : (
                      <p style={s.successText}>
                        Customization applied
                        {fabAdj ? " · +25% vs original fabric" : ""}
                        {colAdj ? " · +20% vs original colors" : ""}
                      </p>
                    )}
                  </div>
                  <div style={s.itemActions}>
                    {!item.customization && (
                      <button style={s.btnPrimary} onClick={() => navigate(`/customize?category=${p.product_type}&product=${p.id}&primary=${p.id}`)}>
                        Customize
                      </button>
                    )}
                    <button style={s.btnDanger} onClick={() => handleRemove(item.id)}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={s.checkoutBox}>
            <h2 style={s.summaryTitle}>Order Summary</h2>
            <div style={s.summaryRow}>
              <span>Total items</span>
              <span>{items.length}</span>
            </div>
            <div style={s.summaryRowBold}>
              <span>Subtotal</span>
              <span>{formatNPR(total)}</span>
            </div>
            <div style={{ marginTop: 20 }}>
              <label style={s.label}>
                Shipping Address
                <textarea
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  style={s.textarea}
                  placeholder="Enter your full address"
                />
              </label>
              <label style={{ ...s.label, marginTop: 16 }}>
                Contact number
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  style={s.textInput}
                  placeholder="e.g. 98XXXXXXXX or +977-98XXXXXXXX"
                />
              </label>
              <button type="button" disabled={esewaBusy} style={s.esewaBtn} onClick={handleEsewaCheckout}>
                {esewaBusy ? "Starting eSewa…" : "Pay with eSewa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { padding: "40px", maxWidth: "1200px", margin: "0 auto" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a1a2e", marginBottom: "24px" },
  centered: { padding: "60px 24px", textAlign: "center" },
  container: { display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" },
  itemsList: { flex: "1 1 600px", display: "flex", flexDirection: "column", gap: "16px" },
  cartItem: {
    display: "flex",
    padding: "16px",
    border: "1px solid #eee",
    borderRadius: "8px",
    background: "#fff",
    gap: "20px",
    overflow: "hidden",
  },
  itemImage: { width: "100px", height: "100px", objectFit: "cover", borderRadius: "6px", background: "#f5f5f5" },
  itemDetails: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" },
  itemName: { fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" },
  itemMeta: { color: "#666", margin: 0, fontSize: "14px", fontWeight: 600 },
  qtyRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "6px 0 4px 0",
  },
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
  itemPrice: { fontWeight: "bold", margin: "0 0 4px 0" },
  warningText: { color: "#d9534f", fontSize: "13px", fontWeight: "bold", margin: 0 },
  successText: { color: "#5cb85c", fontSize: "13px", fontWeight: "bold", margin: 0 },
  itemActions: { display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" },
  btnPrimary: { background: "#1a1a2e", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  btnDanger: { background: "transparent", color: "#d9534f", border: "1px solid #d9534f", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  checkoutBox: { flex: "0 1 350px", border: "1px solid #eee", borderRadius: "8px", padding: "24px", background: "#fafafa" },
  summaryTitle: { fontSize: "20px", fontWeight: "bold", marginBottom: "20px", marginTop: 0 },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: "12px", color: "#444" },
  summaryRowBold: { display: "flex", justifyContent: "space-between", marginBottom: "12px", fontWeight: "bold", fontSize: "18px", borderTop: "1px solid #ddd", paddingTop: "12px" },
  label: { display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "12px" },
  textarea: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", minHeight: "80px", marginTop: "6px", boxSizing: "border-box", fontFamily: "inherit" },
  textInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginTop: "6px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: "15px",
  },
  esewaBtn: {
    width: "100%",
    background: "#60bb46",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "16px",
  },
};
