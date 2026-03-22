import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, mediaUrl } from "../api";
import tshirtFallback from "../assets/categories/tshirt.svg";
import hoodieFallback from "../assets/categories/hoodie.svg";
import pantFallback from "../assets/categories/pant.svg";
import shirtFallback from "../assets/categories/shirt.svg";
import skirtFallback from "../assets/categories/skirt.svg";
import jacketFallback from "../assets/categories/jacket.svg";
import jacketBeamBloom from "../assets/jackets/beam-bloom-olive-bomber.png";
import jacketNavyPuffer from "../assets/jackets/mens-navy-hooded-puffer.png";
import jacketOliveSuede from "../assets/jackets/olive-suede-harrington.png";
import jacketAdidas from "../assets/jackets/adidas-3stripes-khaki-hooded.png";
import jacketNorthFace from "../assets/jackets/north-face-cropped-puffer-light-blue.png";
import jacketShortDenim from "../assets/jackets/short-sleeve-textured-denim.png";
import jacketLongPuffer from "../assets/jackets/long-grey-puffer-parka.png";
import jacketHoodedDenim from "../assets/jackets/hooded-denim-hybrid.png";
import teeWhiteCrew from "../assets/tshirts/white-crew-neck-tee.png";
import teeBlackLong from "../assets/tshirts/black-long-sleeve-crew-tee.png";
import teeYellowPolo from "../assets/tshirts/yellow-polo-shirt.png";
import teeOversizedWhite from "../assets/tshirts/oversized-white-longline-tee.png";
import teeBlackCrop from "../assets/tshirts/black-crop-crew-tee.png";
import teeWhiteCrop from "../assets/tshirts/white-long-sleeve-crop-top.png";
import teeWhiteRelaxed from "../assets/tshirts/white-relaxed-long-sleeve-tee.png";
import teeBlueSleeveless from "../assets/tshirts/blue-sleeveless-ribbed-crop-top.png";
import shirtWhiteOxford from "../assets/shirts/white-oxford-dress-shirt.png";
import shirtBlackRibbed from "../assets/shirts/black-ribbed-short-sleeve-shirt.png";
import shirtSkyCheck from "../assets/shirts/sky-blue-check-long-sleeve.png";
import shirtWhitePocket from "../assets/shirts/white-short-sleeve-pocket-shirt.png";
import shirtElegantVneck from "../assets/shirts/elegant-white-vneck-blouse.png";
import shirtTexturedBlue from "../assets/shirts/textured-blue-gauze-button-down.png";
import shirtPastelColorblock from "../assets/shirts/pastel-colorblock-button-down-shirt.png";
import shirtOversizedLavender from "../assets/shirts/oversized-lavender-longline-shirt.png";
import skirtGreyPleated from "../assets/skirts/grey-pleated-mini-skirt.png";
import skirtPinkPlaid from "../assets/skirts/pink-plaid-pleated-mini-skirt.png";
import skirtWhiteTiered from "../assets/skirts/white-tiered-maxi-skirt.png";
import skirtBrownMaxi from "../assets/skirts/brown-high-waist-pleated-maxi-skirt.png";
import skirtBlackBodycon from "../assets/skirts/black-bodycon-mini-skirt.png";
import skirtBlackRuchedMaxi from "../assets/skirts/black-ruched-side-slit-maxi-skirt.png";
import skirtWhiteMiniSlit from "../assets/skirts/white-mini-side-slit-skirt.png";
import skirtDenimPencil from "../assets/skirts/high-waist-denim-pencil-skirt.png";
import pantBeigeTailored from "../assets/pants/classic-beige-tailored-trousers.png";
import pantCreamJoggers from "../assets/pants/slim-fit-cream-joggers.png";
import pantOliveChinoShorts from "../assets/pants/olive-chino-shorts.png";
import pantKhakiLinenShorts from "../assets/pants/khaki-linen-shorts.png";
import pantCharcoalWideDenim from "../assets/pants/charcoal-wide-leg-denim-jeans.png";
import pantBlackFormal from "../assets/pants/black-formal-trousers.png";
import pantDustyPinkWide from "../assets/pants/dusty-pink-wide-leg-pants.png";
import pantBlackLeggings from "../assets/pants/black-high-waist-leggings.png";
import hoodieHeatherGrey from "../assets/hoodies/heather-grey-oversized-pullover-hoodie.png";
import hoodieLightGreyZip from "../assets/hoodies/light-grey-full-zip-hoodie.png";
import hoodieBlackPullover from "../assets/hoodies/black-pullover-hoodie.png";
import hoodieMintQuarterZip from "../assets/hoodies/mint-quarter-zip-hoodie.png";
import hoodieTaupeCroppedZip from "../assets/hoodies/taupe-cropped-zip-hoodie.png";
import hoodieRoseGraphic from "../assets/hoodies/rose-oversized-graphic-hoodie.png";
import hoodieOffWhiteZip from "../assets/hoodies/off-white-oversized-zip-hoodie.png";

/** When the API has no product image, use a category illustration (replace files in assets/categories/ with your photos). */
const CATEGORY_FALLBACKS = {
  tshirt: tshirtFallback,
  hoodie: hoodieFallback,
  pant: pantFallback,
  shirt: shirtFallback,
  skirt: skirtFallback,
  jacket: jacketFallback,
};

/** Jacket catalog: bundled photos (replace PNGs in src/assets/jackets/ to update). Matches Product.slug from Django. */
const JACKET_IMAGES_BY_SLUG = {
  "beam-bloom-olive-bomber-jacket": jacketBeamBloom,
  "mens-navy-hooded-puffer": jacketNavyPuffer,
  "olive-suede-harrington": jacketOliveSuede,
  "adidas-3stripes-khaki-hooded": jacketAdidas,
  "north-face-cropped-puffer-light-blue": jacketNorthFace,
  "short-sleeve-textured-denim-jacket": jacketShortDenim,
  "long-grey-puffer-parka": jacketLongPuffer,
  "hooded-denim-hybrid-jacket": jacketHoodedDenim,
};

/** Hoodie catalog — seed_hoodie_products */
const HOODIE_IMAGES_BY_SLUG = {
  "heather-grey-oversized-pullover-hoodie": hoodieHeatherGrey,
  "light-grey-full-zip-hoodie": hoodieLightGreyZip,
  "black-pullover-hoodie": hoodieBlackPullover,
  "mint-quarter-zip-hoodie": hoodieMintQuarterZip,
  "taupe-cropped-zip-hoodie": hoodieTaupeCroppedZip,
  "rose-oversized-graphic-hoodie": hoodieRoseGraphic,
  "off-white-oversized-zip-hoodie": hoodieOffWhiteZip,
};

/** T-shirt catalog photos — matches Product.slug from seed_tshirt_products. */
const TSHIRT_IMAGES_BY_SLUG = {
  "classic-white-crew-neck-t-shirt": teeWhiteCrew,
  "black-long-sleeve-crew-neck-tee": teeBlackLong,
  "yellow-polo-shirt": teeYellowPolo,
  "oversized-white-longline-long-sleeve-tee": teeOversizedWhite,
  "black-crop-crew-neck-tee": teeBlackCrop,
  "white-long-sleeve-crop-top": teeWhiteCrop,
  "white-relaxed-long-sleeve-tee": teeWhiteRelaxed,
  "blue-sleeveless-ribbed-crop-top": teeBlueSleeveless,
};

/** Shirt catalog — seed_shirt_products */
const SHIRT_IMAGES_BY_SLUG = {
  "white-oxford-dress-shirt": shirtWhiteOxford,
  "black-ribbed-short-sleeve-shirt": shirtBlackRibbed,
  "sky-blue-check-long-sleeve-shirt": shirtSkyCheck,
  "white-short-sleeve-pocket-shirt": shirtWhitePocket,
  "elegant-white-vneck-blouse": shirtElegantVneck,
  "textured-blue-gauze-button-down": shirtTexturedBlue,
  "pastel-colorblock-button-down-shirt": shirtPastelColorblock,
  "oversized-lavender-longline-shirt": shirtOversizedLavender,
};

/** Skirt catalog — seed_skirt_products */
const SKIRT_IMAGES_BY_SLUG = {
  "grey-pleated-mini-skirt": skirtGreyPleated,
  "pink-plaid-pleated-mini-skirt": skirtPinkPlaid,
  "white-tiered-maxi-skirt": skirtWhiteTiered,
  "brown-high-waist-pleated-maxi-skirt": skirtBrownMaxi,
  "black-bodycon-mini-skirt": skirtBlackBodycon,
  "black-ruched-side-slit-maxi-skirt": skirtBlackRuchedMaxi,
  "white-mini-side-slit-skirt": skirtWhiteMiniSlit,
  "high-waist-denim-pencil-skirt": skirtDenimPencil,
};

/** Pant catalog — seed_pants_products */
const PANT_IMAGES_BY_SLUG = {
  "classic-beige-tailored-trousers": pantBeigeTailored,
  "slim-fit-cream-joggers": pantCreamJoggers,
  "olive-chino-shorts": pantOliveChinoShorts,
  "khaki-linen-shorts": pantKhakiLinenShorts,
  "charcoal-wide-leg-denim-jeans": pantCharcoalWideDenim,
  "black-formal-trousers": pantBlackFormal,
  "dusty-pink-wide-leg-pants": pantDustyPinkWide,
  "black-high-waist-leggings": pantBlackLeggings,
};

function getProductImageSrc(product) {
  if (product.product_type === "jacket" && JACKET_IMAGES_BY_SLUG[product.slug]) {
    return JACKET_IMAGES_BY_SLUG[product.slug];
  }
  if (product.product_type === "tshirt" && TSHIRT_IMAGES_BY_SLUG[product.slug]) {
    return TSHIRT_IMAGES_BY_SLUG[product.slug];
  }
  if (product.product_type === "shirt" && SHIRT_IMAGES_BY_SLUG[product.slug]) {
    return SHIRT_IMAGES_BY_SLUG[product.slug];
  }
  if (product.product_type === "skirt" && SKIRT_IMAGES_BY_SLUG[product.slug]) {
    return SKIRT_IMAGES_BY_SLUG[product.slug];
  }
  if (product.product_type === "pant" && PANT_IMAGES_BY_SLUG[product.slug]) {
    return PANT_IMAGES_BY_SLUG[product.slug];
  }
  if (product.product_type === "hoodie" && HOODIE_IMAGES_BY_SLUG[product.slug]) {
    return HOODIE_IMAGES_BY_SLUG[product.slug];
  }
  if (product.image) return mediaUrl(product.image);
  return CATEGORY_FALLBACKS[product.product_type] || tshirtFallback;
}

export default function CategoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProducts();
        if (!cancelled) setProducts(Array.isArray(data) ? data : data.results || []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load products.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byType = useMemo(() => {
    const map = {};
    for (const p of products) {
      const key = p.product_type_display || p.product_type || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [products]);

  if (loading) {
    return (
      <div style={page.centered}>
        <p>Loading categories…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div style={page.centered}>
        <p style={{ color: "#b91c1c" }}>{error}</p>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
          Start Django: <code>python manage.py runserver</code> then refresh.
        </p>
      </div>
    );
  }

  return (
    <div style={page.wrap}>
      <header style={page.header}>
        <h1 style={page.title}>Shop by category</h1>
        <p style={page.sub}>
          Pick a base garment, then customize fabric, colors, and details.
        </p>
      </header>

      {Object.entries(byType).map(([typeName, items]) => (
        <section key={typeName} style={page.section}>
          <h2 style={page.typeHeading}>{typeName}</h2>
          <div style={page.grid}>
            {items.map((p) => (
              <article key={p.id} style={page.card}>
                <div style={page.imgWrap}>
                  <img
                    src={getProductImageSrc(p)}
                    alt={p.name}
                    style={page.img}
                  />
                </div>
                <div style={page.cardBody}>
                  <h3 style={page.cardTitle}>{p.name}</h3>
                  <p style={page.price}>${p.base_price}</p>
                  <Link
                    to={`/customize?product=${p.id}`}
                    style={page.cta}
                  >
                    Customize
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const page = {
  wrap: { padding: "40px", maxWidth: "1200px", margin: "0 auto" },
  centered: { padding: "60px 24px", textAlign: "center" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a1a2e" },
  sub: { marginTop: "10px", color: "#555", maxWidth: "560px" },
  section: { marginBottom: "48px" },
  typeHeading: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#1a1a2e",
    borderBottom: "1px solid #eee",
    paddingBottom: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "#fafafa",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #eee",
  },
  imgWrap: {
    height: "220px",
    background: "#e5e5e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  cardBody: { padding: "16px" },
  cardTitle: { fontSize: "16px", fontWeight: "700", marginBottom: "6px" },
  price: { color: "#444", marginBottom: "12px" },
  cta: {
    display: "inline-block",
    padding: "10px 16px",
    background: "#1a1a2e",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
  },
};
