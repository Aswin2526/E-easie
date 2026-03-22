import React from "react";
import { Link, NavLink } from "react-router-dom";

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
        <span style={styles.icon} aria-hidden>
          🔍
        </span>
        <span style={styles.icon} aria-hidden>
          🛒
          <span style={styles.badge}>0</span>
        </span>
        <Link to="/login" style={styles.authLink}>
          👤 Sign In
        </Link>
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
    gap: "20px",
  },
  icon: { fontSize: "18px", cursor: "pointer" },
  badge: {
    fontSize: "10px",
    background: "#000",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 5px",
    verticalAlign: "top",
    marginLeft: "-5px",
  },
  authLink: {
    textDecoration: "none",
    color: "#1a1a2e",
    fontSize: "14px",
    fontWeight: "600",
  },
};
