import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          E-easie
        </Link>
        <p style={styles.tagline}>Style that fits you.</p>
        <p style={styles.copy}>© {new Date().getFullYear()} E-easie. All rights reserved.</p>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    borderTop: "1px solid #eee",
    background: "#fafafa",
    padding: "28px 24px 32px",
    marginTop: "auto",
  },
  inner: {
    maxWidth: 960,
    margin: "0 auto",
    textAlign: "center",
  },
  logo: {
    display: "inline-block",
    textDecoration: "none",
    color: "#1a1a2e",
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: "0.04em",
    marginBottom: 8,
  },
  tagline: {
    margin: "0 0 12px",
    fontSize: 13,
    color: "#555",
    fontWeight: 600,
  },
  copy: {
    margin: 0,
    fontSize: 12,
    color: "#888",
  },
};
