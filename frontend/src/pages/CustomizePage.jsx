import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  addToCart,
  fetchProducts,
  getStoredToken,
  saveCustomization,
} from "../api";
import { formatNPR } from "../currency";
import { catalogDefaultPartColors, mergePartColorDefaults } from "../catalogColorDefaults";
import { normalizeHexColor } from "../colorUtils";
import {
  customizationUnitPrice,
  effectiveCatalogPartColors,
  fabricMarkupApplies,
  nonDefaultPartColorsMarkup,
} from "../pricing";
import { getProductImageSrc, getProductImageStyle } from "../productImages";
import { BUY_NOW_OUT_OF_STOCK_TOAST, getProductStockQty, isProductOutOfStock } from "../productStock";
import {
  getTrendingPartColorOverrides,
  getTrendingShowcase,
  trendingShowcaseBase,
  trendingShowcaseMore,
} from "../data/trendingShowcases";
import ProductStarsLine from "../components/ProductStarsLine";
import ProductSpecsPanel from "../components/ProductSpecsPanel";
import { useNotify } from "../contexts/NotifyContext";


const PRIMARY_CATEGORIES = [
  { type: "trending", label: "🔥 Trending Styles" },
  { type: "pant", label: "Pant" },
  { type: "skirt", label: "Skirt" },
  { type: "hoodie", label: "Hoodie" },
  { type: "shirt", label: "Shirt" },
  { type: "tshirt", label: "T-shirt" },
  { type: "jacket", label: "Jacket" },
];

const FABRICS = [
  { value: "cotton", label: "Cotton" },
  { value: "silk", label: "Silk" },
  { value: "denim", label: "Denim" },
  { value: "wool", label: "Wool" },
  { value: "linen", label: "Linen" },
  { value: "polyester", label: "Polyester" },
];

const SIZES = ["S", "M", "L", "XL", "CUSTOM"];

const PART_COLOR_DEFAULTS = {
  body: "#2d2d2d",
  back: "#2d2d2d",
  sleeves: "#2d2d2d",
  patternPrimary: "#111111",
  patternSecondary: "#ffffff",
};

export default function CustomizePage() {
  const toast = useNotify();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const productFromUrl = searchParams.get("product");
  const primaryFromUrl = searchParams.get("primary");
  const secondaryFromUrl = searchParams.get("secondary");
  const categoryFromUrl = searchParams.get("category");
  const showcaseFromUrl = searchParams.get("showcase");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [productId, setProductId] = useState(primaryFromUrl || productFromUrl || "");
  const [userPickedProduct, setUserPickedProduct] = useState(() => {
    const fromUrl = Boolean(primaryFromUrl || productFromUrl);
    const fromTrending = Boolean(showcaseFromUrl && String(showcaseFromUrl).trim());
    return fromUrl && !fromTrending;
  });
  const [secondaryProductId, setSecondaryProductId] = useState(secondaryFromUrl || "");
  const [fabric, setFabric] = useState("cotton");
  const [bodyColor, setBodyColor] = useState("#2d2d2d");
  const [backColor, setBackColor] = useState("#2d2d2d");
  const [sleevesColor, setSleevesColor] = useState("#2d2d2d");
  const [collarColor, setCollarColor] = useState("#ffffff");
  const [size, setSize] = useState("M");
  const [customSize, setCustomSize] = useState("");
  const [pattern, setPattern] = useState("plain");
  const [patternPrimaryColor, setPatternPrimaryColor] = useState("#111111");
  const [patternSecondaryColor, setPatternSecondaryColor] = useState("#ffffff");
  const [hasCollar, setHasCollar] = useState(false);
  const [sleeveStyle, setSleeveStyle] = useState("full");
  const [hasPocket, setHasPocket] = useState(false);
  const [pocketPosition, setPocketPosition] = useState("left_chest");
  const [pantPockets, setPantPockets] = useState([]);
  const [skirtPocket, setSkirtPocket] = useState("right_side");
  const [hoodieZipper, setHoodieZipper] = useState("zipper");
  const [hoodiePocket, setHoodiePocket] = useState("pocket");
  const [shirtPocket, setShirtPocket] = useState("left_chest");
  const [tshirtPocket, setTshirtPocket] = useState("left_chest");
  const [jacketPocket, setJacketPocket] = useState("both_chest");
  const [hasHoodie, setHasHoodie] = useState(false);
  const [pantLength, setPantLength] = useState("full");
  const [skirtLength, setSkirtLength] = useState("full");
  const [hoodieLength, setHoodieLength] = useState("full");
  const [shirtLength, setShirtLength] = useState("full");
  const [tshirtLength, setTshirtLength] = useState("full");
  const [jacketLength, setJacketLength] = useState("full");
  const [neckDesign, setNeckDesign] = useState("crew");
  const [shirtNeckDesign, setShirtNeckDesign] = useState("v_neck");
  const [tshirtNeckDesign, setTshirtNeckDesign] = useState("crew");
  const [jacketNeckDesign, setJacketNeckDesign] = useState("v_neck");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [savedCustomizationId, setSavedCustomizationId] = useState(null);

  const [orderQty, setOrderQty] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [shippingAddress, setShippingAddress] = useState("");
  const [ordering, setOrdering] = useState(false);

  const isLoggedIn = Boolean(getStoredToken());
  const relatedShowcase = useMemo(
    () => getTrendingShowcase(showcaseFromUrl),
    [showcaseFromUrl]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProducts();
        const list = Array.isArray(data) ? data : data.results || [];
        if (cancelled) return;
        setProducts(list);
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

  useEffect(() => {
    if (!products.length) return;
    const resolvedPrimary = primaryFromUrl || productFromUrl;
    const trendingEntry =
      Boolean(relatedShowcase) || Boolean(showcaseFromUrl && String(showcaseFromUrl).trim());
    if (resolvedPrimary) {
      const p = products.find((x) => String(x.id) === String(resolvedPrimary));
      if (p) {
        setSelectedCategory(categoryFromUrl || p.product_type);
        setProductId(String(p.id));
        setUserPickedProduct(!trendingEntry);
      }
    } else if (relatedShowcase?.catalogSlug) {
      const p = products.find((x) => x.slug === relatedShowcase.catalogSlug);
      if (p) {
        setSelectedCategory(categoryFromUrl || p.product_type);
        setProductId(String(p.id));
        setUserPickedProduct(false);
      } else if (categoryFromUrl) {
        setSelectedCategory(categoryFromUrl);
      }
    } else if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
    setSecondaryProductId(secondaryFromUrl || "");
  }, [
    products,
    productFromUrl,
    primaryFromUrl,
    secondaryFromUrl,
    categoryFromUrl,
    relatedShowcase,
    showcaseFromUrl,
  ]);

  const countByType = useMemo(() => {
    const m = {};
    for (const p of products) {
      m[p.product_type] = (m[p.product_type] || 0) + 1;
    }
    const trendingSlugs = [
      ...trendingShowcaseBase.map((x) => x.catalogSlug),
      ...trendingShowcaseMore.map((x) => x.catalogSlug),
    ];
    m["trending"] = products.filter((p) => trendingSlugs.includes(p.slug)).length;
    return m;
  }, [products]);

  const productsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    if (selectedCategory === "trending") {
      return [
        ...trendingShowcaseBase.map((x) => ({ ...x, isTrendingItem: true })),
        ...trendingShowcaseMore.map((x) => ({ ...x, isTrendingItem: true })),
      ];
    }
    return products
      .filter((p) => p.product_type === selectedCategory)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategory]);

  useEffect(() => {
    if (!productsInCategory.length) return;

    // Check if the current product is visible in the active category list
    const isTrending = selectedCategory === "trending";
    const stillVisible = productsInCategory.some((p) => {
      if (isTrending) {
        return p.isTrendingItem && p.showcaseSlug === showcaseFromUrl;
      }
      return String(p.id) === String(productId);
    });

    if (!productId || !stillVisible) {
      // Auto-select the first product in this category
      const first = productsInCategory[0];
      if (first.isTrendingItem) {
        // Auto-select first trending item using its catalog slug
        const catalogProduct = products.find((x) => x.slug === first.catalogSlug);
        if (catalogProduct) {
          const sid = String(catalogProduct.id);
          setProductId(sid);
          setUserPickedProduct(false);
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("product", sid);
            next.set("primary", sid);
            next.set("category", selectedCategory);
            next.set("showcase", first.showcaseSlug);
            return next;
          });
        }
      } else {
        // Auto-select first generic product
        const sid = String(first.id);
        setProductId(sid);
        setUserPickedProduct(true);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("product", sid);
          next.set("primary", sid);
          next.set("category", selectedCategory);
          next.delete("showcase");
          return next;
        });
      }
    }
  }, [
    productsInCategory,
    productId,
    products,
    selectedCategory,
    showcaseFromUrl,
    setSearchParams,
  ]);

  function handleSelectCategory(type) {
    setSelectedCategory(type);
    setProductId("");
    setUserPickedProduct(false);
    setSecondaryProductId("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("product");
      next.delete("primary");
      next.delete("secondary");
      next.set("category", type);
      return next;
    });
  }

  function handleSelectProduct(id) {
    const sid = String(id);
    setProductId(sid);
    setUserPickedProduct(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("product", sid);
      next.set("primary", sid);
      if (selectedCategory) next.set("category", selectedCategory);
      if (secondaryProductId) next.set("secondary", secondaryProductId);
      return next;
    });
  }

  function handleSelectTrendingItem(item) {
    const catalogProduct = products.find((x) => x.slug === item.catalogSlug);
    if (!catalogProduct) return;
    const sid = String(catalogProduct.id);
    setProductId(sid);
    setUserPickedProduct(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("product", sid);
      next.set("primary", sid);
      next.set("category", "trending");
      next.set("showcase", item.showcaseSlug);
      if (secondaryProductId) next.set("secondary", secondaryProductId);
      return next;
    });
  }

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(productId)),
    [products, productId]
  );
  const maxOrderQtyForCart = useMemo(() => {
    const q = getProductStockQty(selectedProduct);
    if (q === null) return 99;
    if (q <= 0) return 1;
    return Math.min(99, q);
  }, [selectedProduct]);

  useEffect(() => {
    setOrderQty((prev) => Math.min(prev, maxOrderQtyForCart));
  }, [maxOrderQtyForCart]);

  const relatedCatalogProduct = useMemo(() => {
    if (!relatedShowcase?.catalogSlug) return null;
    return products.find((p) => p.slug === relatedShowcase.catalogSlug) || null;
  }, [products, relatedShowcase]);

  const productColorDefaultsKey = useMemo(() => {
    if (!selectedProduct) return "";
    return [
      selectedProduct.id,
      selectedProduct.slug,
      selectedProduct.product_type,
      selectedProduct.default_fabric,
      JSON.stringify(selectedProduct.default_part_colors ?? null),
      userPickedProduct ? "1" : "0",
      relatedShowcase?.showcaseSlug || "",
    ].join("|");
  }, [selectedProduct, userPickedProduct, relatedShowcase]);

  const trendingStyleColorsActive = Boolean(
    !userPickedProduct &&
      relatedShowcase &&
      selectedProduct?.slug === relatedShowcase.catalogSlug
  );

  useEffect(() => {
    if (!selectedProduct) return;
    const slug = selectedProduct.slug || "";
    const ptype = selectedProduct.product_type || selectedCategory || "";
    const inferred = catalogDefaultPartColors(slug, ptype);
    let merged = mergePartColorDefaults(inferred, selectedProduct.default_part_colors);
    if (trendingStyleColorsActive) {
      merged = mergePartColorDefaults(
        merged,
        getTrendingPartColorOverrides(relatedShowcase, selectedProduct)
      );
    }
    const fb = PART_COLOR_DEFAULTS;
    const body = normalizeHexColor(merged.body || merged.front) ?? fb.body;
    const back = normalizeHexColor(merged.back) ?? body;
    const sleeves = normalizeHexColor(merged.sleeves || merged.side) ?? body;
    const collar = normalizeHexColor(merged.collar) ?? body;
    setBodyColor(body);
    setBackColor(back);
    setSleevesColor(sleeves);
    setCollarColor(collar);
    setPatternPrimaryColor(normalizeHexColor(merged.pattern_primary) ?? fb.patternPrimary);
    setPatternSecondaryColor(normalizeHexColor(merged.pattern_secondary) ?? fb.patternSecondary);
    const df = String(selectedProduct.default_fabric || "cotton").toLowerCase();
    const allowedFabrics = FABRICS.map((x) => x.value);
    setFabric(allowedFabrics.includes(df) ? df : "cotton");
  }, [productColorDefaultsKey, selectedCategory, trendingStyleColorsActive, relatedShowcase, selectedProduct]);

  const catalogPartColorRef = useMemo(() => {
    if (!selectedProduct) return {};
    const base = effectiveCatalogPartColors(selectedProduct, selectedCategory);
    if (!trendingStyleColorsActive) return base;
    return mergePartColorDefaults(
      base,
      getTrendingPartColorOverrides(relatedShowcase, selectedProduct)
    );
  }, [selectedProduct, selectedCategory, trendingStyleColorsActive, relatedShowcase]);

  const activeProductType = useMemo(() => {
    if (relatedShowcase) {
      const slug = relatedShowcase.showcaseSlug;
      if (["festive-beige-set", "floral-maxi-skirt", "taupe-wrap-skirt", "bridal-golden-lehenga"].includes(slug)) {
        return "skirt";
      }
      if (["classic-daura-set", "green-jogger-pants", "grey-drawstring-pants"].includes(slug)) {
        return "pant";
      }
      if (["green-off-shoulder-top", "sky-blue-button-top", "puff-sleeve-blue-top", "berry-zip-knit-top", "maroon-floral-cardigan"].includes(slug)) {
        return "tshirt";
      }
    }
    return selectedProduct?.product_type || selectedCategory;
  }, [selectedProduct, selectedCategory, relatedShowcase]);
  const isPant = activeProductType === "pant";
  const isSkirt = activeProductType === "skirt";
  const isHoodie = activeProductType === "hoodie";
  const isShirt = activeProductType === "shirt";
  const isTshirt = activeProductType === "tshirt";
  const isJacket = activeProductType === "jacket";

  const partColors = useMemo(
    () => ({
      ...(isPant
        ? {
            front: bodyColor,
            back: backColor,
          }
        : isSkirt
          ? {
              front: bodyColor,
              back: backColor,
              side: sleevesColor,
            }
          : isHoodie
            ? {
                body: bodyColor,
                sleeves: sleevesColor,
              }
            : isJacket
              ? {
                  body: bodyColor,
                  sleeves: sleevesColor,
                }
            : isTshirt
              ? {
                  body: bodyColor,
                }
        : {
            body: bodyColor,
            sleeves: sleevesColor,
            collar: collarColor,
          }),
      ...((isPant || isSkirt || isShirt || isJacket) && pattern !== "plain"
        ? {
            ...(isPant || isShirt || isJacket
              ? {
                  pattern_primary: patternPrimaryColor,
                  pattern_secondary: patternSecondaryColor,
                }
              : {
                  pattern_primary: patternPrimaryColor,
                }),
          }
        : {}),
    }),
    [
      isPant,
      bodyColor,
      backColor,
      sleevesColor,
      collarColor,
      isSkirt,
      isHoodie,
      isShirt,
      isTshirt,
      isJacket,
      pattern,
      patternPrimaryColor,
      patternSecondaryColor,
    ]
  );

  const orderUnitPrice = useMemo(() => {
    if (!selectedProduct) return null;
    return customizationUnitPrice(selectedProduct.base_price, fabric, {
      partColors,
      catalogReferencePartColors: catalogPartColorRef,
      defaultFabric: selectedProduct.default_fabric,
    });
  }, [selectedProduct, fabric, partColors, catalogPartColorRef]);

  const orderPriceBreakdownNote = useMemo(() => {
    if (!selectedProduct) return "";
    const base = formatNPR(selectedProduct.base_price);
    const bits = [];
    if (fabricMarkupApplies(fabric, selectedProduct.default_fabric)) {
      bits.push("+25% vs original fabric");
    }
    if (nonDefaultPartColorsMarkup(partColors, catalogPartColorRef)) {
      bits.push("+20% vs original colors");
    }
    if (!bits.length) return "";
    return ` (base ${base} ${bits.join(", ")})`;
  }, [selectedProduct, fabric, partColors, catalogPartColorRef]);

  const patternForPayload =
    pattern === "check" || pattern === "lines" ? "check_line" : pattern;

  async function handleSaveDesign(e) {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.warning("Sign in required", "Please sign in to save your design.");
      return;
    }
    setSaveMessage(null);
    if (!productId) {
      setSaveMessage("Select a product.");
      return;
    }
    const payload = {
      product: Number(productId),
      title: "",
      fabric,
      part_colors: partColors,
      size,
      custom_size: customSize.trim(),
      pattern: isHoodie || isTshirt ? "plain" : patternForPayload,
      has_collar: !isPant && !isSkirt && !isHoodie && !isShirt ? hasCollar : false,
      sleeve_style: sleeveStyle || "full",
      has_pocket: isPant
        ? pantPockets.length > 0
        : isSkirt
          ? true
          : isHoodie
            ? hoodiePocket === "pocket"
          : isShirt
            ? shirtPocket !== "none"
          : isTshirt
            ? tshirtPocket !== "none"
          : isJacket
            ? true
            : hasPocket,
      pocket_position: isPant
        ? pantPockets.join(",")
        : isSkirt
          ? skirtPocket
        : isHoodie
          ? hoodiePocket === "pocket"
            ? "front"
            : ""
        : isShirt
          ? shirtPocket === "none"
            ? ""
            : shirtPocket === "both"
              ? "left_chest,right_chest"
              : "left_chest"
        : isTshirt
          ? tshirtPocket === "left_chest"
            ? "left_chest"
            : ""
        : isJacket
          ? jacketPocket
        : hasPocket
          ? pocketPosition
          : "",
      has_hoodie: isHoodie
        ? hoodieZipper === "zipper"
        : !isPant && !isSkirt && !isShirt && !isTshirt
          ? hasHoodie
          : false,
      pant_length: isPant
        ? pantLength
        : isSkirt
          ? skirtLength
          : isHoodie
            ? hoodieLength
            : isShirt
              ? shirtLength
              : isTshirt
                ? tshirtLength
                : isJacket
                  ? jacketLength
              : "",
      neck_design: isShirt
        ? shirtNeckDesign
        : isTshirt
          ? tshirtNeckDesign
          : isJacket
            ? jacketNeckDesign
          : !isPant && !isSkirt && !isHoodie
            ? neckDesign
            : "",
      notes: notes.trim(),
    };
    setSaving(true);
    try {
      const created = await saveCustomization(payload);
      setSavedCustomizationId(created.id);
      setSaveMessage(`Design saved (ID ${created.id}). You can place an order below.`);
    } catch (err) {
      setSaveMessage(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddToCartFlow(e) {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.warning("Sign in required", "Please sign in to add your design to the cart.");
      return;
    }
    if (!savedCustomizationId) {
      toast.warning("Save your design first", "Use “Save design” above, then add your item to the cart.");
      return;
    }
    const payload = {
      product: Number(productId),
      customization: savedCustomizationId,
      quantity: orderQty,
    };
    setOrdering(true);
    try {
      await addToCart(payload);
      window.dispatchEvent(new Event("cart-updated"));
      toast.success({ title: "Added to cart" });
    } catch (err) {
      toast.error("Could not add to cart", err.message || "Please try again in a moment.");
    } finally {
      setOrdering(false);
    }
  }

  if (loading) {
    return (
      <div style={s.centered}>
        <p>Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div style={s.centered}>
        <p style={{ color: "#b91c1c" }}>{error}</p>
        <p style={{ marginTop: "12px" }}>
          <Link to="/category">Back to categories</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <h1 style={s.title}>Customize</h1>
        <p style={s.sub}>
          Pick a category, then a product. Each item loads the <strong>original fabric and colors</strong> from the
          catalog. Changing fabric adds <strong>25%</strong> vs that original; changing colors adds{" "}
          <strong>20%</strong> (shown in the price line). Or use <strong>Buy now</strong> for checkout with eSewa.
        </p>
      </header>

      <section style={s.pickSection} aria-label="Choose category and product">
        <div style={s.stepRow}>
          <span style={s.stepBadge}>1</span>
          <h2 style={s.stepTitle}>Category</h2>
        </div>
        <p style={s.stepHint}>Select a garment type. Your choice is highlighted.</p>
        <div style={s.categoryGrid}>
          {PRIMARY_CATEGORIES.map(({ type, label }) => {
            const count = countByType[type] ?? 0;
            const active = selectedCategory === type;
            const isTrending = type === "trending";
            const hovered = hoveredCategory === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectCategory(type)}
                onMouseEnter={() => setHoveredCategory(type)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  ...s.categoryChip,
                  ...(active ? (isTrending ? s.trendingChipSelected : s.categoryChipSelected) : {}),
                  ...(isTrending && !active ? s.trendingChipUnselected : {}),
                  ...(hovered && !active ? { borderColor: isTrending ? "#f87171" : "#1a1a2e", background: isTrending ? "#fff5f5" : "#f4f6fa" } : {}),
                  opacity: count === 0 ? 0.45 : 1,
                }}
                aria-pressed={active}
                disabled={count === 0}
              >
                <span style={{
                  ...s.categoryLabel,
                  ...(isTrending && active ? { color: "#e11d48" } : {})
                }}>
                  {label}
                </span>
                <span style={s.categoryCount}>{count} items</span>
              </button>
            );
          })}
        </div>

        <div style={{ ...s.stepRow, marginTop: "28px" }}>
          <span style={s.stepBadge}>2</span>
          <h2 style={s.stepTitle}>Product</h2>
        </div>
        <div
          style={{
            ...s.productCustomizeRow,
            flexDirection: selectedCategory ? "row" : "column",
          }}
        >
          <div
            style={{
              ...s.productBrowseCol,
              ...(selectedCategory ? s.productBrowseColScrollable : {}),
            }}
          >
            {relatedShowcase && relatedCatalogProduct && selectedCategory !== "trending" ? (
              <div style={s.relatedPanel}>
                <p style={s.relatedLabel}>Related item from trending style</p>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectCategory(relatedCatalogProduct.product_type);
                    handleSelectProduct(relatedCatalogProduct.id);
                  }}
                  style={s.relatedCardBtn}
                >
                  <div style={s.relatedThumbWrap}>
                    <img
                      src={relatedShowcase.img}
                      alt={relatedShowcase.alt || relatedShowcase.title}
                      style={s.relatedThumbImg}
                    />
                  </div>
                  <div style={s.relatedBody}>
                    <span style={s.relatedName}>{relatedCatalogProduct.name}</span>
                    <span style={s.relatedMeta}>{formatNPR(relatedCatalogProduct.base_price)}</span>
                  </div>
                  <span style={s.relatedAction}>Use this base product</span>
                </button>
              </div>
            ) : null}
            {!selectedCategory && (
              <p style={s.stepMuted}>Choose a category above to see products.</p>
            )}
            {selectedCategory && productsInCategory.length === 0 && (
              <p style={s.stepMuted}>No products in this category yet.</p>
            )}
            {selectedCategory && productsInCategory.length > 0 && (
              <div style={s.productGrid}>
                {productsInCategory.map((p) => {
                  const isTrending = p.isTrendingItem;
                  const selected = isTrending
                    ? relatedShowcase?.showcaseSlug === p.showcaseSlug
                    : userPickedProduct && String(productId) === String(p.id);

                  const handleSelect = () => {
                    if (isTrending) {
                      handleSelectTrendingItem(p);
                    } else {
                      handleSelectProduct(p.id);
                    }
                  };

                  return (
                    <button
                      key={isTrending ? p.showcaseSlug : p.id}
                      type="button"
                      onClick={handleSelect}
                      style={{
                        ...s.productCard,
                        ...(selected ? s.productCardSelected : {}),
                      }}
                      aria-pressed={selected}
                    >
                      <div style={s.productThumbWrap}>
                        <img
                          src={isTrending ? p.img : getProductImageSrc(p)}
                          alt=""
                          style={{
                            ...s.productThumbImg,
                            ...(!isTrending ? getProductImageStyle(p) : {}),
                          }}
                        />
                      </div>
                      <div style={s.productCardBody}>
                        <span style={s.productName}>{isTrending ? p.title : p.name}</span>
                        {isTrending ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ color: "#e11d48", fontWeight: "bold", fontSize: "12px" }}>🔥 Trending Style</span>
                          </div>
                        ) : (
                          <ProductStarsLine average={p.rating_average} count={p.rating_count} />
                        )}
                        <span style={s.productPrice}>{formatNPR(isTrending ? p.price : p.base_price)}</span>
                      </div>
                      {selected && (
                        <span
                          style={{
                            ...s.selectedTag,
                            ...(isTrending ? { background: "#e11d48" } : {}),
                          }}
                        >
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedCategory && productId && selectedProduct && orderUnitPrice != null && (
              <>
                <p style={s.selectionSummary}>
                  Customizing: <strong>{relatedShowcase?.catalogSlug === selectedProduct.slug ? relatedShowcase.title : selectedProduct.name}</strong> ·{" "}
                  {formatNPR(orderUnitPrice)}
                  {orderPriceBreakdownNote}
                </p>
                <div style={{ marginTop: "12px", maxWidth: "520px" }}>
                  <ProductSpecsPanel product={selectedProduct} priceText={null} showStock />
                </div>
                <div style={s.checkoutShortcut}>
                  <button
                    type="button"
                    style={s.checkoutShortcutBtn}
                    onClick={() => {
                      if (selectedProduct && isProductOutOfStock(selectedProduct)) {
                        toast.warning(BUY_NOW_OUT_OF_STOCK_TOAST);
                        return;
                      }
                      if (!getStoredToken()) {
                        toast.warning("Sign in required", "Please sign in to place an order.");
                        return;
                      }
                      navigate(`/checkout/buy?product=${encodeURIComponent(productId)}`);
                    }}
                  >
                    Buy now — checkout with eSewa
                  </button>
                  <p style={s.checkoutShortcutHint}>
                    Pays for this catalog item as listed (not your custom design). To buy your design, save it and use{" "}
                    <strong>Add to Cart</strong>.
                  </p>
                </div>
              </>
            )}
          </div>

          <div
            style={{
              ...s.customizeFormCol,
              ...(!selectedCategory ? s.customizeFormColStack : {}),
              ...(selectedCategory ? s.customizeFormColSticky : {}),
            }}
          >
            <div>
      <form onSubmit={handleSaveDesign} style={s.form}>

        <label style={s.label}>
          Fabric
          <select
            style={s.input}
            value={fabric}
            onChange={(e) => setFabric(e.target.value)}
          >
            {FABRICS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        {selectedProduct && fabricMarkupApplies(fabric, selectedProduct.default_fabric) ? (
          <p style={s.fabricMarkupHint}>
            Fabric differs from this product&apos;s original (+25% at payment).
          </p>
        ) : null}

        <fieldset style={s.fieldset}>
          <legend style={s.legend}>Color segments</legend>
          <div style={s.row}>
            <label style={s.inline}>
            {isPant || isSkirt ? "Front" : isTshirt ? "Color" : "Body"}
              <input
                type="color"
                value={bodyColor}
                onChange={(e) => setBodyColor(e.target.value)}
              />
            </label>
            {isPant ? (
              <label style={s.inline}>
                Back
                <input
                  type="color"
                  value={backColor}
                  onChange={(e) => setBackColor(e.target.value)}
                />
              </label>
            ) : isSkirt ? (
              <>
                <label style={s.inline}>
                  Back
                  <input
                    type="color"
                    value={backColor}
                    onChange={(e) => setBackColor(e.target.value)}
                  />
                </label>
                <label style={s.inline}>
                  Side
                  <input
                    type="color"
                    value={sleevesColor}
                    onChange={(e) => setSleevesColor(e.target.value)}
                  />
                </label>
              </>
            ) : isHoodie || isJacket ? (
              <label style={s.inline}>
                Sleeves
                <input
                  type="color"
                  value={sleevesColor}
                  onChange={(e) => setSleevesColor(e.target.value)}
                />
              </label>
            ) : isTshirt ? null : !isSkirt ? (
              <>
                <label style={s.inline}>
                  Sleeves
                  <input
                    type="color"
                    value={sleevesColor}
                    onChange={(e) => setSleevesColor(e.target.value)}
                  />
                </label>
                <label style={s.inline}>
                  Collar
                  <input
                    type="color"
                    value={collarColor}
                    onChange={(e) => setCollarColor(e.target.value)}
                  />
                </label>
              </>
            ) : null}
            {isSkirt && (pattern === "check" || pattern === "lines") ? (
              <label style={s.inline}>
                Pattern color
                <input
                  type="color"
                  value={patternPrimaryColor}
                  onChange={(e) => setPatternPrimaryColor(e.target.value)}
                />
              </label>
            ) : null}
          </div>
        </fieldset>
        {nonDefaultPartColorsMarkup(partColors, catalogPartColorRef) ? (
          <p style={s.fabricMarkupHint}>
            Colors differ from the original product (+20% at payment).
          </p>
        ) : null}

        <label style={s.label}>
          Size
          <select
            style={s.input}
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {SIZES.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
        </label>

        {size === "CUSTOM" && (
          <label style={s.label}>
            Custom size / measurements
            <input
              style={s.input}
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              required
              placeholder="Chest 40 in, length 28 in, …"
            />
          </label>
        )}

        {!isHoodie && !isTshirt && (
          <label style={s.label}>
            Pattern
            <select
              style={s.input}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            >
              <option value="plain">Plain</option>
              {isJacket ? (
                <option value="lines">Lines</option>
              ) : isPant || isSkirt || isShirt ? (
                <>
                  <option value="check">Check</option>
                  <option value="lines">Lines</option>
                </>
              ) : (
                <option value="check_line">Check line</option>
              )}
            </select>
          </label>
        )}
        {(isPant || isShirt || (isJacket && pattern === "lines")) && pattern !== "plain" && (
          <fieldset style={s.fieldset}>
            <legend style={s.legend}>Pattern colors</legend>
            <div style={s.row}>
              <label style={s.inline}>
                Primary
                <input
                  type="color"
                  value={patternPrimaryColor}
                  onChange={(e) => setPatternPrimaryColor(e.target.value)}
                />
              </label>
              <label style={s.inline}>
                Secondary
                <input
                  type="color"
                  value={patternSecondaryColor}
                  onChange={(e) => setPatternSecondaryColor(e.target.value)}
                />
              </label>
            </div>
          </fieldset>
        )}

        {!isPant && !isSkirt && !isHoodie && !isShirt && (
          <label style={s.check}>
            <input
              type="checkbox"
              checked={hasCollar}
              onChange={(e) => setHasCollar(e.target.checked)}
            />
            Collar
          </label>
        )}

        {!isPant && !isSkirt && (
          <label style={s.label}>
            Sleeves
            <select
              style={s.input}
              value={isJacket && sleeveStyle === "none" ? "full" : sleeveStyle}
              onChange={(e) => setSleeveStyle(e.target.value)}
            >
              <option value="full">Full sleeve</option>
              <option value="half">Half sleeve</option>
              {!isJacket && <option value="none">No sleeves</option>}
            </select>
          </label>
        )}

        {isHoodie && (
          <label style={s.label}>
            Zipper
            <select
              style={s.input}
              value={hoodieZipper}
              onChange={(e) => setHoodieZipper(e.target.value)}
            >
              <option value="zipper">Zipper</option>
              <option value="no_zipper">No Zipper</option>
            </select>
          </label>
        )}

        {isPant ? (
          <fieldset style={s.fieldset}>
            <legend style={s.legend}>Pocket</legend>
            <div style={s.row}>
              {[
                { value: "front", label: "Front" },
                { value: "back", label: "Back" },
                { value: "side", label: "Side" },
              ].map((opt) => (
                <label key={opt.value} style={s.check}>
                  <input
                    type="checkbox"
                    checked={pantPockets.includes(opt.value)}
                    onChange={(e) => {
                      setPantPockets((prev) =>
                        e.target.checked
                          ? [...prev, opt.value]
                          : prev.filter((v) => v !== opt.value)
                      );
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : isSkirt ? (
          <label style={s.label}>
            Pocket
            <select
              style={s.input}
              value={skirtPocket}
              onChange={(e) => setSkirtPocket(e.target.value)}
            >
              <option value="right_side">Right side</option>
              <option value="left_side">Left side</option>
              <option value="both_side">Both side</option>
              <option value="center_front">Centre front</option>
              <option value="center_back">Centre back</option>
              <option value="both_front">Both front</option>
              <option value="both_back">Both back</option>
            </select>
          </label>
        ) : isHoodie ? (
          <label style={s.label}>
            Pocket
            <select
              style={s.input}
              value={hoodiePocket}
              onChange={(e) => setHoodiePocket(e.target.value)}
            >
              <option value="pocket">Pocket</option>
              <option value="no_pocket">No Pocket</option>
            </select>
          </label>
        ) : isShirt ? (
          <label style={s.label}>
            Pocket
            <select
              style={s.input}
              value={shirtPocket}
              onChange={(e) => setShirtPocket(e.target.value)}
            >
              <option value="left_chest">Left Chest</option>
              <option value="both">Both</option>
              <option value="none">None</option>
            </select>
          </label>
        ) : isTshirt ? (
          <label style={s.label}>
            Pocket
            <select
              style={s.input}
              value={tshirtPocket}
              onChange={(e) => setTshirtPocket(e.target.value)}
            >
              <option value="left_chest">Left Chest</option>
              <option value="none">None</option>
            </select>
          </label>
        ) : isJacket ? (
          <label style={s.label}>
            Pocket
            <select
              style={s.input}
              value={jacketPocket}
              onChange={(e) => setJacketPocket(e.target.value)}
            >
              <option value="both_chest">Both Chest</option>
              <option value="down_both_side">Down Both Side</option>
            </select>
          </label>
        ) : (
          <>
            <label style={s.check}>
              <input
                type="checkbox"
                checked={hasPocket}
                onChange={(e) => setHasPocket(e.target.checked)}
              />
              Pocket
            </label>
            {hasPocket && (
              <label style={s.label}>
                Pocket position
                <input
                  style={s.input}
                  value={pocketPosition}
                  onChange={(e) => setPocketPosition(e.target.value)}
                  placeholder="left_chest"
                />
              </label>
            )}
          </>
        )}

        {!isPant && !isSkirt && !isHoodie && !isShirt && !isTshirt && (
          <label style={s.check}>
            <input
              type="checkbox"
              checked={hasHoodie}
              onChange={(e) => setHasHoodie(e.target.checked)}
            />
            Hoodie
          </label>
        )}

        {isPant ? (
          <label style={s.label}>
            Pant length
            <select
              style={s.input}
              value={pantLength}
              onChange={(e) => setPantLength(e.target.value)}
            >
              <option value="full">Full</option>
              <option value="half">Half</option>
            </select>
          </label>
        ) : isSkirt ? (
          <label style={s.label}>
            Length
            <select
              style={s.input}
              value={skirtLength}
              onChange={(e) => setSkirtLength(e.target.value)}
            >
              <option value="full">Full</option>
              <option value="half">Half</option>
            </select>
          </label>
        ) : isHoodie ? (
          <label style={s.label}>
            Length
            <select
              style={s.input}
              value={hoodieLength}
              onChange={(e) => setHoodieLength(e.target.value)}
            >
              <option value="full">Full</option>
              <option value="half">Half</option>
            </select>
          </label>
        ) : isShirt ? (
          <label style={s.label}>
            Length
            <select
              style={s.input}
              value={shirtLength}
              onChange={(e) => setShirtLength(e.target.value)}
            >
              <option value="full">Full</option>
              <option value="half">Half</option>
            </select>
          </label>
        ) : isTshirt ? (
          <label style={s.label}>
            Length
            <select
              style={s.input}
              value={tshirtLength}
              onChange={(e) => setTshirtLength(e.target.value)}
            >
              <option value="full">Full</option>
              <option value="half">Half</option>
            </select>
          </label>
        ) : isJacket ? (
          <label style={s.label}>
            Length
            <select
              style={s.input}
              value={jacketLength}
              onChange={(e) => setJacketLength(e.target.value)}
            >
              <option value="full">Full</option>
              <option value="half">Half</option>
              <option value="long">Long</option>
            </select>
          </label>
        ) : null}

        {isShirt ? (
          <label style={s.label}>
            Neck design
            <select
              style={s.input}
              value={shirtNeckDesign}
              onChange={(e) => setShirtNeckDesign(e.target.value)}
            >
              <option value="v_neck">V Neck</option>
              <option value="polo">Polo Collar</option>
            </select>
          </label>
        ) : isTshirt ? (
          <label style={s.label}>
            Neck design
            <select
              style={s.input}
              value={tshirtNeckDesign}
              onChange={(e) => setTshirtNeckDesign(e.target.value)}
            >
              <option value="v_neck">V Neck</option>
              <option value="polo">Polo Collar</option>
              <option value="crew">Crew Neck</option>
            </select>
          </label>
        ) : isJacket ? (
          <label style={s.label}>
            Neck design
            <select
              style={s.input}
              value={jacketNeckDesign}
              onChange={(e) => setJacketNeckDesign(e.target.value)}
            >
              <option value="v_neck">V Neck</option>
              <option value="crew">Crew Neck</option>
            </select>
          </label>
        ) : !isPant && !isSkirt && !isHoodie && (
          <label style={s.label}>
            Neck design
            <select
              style={s.input}
              value={neckDesign}
              onChange={(e) => setNeckDesign(e.target.value)}
            >
              <option value="crew">Crew neck</option>
              <option value="v_neck">V-neck</option>
              <option value="polo">Polo collar</option>
              <option value="boat">Boat neck</option>
              <option value="scoop">Scoop neck</option>
              <option value="turtleneck">Turtleneck</option>
            </select>
          </label>
        )}

        <label style={s.label}>
          Notes
          <textarea
            style={{ ...s.input, minHeight: "80px" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button type="submit" style={s.primary} disabled={saving || !productId}>
          {saving ? "Saving…" : "Save design"}
        </button>
        {saveMessage && <p style={s.msg}>{saveMessage}</p>}
      </form>
      <section style={s.orderSection}>
        <form onSubmit={handleAddToCartFlow} style={s.form}>
          <h2 style={s.stepTitle}>Add to Cart</h2>
          <p style={s.stepHint}>
            Satisfied with your design? Save it first, then add to your shopping cart.
          </p>
          <div style={s.orderQtyBlock}>
            <span style={s.orderQtyLabel}>Quantity</span>
            <div style={s.orderQtyStepper} aria-label="Quantity">
              <button
                type="button"
                style={s.orderQtyBtn}
                onClick={() => setOrderQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span style={s.orderQtyNum}>{orderQty}</span>
              <button
                type="button"
                style={s.orderQtyBtn}
                onClick={() => setOrderQty((q) => Math.min(maxOrderQtyForCart, q + 1))}
                disabled={orderQty >= maxOrderQtyForCart}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
          <button type="submit" style={s.primary} disabled={ordering || !savedCustomizationId}>
            {ordering ? "Adding..." : "Add to Cart"}
          </button>
        </form>
      </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const s = {
  wrap: { padding: "40px 24px", maxWidth: "1120px", margin: "0 auto", paddingBottom: "80px" },
  centered: { padding: "48px 24px", textAlign: "center" },
  header: { marginBottom: "28px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a1a2e" },
  sub: { marginTop: "10px", color: "#555", lineHeight: 1.5 },
  hint: { marginTop: "12px", fontSize: "13px", color: "#777" },
  code: { background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" },
  pickSection: {
    marginBottom: "32px",
    padding: "20px",
    background: "#f8f9fb",
    borderRadius: "12px",
    border: "1px solid #e8e8ec",
  },
  stepRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" },
  stepBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "#1a1a2e",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "800",
  },
  stepTitle: { fontSize: "16px", fontWeight: "800", color: "#1a1a2e", margin: 0 },
  stepHint: { margin: "0 0 14px 0", fontSize: "13px", color: "#666" },
  stepMuted: { margin: "0 0 8px 0", fontSize: "14px", color: "#888", fontStyle: "italic" },
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "10px",
  },
  categoryChip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "4px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "none",
    transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  },
  categoryChipSelected: {
    border: "2px solid #1a1a2e",
    background: "#eef0f5",
    boxShadow: "0 0 0 1px #1a1a2e",
  },
  trendingChipSelected: {
    border: "2px solid #e11d48",
    background: "#fff1f2",
    boxShadow: "0 0 0 1px #e11d48",
  },
  trendingChipUnselected: {
    borderColor: "#fecdd3",
    background: "#fff5f5",
  },
  categoryLabel: { fontWeight: "700", fontSize: "14px", color: "#1a1a2e" },
  categoryCount: { fontSize: "12px", color: "#6b7280" },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(228px, 1fr))",
    gap: "12px",
    alignItems: "stretch",
  },
  productCard: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: 0,
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    overflow: "hidden",
    textAlign: "left",
    boxShadow: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  productCardSelected: {
    border: "2px solid #1a1a2e",
    boxShadow: "0 4px 14px rgba(26, 26, 46, 0.12)",
  },
  productThumbWrap: {
    position: "relative",
    width: "100%",
    alignSelf: "stretch",
    aspectRatio: "3 / 4",
    minHeight: "200px",
    background: "#e8e8ec",
    overflow: "hidden",
  },
  productThumbImg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  productCardBody: {
    padding: "12px 14px 14px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minHeight: 0,
  },
  productName: {
    fontWeight: "700",
    fontSize: "14px",
    color: "#1a1a2e",
    lineHeight: 1.35,
    minHeight: "2.7em",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textAlign: "left",
  },
  productPrice: {
    fontSize: "13px",
    color: "#4b5563",
    lineHeight: 1.35,
    minHeight: "1.35em",
    marginTop: "auto",
  },
  selectedTag: {
    position: "absolute",
    top: "8px",
    right: "8px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#fff",
    background: "#1a1a2e",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  selectionSummary: {
    marginTop: "16px",
    padding: "12px 14px",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    color: "#374151",
  },
  checkoutShortcut: { marginTop: "12px" },
  checkoutShortcutBtn: {
    width: "100%",
    padding: "12px 14px",
    background: "#1a1a2e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
  },
  checkoutShortcutHint: {
    margin: "8px 0 0 0",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.45,
  },
  productCustomizeRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "28px",
    flexWrap: "wrap",
    marginTop: "4px",
  },
  productBrowseCol: {
    flex: "1 1 340px",
    minWidth: "min(100%, 280px)",
    maxWidth: "640px",
    minHeight: 0,
  },
  relatedPanel: {
    marginBottom: "14px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #dbe4ff",
    background: "#f8faff",
  },
  relatedLabel: {
    margin: "0 0 8px 0",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#334155",
  },
  relatedCardBtn: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "72px 1fr auto",
    gap: "10px",
    alignItems: "center",
    border: "1px solid #c7d2fe",
    borderRadius: "8px",
    background: "#fff",
    padding: "8px",
    cursor: "pointer",
    textAlign: "left",
  },
  relatedThumbWrap: {
    width: "72px",
    height: "72px",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#e2e8f0",
  },
  relatedThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  relatedBody: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
  relatedName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 1.3,
  },
  relatedMeta: {
    fontSize: "12px",
    color: "#475569",
    lineHeight: 1.35,
  },
  relatedAction: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#1d4ed8",
    whiteSpace: "nowrap",
  },
  /** When a category is selected (split layout), only this column scrolls; form stays sticky. */
  productBrowseColScrollable: {
    position: "sticky",
    top: 20,
    alignSelf: "flex-start",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    paddingRight: "10px",
    WebkitOverflowScrolling: "touch",
  },
  customizeFormCol: {
    flex: "1 1 300px",
    minWidth: "min(100%, 260px)",
    maxWidth: "440px",
  },
  customizeFormColSticky: {
    position: "sticky",
    top: 20,
    alignSelf: "flex-start",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
  },
  customizeFormColStack: {
    maxWidth: "100%",
    width: "100%",
  },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontWeight: "600", fontSize: "14px" },
  orderQtyBlock: { display: "flex", flexDirection: "column", gap: "6px" },
  orderQtyLabel: { fontWeight: "600", fontSize: "14px" },
  orderQtyStepper: {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#fff",
  },
  orderQtyBtn: {
    width: "40px",
    height: "40px",
    border: "none",
    background: "#f0f2f5",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "700",
    lineHeight: 1,
    color: "#1a1a2e",
    padding: 0,
  },
  orderQtyNum: {
    minWidth: "40px",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a1a2e",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
  },
  fieldset: { border: "1px solid #e5e5e5", borderRadius: "10px", padding: "16px" },
  legend: { padding: "0 8px", fontWeight: "700" },
  row: { display: "flex", gap: "24px", flexWrap: "wrap" },
  inline: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px" },
  check: { display: "flex", alignItems: "center", gap: "10px", fontWeight: "600" },
  primary: {
    marginTop: "8px",
    padding: "12px 20px",
    background: "#1a1a2e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  secondary: {
    marginTop: "8px",
    padding: "12px 20px",
    background: "#fff",
    color: "#1a1a2e",
    border: "2px solid #1a1a2e",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  msg: { marginTop: "8px", color: "#374151", fontSize: "14px" },
  fabricMarkupHint: {
    margin: "-4px 0 12px 0",
    fontSize: "13px",
    color: "#92400e",
    lineHeight: 1.45,
  },
  orderSection: {
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #e8e8ec",
  },
};
