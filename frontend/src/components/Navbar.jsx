import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuth, getStoredName, getStoredRole, getStoredToken, fetchCart } from "../api";

const linkStyle = ({ isActive }) => ({
  textDecoration: "none",
  color: "#1a1a2e",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  borderBottom: isActive ? "2px solid #1a1a2e" : "2px solid transparent",
  paddingBottom: "4px",
});

export default function Navbar() {
  const navigate = useNavigate();
  const token = getStoredToken();
  const role = getStoredRole();
  const storedName = getStoredName();
  const displayName = (storedName || "User").trim();
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);

  React.useEffect(() => {
    if (token) {
      fetchCart()
        .then(cart => setCartCount(cart?.items?.length || 0))
        .catch(() => setCartCount(0));
    } else {
      setCartCount(0);
    }
  }, [token]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    navigate(term ? `/category?q=${encodeURIComponent(term)}` : "/category");
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navLeft}>
        <Link to="/" style={styles.logoWrap}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>e-easie</span>
          </div>
        </Link>
      </div>
      <div style={styles.navCenter}>
        <NavLink to="/" end style={linkStyle}>
          HOME
        </NavLink>
        <NavLink to="/category" style={linkStyle}>
          CATEGORY
        </NavLink>
        <NavLink to="/customize" style={linkStyle}>
          CUSTOMIZE
        </NavLink>
        <NavLink to="/track-order" style={linkStyle}>
          TRACK ORDER
        </NavLink>
      </div>
      <div style={styles.navRight}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products"
            style={styles.searchInput}
          />
          <button type="submit" style={styles.iconBtn} aria-label="Search products">
            <svg viewBox="0 0 24 24" style={styles.svgIcon} aria-hidden>
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </form>
        <button
          type="button"
          onClick={() => navigate("/wishlist")}
          style={styles.iconBtn}
          aria-label="Wishlist"
          title="Wishlist"
        >
          <svg viewBox="0 0 24 24" style={styles.svgIcon} aria-hidden stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => navigate("/cart")}
          style={styles.iconBtn}
          aria-label="Open Cart"
          title="Cart"
        >
          <svg viewBox="0 0 24 24" style={styles.svgIcon} aria-hidden>
            <circle cx="9" cy="19" r="1.8" fill="currentColor" />
            <circle cx="17" cy="19" r="1.8" fill="currentColor" />
            <path
              d="M3 4h2l2.4 10.2a1 1 0 0 0 .97.78H18a1 1 0 0 0 .96-.72L21 8H7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
        </button>
        {token ? (
          <>
            <span style={styles.rolePill}>{`Hi, ${displayName}`}</span>
            {role === "admin" ? (
              <NavLink to="/admin/dashboard" style={styles.authLink}>
                Dashboard
              </NavLink>
            ) : null}
            <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.authLink}>
              👤 Sign In
            </Link>
            <Link to="/register" style={styles.authLink}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 40px",
    background: "#fff",
    borderBottom: "1px solid #eee",
  },
  navLeft: { display: "flex", alignItems: "center" },
  logoWrap: { textDecoration: "none" },
  logoCircle: {
    background: "#000",
    color: "#fff",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: { fontWeight: "bold", fontSize: "10px" },
  navCenter: {
    display: "flex",
    gap: "36px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  searchForm: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  searchInput: {
    width: "170px",
    border: "1px solid #cfd6ea",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "13px",
    outline: "none",
  },
  iconBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    border: "1px solid #d6dced",
    background: "#f7f9ff",
    color: "#1a1a2e",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    position: "relative",
  },
  svgIcon: {
    width: "18px",
    height: "18px",
  },
  badge: {
    fontSize: "10px",
    background: "#000",
    color: "#fff",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    display: "grid",
    placeItems: "center",
    position: "absolute",
    top: "-5px",
    right: "-5px",
  },
  authLink: {
    textDecoration: "none",
    color: "#1a1a2e",
    fontSize: "14px",
    fontWeight: "600",
  },
  rolePill: {
    background: "#d8ecff",
    color: "#123a69",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 700,
    border: "1px solid #b7d9fb",
  },
  logoutBtn: {
    border: "1px solid #b7d9fb",
    background: "#d8ecff",
    color: "#123a69",
    borderRadius: "8px",
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
