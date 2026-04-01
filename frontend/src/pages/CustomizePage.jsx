import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProducts, saveCustomization, addToCart, getStoredRole, getStoredToken } from "../api";
import { formatNPR } from "../currency";
import { getProductImageSrc } from "../productImages";


const PRIMARY_CATEGORIES = [
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

export default function CustomizePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productFromUrl = searchParams.get("product");
  const primaryFromUrl = searchParams.get("primary");
  const secondaryFromUrl = searchParams.get("secondary");
  const categoryFromUrl = searchParams.get("category");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productId, setProductId] = useState(primaryFromUrl || productFromUrl || "");
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
  const [shippingAddress, setShippingAddress] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderMessage, setOrderMessage] = useState(null);
  const [showSubscribeToast, setShowSubscribeToast] = useState(false);

  const isLoggedIn = Boolean(getStoredToken());
  const isFreeUser = isLoggedIn && getStoredRole() === "user";

  function notifySubscriptionRequired() {
    setShowSubscribeToast(true);
    window.clearTimeout(window.__customizeToastTimer);
    window.__customizeToastTimer = window.setTimeout(() => {
      setShowSubscribeToast(false);
    }, 3000);
  }

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
    if (resolvedPrimary) {
      const p = products.find((x) => String(x.id) === String(resolvedPrimary));
      if (p) {
        setSelectedCategory(categoryFromUrl || p.product_type);
        setProductId(String(p.id));
      }
    } else if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
    setSecondaryProductId(secondaryFromUrl || "");
  }, [products, productFromUrl, primaryFromUrl, secondaryFromUrl, categoryFromUrl]);

  const countByType = useMemo(() => {
    const m = {};
    for (const p of products) {
      m[p.product_type] = (m[p.product_type] || 0) + 1;
    }
    return m;
  }, [products]);

  const productsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return products
      .filter((p) => p.product_type === selectedCategory)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategory]);

  useEffect(() => {
    if (!productId) return;
    const stillVisible = productsInCategory.some(
      (p) => String(p.id) === String(productId)
    );
    if (!stillVisible) {
      setProductId("");
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("product");
        return next;
      });
    }
  }, [productsInCategory, productId, setSearchParams]);

  function handleSelectCategory(type) {
    setSelectedCategory(type);
    setProductId("");
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
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("product", sid);
      next.set("primary", sid);
      if (selectedCategory) next.set("category", selectedCategory);
      if (secondaryProductId) next.set("secondary", secondaryProductId);
      return next;
    });
  }

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(productId)),
    [products, productId]
  );

  const activeProductType = selectedProduct?.product_type || selectedCategory;
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
  const patternForPayload =
    pattern === "check" || pattern === "lines" ? "check_line" : pattern;

  async function handleSaveDesign(e) {
    e.preventDefault();
    if (isFreeUser) {
      notifySubscriptionRequired();
      return;
    }
    setSaveMessage(null);
    setOrderMessage(null);
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
    if (isFreeUser) {
      notifySubscriptionRequired();
      return;
    }
    setOrderMessage(null);
    if (!savedCustomizationId) {
      setOrderMessage("Save your design first.");
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
      setOrderMessage("Successfully added to cart!");
    } catch (err) {
      setOrderMessage(err.message || "Failed to add to cart.");
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
          Pick a category, then a product. Adjust fabric, colors, size, and style save
          your design, then place an order.
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
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectCategory(type)}
                style={{
                  ...s.categoryChip,
                  ...(active ? s.categoryChipSelected : {}),
                  opacity: count === 0 ? 0.45 : 1,
                }}
                aria-pressed={active}
                disabled={count === 0}
              >
                <span style={s.categoryLabel}>{label}</span>
                <span style={s.categoryCount}>{count} items</span>
              </button>
            );
          })}
        </div>

        <div style={{ ...s.stepRow, marginTop: "28px" }}>
          <span style={s.stepBadge}>2</span>
          <h2 style={s.stepTitle}>Product</h2>
        </div>
        {!selectedCategory && (
          <p style={s.stepMuted}>Choose a category above to see products.</p>
        )}
        {selectedCategory && productsInCategory.length === 0 && (
          <p style={s.stepMuted}>No products in this category yet.</p>
        )}
        {selectedCategory && productsInCategory.length > 0 && (
          <div style={s.productGrid}>
            {productsInCategory.map((p) => {
              const selected = String(productId) === String(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p.id)}
                  style={{
                    ...s.productCard,
                    ...(selected ? s.productCardSelected : {}),
                  }}
                  aria-pressed={selected}
                >
                  <div style={s.productThumbWrap}>
                    <img
                      src={getProductImageSrc(p)}
                      alt=""
                      style={s.productThumb}
                    />
                  </div>
                  <div style={s.productCardBody}>
                    <span style={s.productName}>{p.name}</span>
                    <span style={s.productPrice}>{formatNPR(p.base_price)}</span>
                  </div>
                  {selected && <span style={s.selectedTag}>Selected</span>}
                </button>
              );
            })}
          </div>
        )}
        {selectedCategory && productId && selectedProduct && (
          <p style={s.selectionSummary}>
            Customizing: <strong>{selectedProduct.name}</strong> ·{" "}
            {formatNPR(selectedProduct.base_price)}
          </p>
        )}
      </section>



      <div style={s.customizationWrap}>
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
      {isFreeUser ? (
        <button type="button" onClick={notifySubscriptionRequired} style={s.customizationOverlay} aria-label="Customization locked for free users" />
      ) : null}
      </div>

      <section style={s.orderSection}>
        <h2 style={s.orderTitle}>Place order</h2>
        <p style={s.sub}>
          After saving, submit shipping details. Guests must use the same email as
          checkout for tracking.
        </p>
        <form onSubmit={handleAddToCartFlow} style={s.form}>
          <hr style={{ margin: "24px 0", border: "0", borderTop: "1px solid #ddd" }} />
          <h2 style={s.stepTitle}>Add to Cart</h2>
          <p style={s.stepHint}>
            Satisfied with your design? Save it first, then add to your shopping cart.
          </p>
          <label style={s.label}>
            Quantity
            <input
              type="number"
              min={1}
              style={s.input}
              value={orderQty}
              onChange={(e) => setOrderQty(Number(e.target.value) || 1)}
            />
          </label>
          <button type="submit" style={s.primary} disabled={ordering || !savedCustomizationId}>
            {ordering ? "Adding..." : "Add to Cart"}
          </button>
          {orderMessage && <p style={s.msg}>{orderMessage}</p>}
        </form>
      </section>
      {showSubscribeToast ? (
        <div style={s.toast}>
          <span>Subscribe for your own customization</span>
          <button
            type="button"
            style={s.subscribeBtn}
            onClick={() => alert("Subscription plans will be available soon.")}
          >
            Subscribe
          </button>
        </div>
      ) : null}
    </div>
  );
}

const s = {
  wrap: { padding: "40px", maxWidth: "720px", margin: "0 auto", paddingBottom: "80px" },
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
  categoryLabel: { fontWeight: "700", fontSize: "14px", color: "#1a1a2e" },
  categoryCount: { fontSize: "12px", color: "#6b7280" },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
  },
  productCard: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
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
    height: "120px",
    background: "#e5e5e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  productThumb: { width: "100%", height: "100%", objectFit: "cover" },
  productCardBody: {
    padding: "10px 12px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  productName: { fontWeight: "700", fontSize: "14px", color: "#1a1a2e", lineHeight: 1.3 },
  productPrice: { fontSize: "13px", color: "#4b5563" },
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
  customizationWrap: { position: "relative" },
  customizationOverlay: {
    position: "absolute",
    inset: 0,
    border: "none",
    background: "transparent",
    cursor: "not-allowed",
    zIndex: 2,
  },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontWeight: "600", fontSize: "14px" },
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
  orderSection: {
    marginTop: "48px",
    paddingTop: "32px",
    borderTop: "1px solid #eee",
  },
  orderTitle: { fontSize: "20px", fontWeight: "800", marginBottom: "8px" },
  toast: {
    position: "fixed",
    right: 18,
    bottom: 18,
    background: "#1f2937",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    zIndex: 999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
  },
  subscribeBtn: {
    border: "1px solid #fecaca",
    background: "#fecaca",
    color: "#7f1d1d",
    borderRadius: 8,
    padding: "6px 10px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
