import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatNPR } from "../currency";
import heroBanner from "../assets/hero_banner.png";
import trendingGreenOffShoulderTop from "../assets/trending_green_off_shoulder_top.png";
import trendingBlackFloralMaxiSkirt from "../assets/trending_black_floral_maxi_skirt.png";
import trendingOliveLongCoat from "../assets/trending_olive_long_coat.png";
import trendingGreenJoggerPants from "../assets/trending_green_jogger_pants.png";
import trendingGreyDrawstringPants from "../assets/trending_grey_drawstring_pants.png";
import trendingSkyBlueButtonTop from "../assets/trending_sky_blue_button_top.png";
import trendingPuffSleeveBlueTop from "../assets/trending_puff_sleeve_blue_top.png";
import trendingBerryZipKnit from "../assets/trending_berry_zip_knit.png";
import trendingMaroonFloralCardigan from "../assets/trending_maroon_floral_cardigan.png";
import trendingTaupeWrapSkirt from "../assets/trending_taupe_wrap_skirt.png";

export default function HomePage() {
    const [showAllTrending, setShowAllTrending] = useState(false);
    const [newsletterEmail, setNewsletterEmail] = useState("");
    const [newsletterMessage, setNewsletterMessage] = useState("");
    const baseTrending = useMemo(
        () => [
            { img: trendingGreenOffShoulderTop, alt: "Green Off Shoulder Top", title: "Green Off-Shoulder Top", price: 2199 },
            { img: trendingBlackFloralMaxiSkirt, alt: "Black Floral Maxi Skirt", title: "Floral Maxi Skirt", price: 2899 },
            { img: trendingOliveLongCoat, alt: "Olive Long Coat", title: "Olive Long Coat", price: 6499 },
            { img: trendingGreenJoggerPants, alt: "Green Jogger Pants", title: "Green Jogger Pants", price: 2399 },
        ],
        []
    );
    const moreTrending = useMemo(
        () => [
            { img: trendingGreyDrawstringPants, alt: "Grey Drawstring Pants", title: "Grey Drawstring Pants", price: 2599 },
            { img: trendingSkyBlueButtonTop, alt: "Sky Blue Button Top", title: "Sky Blue Button Top", price: 2299 },
            { img: trendingPuffSleeveBlueTop, alt: "Blue Puff Sleeve Top", title: "Blue Puff Sleeve Top", price: 2499 },
            { img: trendingBerryZipKnit, alt: "Berry Zip Knit Top", title: "Berry Zip Knit Top", price: 2799 },
            { img: trendingMaroonFloralCardigan, alt: "Maroon Floral Cardigan", title: "Maroon Floral Cardigan", price: 3199 },
            { img: trendingTaupeWrapSkirt, alt: "Taupe Wrap Skirt", title: "Taupe Wrap Skirt", price: 2699 },
        ],
        []
    );
    const trendingItems = showAllTrending ? [...baseTrending, ...moreTrending] : baseTrending;

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        const email = newsletterEmail.trim();
        if (!email) {
            setNewsletterMessage("Please enter your email.");
            return;
        }
        const to = "support@e-easie.com";
        const subject = encodeURIComponent("Newsletter Subscription");
        const body = encodeURIComponent(`Please subscribe this email: ${email}`);
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
        setNewsletterMessage("Your email app is opening to confirm subscription.");
        setNewsletterEmail("");
    };

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
            <section style={styles.trendingSection}>
                <div style={styles.trendingHeader}>
                    <h2 style={styles.sectionTitle}>Trending Styles</h2>
                    {!showAllTrending && (
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
                        <div style={styles.productCard} key={item.title}>
                            <img src={item.img} alt={item.alt} style={styles.productImage} />
                            <div style={styles.productInfo}>
                                <h4 style={styles.productTitle}>{item.title}</h4>
                                <p style={styles.productPrice}>{formatNPR(item.price)}</p>
                            </div>
                        </div>
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
                    <div>
                        <div style={styles.logoCircleSmall}>
                            <span style={styles.logoTextSmall}>E-easie</span>
                        </div>
                        <p style={styles.footerText}>Custom tailored clothing delivered to your doorstep. Experience the perfect fit.</p>
                    </div>
                    <div>
                        <h4 style={styles.footerHeading}>Shop</h4>
                        <ul style={styles.footerList}>
                            <li><Link to="/category" style={styles.footerLink}>All Products</Link></li>
                            <li><Link to="/customize" style={styles.footerLink}>Custom Suits</Link></li>
                            <li><Link to="/category?q=shirt" style={styles.footerLink}>Shirts</Link></li>
                            <li><Link to="/category?q=dress" style={styles.footerLink}>Dresses</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={styles.footerHeading}>Support</h4>
                        <ul style={styles.footerList}>
                            <li><Link to="/track-order" style={styles.footerLink}>Track Order</Link></li>
                            <li><a href="https://www.wikihow.com/Measure-Your-Shirt-Size" target="_blank" rel="noreferrer" style={styles.footerLink}>Size Guide</a></li>
                            <li><a href="https://www.termsfeed.com/blog/sample-faq-template/" target="_blank" rel="noreferrer" style={styles.footerLink}>FAQs</a></li>
                            <li><a href="mailto:support@e-easie.com" style={styles.footerLink}>Contact Us</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={styles.footerHeading}>Newsletter</h4>
                        <p style={styles.footerText}>Subscribe for latest trends and offers.</p>
                        <form onSubmit={handleNewsletterSubmit} style={styles.newsletterForm}>
                            <input
                                type="email"
                                placeholder="Your email"
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                style={styles.newsletterInput}
                                aria-label="Newsletter email"
                            />
                            <button type="submit" style={styles.newsletterButton}>Subscribe</button>
                        </form>
                        {newsletterMessage ? <p style={styles.newsletterMessage}>{newsletterMessage}</p> : null}
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
    },
    productCard: {
        background: "#fff",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    productImage: {
        width: "100%",
        height: "300px",
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
    footerLink: {
        color: "#666",
        textDecoration: "none",
    },
    footerText: {
        maxWidth: "200px",
        lineHeight: "1.5",
        marginBottom: "10px"
    },
    newsletterForm: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        flexWrap: "wrap",
    },
    newsletterInput: {
        border: "1px solid #d3d3d3",
        borderRadius: "6px",
        padding: "8px 10px",
        minWidth: "180px",
    },
    newsletterButton: {
        border: "none",
        borderRadius: "6px",
        padding: "8px 12px",
        background: "#1a1a1a",
        color: "#fff",
        cursor: "pointer",
    },
    newsletterMessage: {
        marginTop: "8px",
        color: "#444",
        maxWidth: "260px",
        lineHeight: "1.4",
    },
    copyright: {
        textAlign: "center",
        borderTop: "1px solid #eee",
        paddingTop: "20px",
    }
};
