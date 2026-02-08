import React from "react";
import { Link } from "react-router-dom";
import heroBanner from "../assets/hero_banner.png";
import classicLinenShirt from "../assets/classic_linen_shirt.png";
import summerFloralDress from "../assets/summer_floral_dress.png";
import tailoredWoolSuit from "../assets/tailored_wool_suit.png";
import casualDenimJacket from "../assets/casual_denim_jacket.png";

export default function Homepage() {
    return (
        <div style={styles.container}>
            {/* Navbar */}
            <nav style={styles.navbar}>
                <div style={styles.navLeft}>
                    <div style={styles.logoCircle}>
                        <span style={styles.logoText}>e-easie</span>
                    </div>
                </div>
                <div style={styles.navCenter}>
                    <Link to="/" style={styles.navLink}>HOME</Link>
                    <Link to="#" style={styles.navLink}>CATEGORY</Link>
                    <Link to="#" style={styles.navLink}>CUSTOMIZE</Link>
                    <Link to="#" style={styles.navLink}>TRACK ORDER</Link>
                </div>
                <div style={styles.navRight}>
                    <span style={styles.icon}>🔍</span>
                    <span style={styles.icon}>🛒<span style={styles.badge}>0</span></span>
                    <Link to="/login" style={styles.authLink}>👤 Sign In</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={styles.hero}>
                <div style={styles.heroOverlay}>
                    <h1 style={styles.heroTitle}>Wear Your Imagination.<br />Tailored For You.</h1>
                    <p style={styles.heroSubtitle}>
                        Design your own clothing or choose from our curated selection of fabrics, styles, and fits. Perfect fit, every time.
                    </p>
                    <div style={styles.heroButtons}>
                        <button style={{ ...styles.button, ...styles.primaryButton }}>Start Customizing ➜</button>
                        <button style={{ ...styles.button, ...styles.secondaryButton }}>Shop Collection</button>
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
            <section style={styles.trendingSection}>
                <div style={styles.trendingHeader}>
                    <h2 style={styles.sectionTitle}>Trending Styles</h2>
                    <a href="#" style={styles.viewAllLink}>View all</a>
                </div>

                <div style={styles.trendingGrid}>
                    <div style={styles.productCard}>
                        <img src={classicLinenShirt} alt="Classic Linen Shirt" style={styles.productImage} />
                        <div style={styles.productInfo}>
                            <h4 style={styles.productTitle}>Classic Linen Shirt</h4>
                            <p style={styles.productPrice}>$50</p>
                        </div>
                    </div>
                    <div style={styles.productCard}>
                        <img src={summerFloralDress} alt="Summer Floral Dress" style={styles.productImage} />
                        <div style={styles.productInfo}>
                            <h4 style={styles.productTitle}>Summer Floral Dress</h4>
                            <p style={styles.productPrice}>$120</p>
                        </div>
                    </div>
                    <div style={styles.productCard}>
                        <img src={tailoredWoolSuit} alt="Tailored Wool Suit" style={styles.productImage} />
                        <div style={styles.productInfo}>
                            <h4 style={styles.productTitle}>Tailored Wool Suit</h4>
                            <p style={styles.productPrice}>$280</p>
                        </div>
                    </div>
                    <div style={styles.productCard}>
                        <img src={casualDenimJacket} alt="Casual Denim Jacket" style={styles.productImage} />
                        <div style={styles.productInfo}>
                            <h4 style={styles.productTitle}>Casual Denim Jacket</h4>
                            <p style={styles.productPrice}>$110</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Call to Action */}
            <section style={styles.footerCTA}>
                <h2 style={styles.ctaTitle}>Ready to Create Your Masterpiece?</h2>
                <p style={styles.ctaText}>Join thousands of satisfied customers who have discovered the joy of perfectly fitted, custom-designed clothing.</p>
                <div style={styles.newsletter}>
                    <input type="email" placeholder="Enter your email address" style={styles.newsletterInput} />
                    <button style={styles.subscribeButton}>Subscribe</button>
                </div>
            </section>

            {/* Footer Links */}
            <footer style={styles.footer}>
                <div style={styles.footerContent}>
                    <div>
                        <div style={styles.logoCircleSmall}>
                            <span style={styles.logoTextSmall}>e-easie</span>
                        </div>
                        <p style={styles.footerText}>Custom tailored clothing delivered to your doorstep. Experience the perfect fit.</p>
                    </div>
                    <div>
                        <h4 style={styles.footerHeading}>Shop</h4>
                        <ul style={styles.footerList}>
                            <li>All Products</li>
                            <li>Custom Suits</li>
                            <li>Shirts</li>
                            <li>Dresses</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={styles.footerHeading}>Support</h4>
                        <ul style={styles.footerList}>
                            <li>Track Order</li>
                            <li>Size Guide</li>
                            <li>FAQs</li>
                            <li>Contact Us</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={styles.footerHeading}>Newsletter</h4>
                        <p style={styles.footerText}>Subscribe for latest trends and offers.</p>
                        <div style={styles.footerInputGroup}>
                            <input type="email" placeholder="Enter your email" style={styles.smallInput} />
                            <button style={styles.smallButton}>Subscribe</button>
                        </div>
                    </div>
                </div>
                <p style={styles.copyright}>© 2024 e-easie. All rights reserved.</p>
            </footer>
        </div>
    );
}

const styles = {
    container: {
        fontFamily: "'Arial', sans-serif",
        color: "#333",
    },
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "#fff",
    },
    navLeft: {
        display: "flex",
        alignItems: "center",
    },
    logoCircle: {
        background: "#000",
        color: "#fff",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginRight: "10px",
    },
    logoText: {
        fontWeight: "bold",
        fontSize: "10px",
    },
    navCenter: {
        display: "flex",
        gap: "30px",
    },
    navLink: {
        textDecoration: "none",
        color: "#333",
        fontSize: "12px",
        fontWeight: "600",
        letterSpacing: "1px",
    },
    navRight: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
    },
    icon: {
        fontSize: "18px",
        cursor: "pointer",
    },
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
        color: "#333",
        fontSize: "14px",
        fontWeight: "600",
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
        textDecoration: "underline",
        color: "#333",
        fontSize: "14px",
    },
    trendingGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "30px",
    },
    productCard: {
        background: "#fff",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    productImage: {
        width: "100%",
        height: "350px",
        objectFit: "cover",
    },
    productInfo: {
        padding: "15px",
    },
    productTitle: {
        fontSize: "16px",
        fontWeight: "bold",
        marginBottom: "5px",
    },
    productPrice: {
        fontSize: "14px",
        color: "#666",
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
    newsletter: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
    },
    newsletterInput: {
        padding: "10px 15px",
        borderRadius: "4px",
        border: "none",
        width: "300px",
    },
    subscribeButton: {
        padding: "10px 20px",
        background: "#fff",
        color: "#000",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
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
        flexWrap: "wrap",
        gap: "40px",
        marginBottom: "40px",
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
    footerInputGroup: {
        display: "flex",
        marginTop: "10px",
        gap: "5px"
    },
    smallInput: {
        padding: "5px",
        border: "1px solid #ddd",
        borderRadius: "4px"
    },
    smallButton: {
        padding: "5px 10px",
        background: "#000",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "10px"
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
