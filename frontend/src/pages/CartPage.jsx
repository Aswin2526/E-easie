import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchCart, removeCartItem, placeOrder } from "../api";
import { formatNPR } from "../currency";
import { getProductImageSrc } from "../productImages";

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

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

  async function handleRemove(itemId) {
    if (!window.confirm("Remove this item from your cart?")) return;
    try {
      await removeCartItem(itemId);
      await loadCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      alert(err.message || "Failed to remove item.");
    }
  }

  async function handleCheckout(e) {
    e.preventDefault();
    if (!cart || !cart.items || cart.items.length === 0) return;

    if (!shippingAddress.trim()) {
      alert("Please provide a shipping address.");
      return;
    }

    setCheckingOut(true);
    try {
      let successCount = 0;
      for (const item of cart.items) {
        const payload = {
          quantity: item.quantity,
          shipping_address: shippingAddress.trim(),
        };
        if (item.customization) {
          payload.customization = item.customization;
        } else {
          payload.product = item.product;
        }
        await placeOrder(payload);
        await removeCartItem(item.id);
        successCount++;
      }
      alert(`Successfully placed ${successCount} orders! Check 'Track Order' for status.`);
      window.dispatchEvent(new Event("cart-updated"));
      navigate("/track-order");
    } catch (err) {
      alert(err.message || "Checkout encountered an error.");
      await loadCart();
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) return <div style={s.centered}>Loading Cart...</div>;
  if (error) return <div style={s.centered}><p style={{color:"red"}}>{error}</p></div>;

  const items = cart?.items || [];
  const total = items.reduce((acc, item) => acc + (parseFloat(item.product_detail.base_price) * item.quantity), 0);

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
              return (
                <div key={item.id} style={s.cartItem}>
                  <img src={getProductImageSrc(p)} alt={p.name} style={s.itemImage} />
                  <div style={s.itemDetails}>
                    <h3 style={s.itemName}>{p.name}</h3>
                    <p style={s.itemMeta}>Quantity: {item.quantity}</p>
                    <p style={s.itemPrice}>{formatNPR(p.base_price)}</p>
                    {!item.customization ? (
                      <p style={s.warningText}>Direct purchase item (no customization)</p>
                    ) : (
                      <p style={s.successText}>Customization applied</p>
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
            <form onSubmit={handleCheckout} style={{ marginTop: 20 }}>
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
              <button disabled={checkingOut} style={s.checkoutBtn} type="submit">
                {checkingOut ? "Processing..." : "Proceed to Checkout"}
              </button>
            </form>
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
  cartItem: { display: "flex", padding: "16px", border: "1px solid #eee", borderRadius: "8px", background: "#fff", gap: "20px" },
  itemImage: { width: "100px", height: "100px", objectFit: "cover", borderRadius: "6px", background: "#f5f5f5" },
  itemDetails: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" },
  itemName: { fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" },
  itemMeta: { color: "#666", margin: "0 0 4px 0", fontSize: "14px" },
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
  checkoutBtn: { width: "100%", background: "#1a1a2e", color: "#fff", border: "none", padding: "14px", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "16px" },
};
