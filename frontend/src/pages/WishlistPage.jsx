import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchWishlist, removeFromWishlist, addToCart } from "../api";
import { formatNPR } from "../currency";
import { getProductImageSrc } from "../productImages";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    setLoading(true);
    try {
      const data = await fetchWishlist();
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id) {
    if (!window.confirm("Remove this item from your wishlist?")) return;
    try {
      await removeFromWishlist(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message || "Failed to remove item.");
    }
  }

  async function handleAddToCart(product) {
    try {
      await addToCart({ product: product.id, quantity: 1 });
      alert("Added to cart!");
    } catch (err) {
      alert(err.message || "Failed to add to cart.");
    }
  }

  if (loading) return <div style={s.centered}>Loading Wishlist...</div>;
  if (error) return <div style={s.centered}><p style={{color:"red"}}>{error}</p></div>;

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>My Wishlist</h1>
      {items.length === 0 ? (
        <p style={{ marginTop: 20 }}>Your wishlist is empty. <Link to="/category">Browse Products</Link></p>
      ) : (
        <div style={s.grid}>
          {items.map((item) => {
            const p = item.product_detail;
            return (
              <article key={item.id} style={s.card}>
                <div style={s.imgWrap}>
                  <img src={getProductImageSrc(p)} alt={p.name} style={s.img} />
                </div>
                <div style={s.cardBody}>
                  <h3 style={s.cardTitle}>{p.name}</h3>
                  <p style={s.price}>{formatNPR(p.base_price)}</p>
                  <div style={s.buttonGroup}>
                    <button style={s.btnPrimary} onClick={() => handleAddToCart(p)}>Add to Cart</button>
                    <button style={s.btnSecondary} onClick={() => navigate(`/customize?category=${p.product_type}&product=${p.id}&primary=${p.id}`)}>Customize</button>
                    <button style={s.btnDanger} onClick={() => handleRemove(item.id)}>Remove</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { padding: "40px", maxWidth: "1200px", margin: "0 auto" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a1a2e" },
  centered: { padding: "60px 24px", textAlign: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px", marginTop: "20px" },
  card: { background: "#fafafa", borderRadius: "10px", overflow: "hidden", border: "1px solid #eee", display: "flex", flexDirection: "column" },
  imgWrap: { height: "220px", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  cardBody: { padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" },
  cardTitle: { fontSize: "16px", fontWeight: "700", margin: 0 },
  price: { color: "#444", margin: 0 },
  buttonGroup: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "auto" },
  btnPrimary: { background: "#1a1a2e", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", flex: 1 },
  btnSecondary: { background: "transparent", color: "#1a1a2e", border: "1px solid #1a1a2e", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", flex: 1 },
  btnDanger: { background: "transparent", color: "#d9534f", border: "1px solid #d9534f", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", width: "100%" }
};
