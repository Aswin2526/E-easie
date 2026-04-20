import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatNPR } from "../currency";
import heroBanner from "../assets/hero_banner.png";
import { trendingShowcaseBase, trendingShowcaseMore } from "../data/trendingShowcases";

const CONTACT_EMAIL = "weareasie25@gmail.com";
const CONTACT_PHONE = "9819106088";
const CONTACT_PHONE_TEL = "+9779819106088";
const CONTACT_ADDRESS = "Pokhara–Lamachour, street no. 7";
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "E-easie — Support request"
)}&body=${encodeURIComponent(
  `Hello E-easie team,\n\nI need help with:\n\n\nOrder number (if any):\n\n---\n${CONTACT_ADDRESS}\n`
)}`;

export default function HomePage() {
    const [showAllTrending, setShowAllTrending] = useState(false);
    const baseTrending = useMemo(() => trendingShowcaseBase, []);
    const moreTrending = useMemo(() => trendingShowcaseMore, []);
    const trendingItems = showAllTrending ? [...baseTrending, ...moreTrending] : baseTrending;

    return (
        <div style={styles.container}>
            {/* Hero Section */}
            <section style={styles.hero}>
                <div style={styles.heroOverlay}>
                    <h1 style={styles.heroTitle}>Wear Your Imagination.<br />Tailored For You.</h1>
                    <p style={styles.heroSubtitle}>
                        Design your own clothing or choose from our curated selection of fabrics, styles, and fits. Perfect fit, every time.
                    </p>
                    <div style={styles.heroButtons}>
                        <Link to="/customize" style={{ ...styles.button, ...styles.primaryButton, ...styles.heroLink }}>Start Customizing ➜</Link>
                        <Link to="/category" style={{ ...styles.button, ...styles.secondaryButton, ...styles.heroLink }}>Shop Collection</Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={styles.featuresSection}>
                <h2 style={styles.sectionTitle}>Why Choose Custom?</h2>
                <p style={styles.sectionSubtitle}>Experience the difference of clothing made just for you.</p>

                <div style={styles.featuresGrid}>
                    <div style={styles.featureItem}>
                        <div style={styles.featureIcon}>✂️</div>
                        <h3 style={styles.featureTitle}>Perfect Fit Guarantee</h3>
                        <p style={styles.featureText}>Our expert tailors ensure every garment fits your unique measurements perfectly.</p>
                    </div>
                    <div style={styles.featureItem}>
                        <div style={styles.featureIcon}>📏</div>
                        <h3 style={styles.featureTitle}>Premium Fabrics</h3>
                        <p style={styles.featureText}>Select from our curated collection of qual fabrics sourced globally.</p>
                    </div>
                    <div style={styles.featureItem}>
                        <div style={styles.featureIcon}>🚚</div>
                        <h3 style={styles.featureTitle}>Fast Delivery</h3>
                        <p style={styles.featureText}>Get your custom-made outfit delivered to your doorstep in as little as 7 days.</p>
                    </div>
                </div>
            </section>

            {/* Trending Styles Section */}
            <section id="trending" style={styles.trendingSection}>
                <div style={styles.trendingHeader}>
                    <h2 style={styles.sectionTitle}>Trending Styles</h2>
                    {showAllTrending ? (
                        <button
                            type="button"
                            style={styles.viewAllLink}
                            onClick={() => setShowAllTrending(false)}
                        >
                            Show less
                        </button>
                    ) : (
                        <button
                            type="button"
                            style={styles.viewAllLink}
                            onClick={() => setShowAllTrending(true)}
                        >
                            View all
                        </button>
                    )}
                </div>

                <div style={styles.trendingGrid}>
                    {trendingItems.map((item) => (
                        <Link
                            to={`/product/${item.showcaseSlug}`}
                            key={item.showcaseSlug}
                            style={{ ...styles.productCard, ...styles.productCardLink }}
                        >
                            <img src={item.img} alt={item.alt} style={styles.productImage} />
                            <div style={styles.productInfo}>
                                <h4 style={styles.productTitle}>{item.title}</h4>
                                <p style={styles.productPrice}>{formatNPR(item.price)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Footer Call to Action */}
            <section style={styles.footerCTA}>
                <h2 style={styles.ctaTitle}>Ready to Create Your Masterpiece?</h2>
                <p style={styles.ctaText}>Join thousands of satisfied customers who have discovered the joy of perfectly fitted, custom-designed clothing.</p>
            </section>

            {/* Footer Links */}
            <footer style={styles.footer}>
                <div style={styles.footerContent}>
                    <div style={styles.footerBrandCol}>
                        <div style={styles.logoCircleSmall}>
                            <span style={styles.logoTextSmall}>E-easie</span>
                        </div>
                        <p style={styles.footerText}>Custom tailored clothing delivered to your doorstep. Experience the perfect fit.</p>
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
    },
    hero: {
        backgroundImage: `url(${heroBanner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "600px",
        display: "flex",
        alignItems: "center",
        padding: "0 50px",
    },
    heroOverlay: {
        background: "rgba(255, 255, 255, 0.4)", // Slight overlay for text readability
        padding: "40px",
        borderRadius: "10px",
        backdropFilter: "blur(5px)",
        maxWidth: "600px",
    },
    heroTitle: {
        fontSize: "48px",
        fontWeight: "bold",
        marginBottom: "20px",
        lineHeight: "1.2",
        color: "#000",
    },
    heroSubtitle: {
        fontSize: "16px",
        marginBottom: "30px",
        color: "#333",
    },
    heroButtons: {
        display: "flex",
        gap: "15px",
    },
    button: {
        padding: "12px 24px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        border: "none",
        borderRadius: "4px",
    },
    primaryButton: {
        background: "#000",
        color: "#fff",
    },
    secondaryButton: {
        background: "transparent",
        border: "2px solid #000",
        color: "#000",
    },
    heroLink: {
        display: "inline-block",
        textAlign: "center",
        textDecoration: "none",
    },
    featuresSection: {
        padding: "80px 40px",
        textAlign: "center",
        background: "#fff",
    },
    sectionTitle: {
        fontSize: "28px",
        marginBottom: "10px",
        fontWeight: "bold",
    },
    sectionSubtitle: {
        fontSize: "14px",
        color: "#666",
        marginBottom: "50px",
    },
    featuresGrid: {
        display: "flex",
        justifyContent: "space-around",
        flexWrap: "wrap",
        gap: "30px",
    },
    featureItem: {
        maxWidth: "300px",
    },
    featureIcon: {
        fontSize: "30px",
        background: "#f2f2f2",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto 20px",
    },
    featureTitle: {
        fontSize: "18px",
        marginBottom: "10px",
        fontWeight: "bold",
    },
    featureText: {
        fontSize: "14px",
        color: "#666",
        lineHeight: "1.6",
    },
    trendingSection: {
        padding: "40px",
        background: "#f9f9f9",
    },
    trendingHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
    },
    viewAllLink: {
        background: "transparent",
        border: "none",
        textDecoration: "underline",
        color: "#333",
        fontSize: "14px",
        cursor: "pointer",
    },
    trendingGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "24px",
        alignItems: "stretch",
    },
    productCard: {
        background: "#fff",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
    },
    productCardLink: {
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
    },
    productImage: {
        width: "100%",
        height: "300px",
        objectFit: "cover",
    },
    productInfo: {
        padding: "15px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
    },
    productTitle: {
        fontSize: "16px",
        fontWeight: "bold",
        margin: "0 0 8px 0",
        lineHeight: 1.35,
        minHeight: "2.7em",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
    },
    productPrice: {
        fontSize: "14px",
        color: "#666",
        lineHeight: 1.35,
        minHeight: "1.35em",
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
    },
    ctaText: {
        fontSize: "14px",
        color: "#ccc",
        marginBottom: "30px",
        maxWidth: "600px",
        marginLeft: "auto",
        marginRight: "auto",
    },
    footer: {
        padding: "60px 40px 20px",
        background: "#fff",
        fontSize: "12px",
        color: "#666",
    },
    footerContent: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "28px 40px",
        marginBottom: "40px",
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
    },
    footerList: {
        listStyle: "none",
        padding: 0,
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
    }
};
