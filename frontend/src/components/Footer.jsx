import React from "react";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "weareasie25@gmail.com";
const CONTACT_PHONE = "9819106088";
const CONTACT_PHONE_TEL = "+9779819106088";
const CONTACT_ADDRESS = "Pokhara–Lamachour, street no. 7";
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "E-easie — Support request"
)}&body=${encodeURIComponent(
  `Hello E-easie team,\n\nI need help with:\n\n\nOrder number (if any):\n\n---\n${CONTACT_ADDRESS}\n`
)}`;

export default function Footer() {
  return (
    <div style={styles.container}>
      {/* Footer Call to Action */}
      <section style={styles.footerCTA}>
        <h2 style={styles.ctaTitle}>Ready to Create Your Masterpiece?</h2>
        <p style={styles.ctaText}>
          Join thousands of satisfied customers who have discovered the joy of perfectly fitted, custom-designed clothing.
        </p>
      </section>

      {/* Footer Links */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrandCol}>
            <div style={styles.logoCircleSmall}>
              <span style={styles.logoTextSmall}>E-easie</span>
            </div>
            <p style={styles.footerText}>
              Custom tailored clothing delivered to your doorstep. Experience the perfect fit.
            </p>
          </div>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerHeading}>Shop</h4>
            <ul style={styles.footerList}>
              <li><Link to="/" style={styles.footerLink}>Home</Link></li>
              <li><Link to="/category" style={styles.footerLink}>All Products</Link></li>
              <li><Link to="/customize" style={styles.footerLink}>Customize</Link></li>
            </ul>
          </div>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerHeading}>Support</h4>
            <ul style={styles.footerList}>
              <li><Link to="/track-order" style={styles.footerLink}>Track Order</Link></li>
              <li>
                <a href="https://www.wikihow.com/Measure-Your-Shirt-Size" target="_blank" rel="noreferrer" style={styles.footerLink}>
                  Size Guide
                </a>
              </li>
            </ul>
          </div>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerHeading}>Contact us</h4>
            <div style={styles.footerContactBlock}>
              <a href={CONTACT_MAILTO} style={{ ...styles.footerLink, ...styles.footerContactLine }}>
                {CONTACT_EMAIL}
              </a>
              <a href={`tel:${CONTACT_PHONE_TEL}`} style={{ ...styles.footerLink, ...styles.footerContactLine }}>
                {CONTACT_PHONE}
              </a>
              <span style={styles.footerContactAddress}>{CONTACT_ADDRESS}</span>
            </div>
          </div>
        </div>
        <p style={styles.copyright}>© 2024 E-easie. All rights reserved.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Arial', sans-serif",
    color: "#333",
    marginTop: "auto",
  },
  footerCTA: {
    padding: "80px 40px",
    background: "#1a1a1a",
    color: "#fff",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "28px",
    marginBottom: "15px",
    fontWeight: "bold",
    margin: "0 0 15px 0",
  },
  ctaText: {
    fontSize: "14px",
    color: "#ccc",
    marginBottom: "0",
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: "1.6",
  },
  footer: {
    padding: "60px 40px 20px",
    background: "#fff",
    fontSize: "12px",
    color: "#666",
    borderTop: "1px solid #eee",
  },
  footerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "28px 40px",
    marginBottom: "40px",
    maxWidth: "1200px",
    margin: "0 auto 40px",
  },
  footerBrandCol: {
    flex: "1 1 220px",
    minWidth: "200px",
    maxWidth: "280px",
  },
  footerColumn: {
    flex: "1 1 140px",
    minWidth: "120px",
    maxWidth: "220px",
  },
  logoCircleSmall: {
    background: "#000",
    color: "#fff",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "15px",
  },
  logoTextSmall: {
    fontSize: "8px",
    fontWeight: "bold"
  },
  footerHeading: {
    color: "#000",
    marginBottom: "15px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  footerList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    lineHeight: "2",
  },
  footerLink: {
    color: "#666",
    textDecoration: "none",
  },
  footerContactBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    lineHeight: 1.45,
    marginTop: "2px",
  },
  footerContactLine: {
    display: "block",
    fontSize: "12px",
  },
  footerContactAddress: {
    display: "block",
    fontSize: "12px",
    color: "#666",
    maxWidth: "200px",
  },
  footerText: {
    maxWidth: "200px",
    lineHeight: "1.5",
    marginBottom: "10px"
  },
  copyright: {
    textAlign: "center",
    borderTop: "1px solid #eee",
    paddingTop: "20px",
    margin: "0",
  }
};
