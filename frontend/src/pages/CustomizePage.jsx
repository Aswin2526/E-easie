import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProducts, placeOrder, saveCustomization } from "../api";

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
  const [searchParams] = useSearchParams();
  const productFromUrl = searchParams.get("product");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [productId, setProductId] = useState(productFromUrl || "");
  const [title, setTitle] = useState("");
  const [fabric, setFabric] = useState("cotton");
  const [bodyColor, setBodyColor] = useState("#2d2d2d");
  const [sleevesColor, setSleevesColor] = useState("#2d2d2d");
  const [collarColor, setCollarColor] = useState("#ffffff");
  const [size, setSize] = useState("M");
  const [customSize, setCustomSize] = useState("");
  const [pattern, setPattern] = useState("plain");
  const [hasCollar, setHasCollar] = useState(false);
  const [sleeveStyle, setSleeveStyle] = useState("full");
  const [hasPocket, setHasPocket] = useState(false);
  const [pocketPosition, setPocketPosition] = useState("left_chest");
  const [hasHoodie, setHasHoodie] = useState(false);
  const [pantLength, setPantLength] = useState("full");
  const [neckDesign, setNeckDesign] = useState("crew");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [savedCustomizationId, setSavedCustomizationId] = useState(null);

  const [orderQty, setOrderQty] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderMessage, setOrderMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProducts();
        const list = Array.isArray(data) ? data : data.results || [];
        if (cancelled) return;
        setProducts(list);
        if (productFromUrl) {
          setProductId(productFromUrl);
        } else if (list.length) {
          setProductId(String(list[0].id));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load products.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productFromUrl]);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(productId)),
    [products, productId]
  );

  const isPant = selectedProduct?.product_type === "pant";

  const partColors = useMemo(
    () => ({
      body: bodyColor,
      sleeves: sleevesColor,
      collar: collarColor,
    }),
    [bodyColor, sleevesColor, collarColor]
  );

  async function handleSaveDesign(e) {
    e.preventDefault();
    setSaveMessage(null);
    setOrderMessage(null);
    if (!productId) {
      setSaveMessage("Select a product.");
      return;
    }
    const payload = {
      product: Number(productId),
      title: title.trim(),
      fabric,
      part_colors: partColors,
      size,
      custom_size: customSize.trim(),
      pattern,
      has_collar: hasCollar,
      sleeve_style: sleeveStyle,
      has_pocket: hasPocket,
      pocket_position: hasPocket ? pocketPosition : "",
      has_hoodie: hasHoodie,
      pant_length: isPant ? pantLength : "",
      neck_design: neckDesign,
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

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setOrderMessage(null);
    if (!savedCustomizationId) {
      setOrderMessage("Save your design first.");
      return;
    }
    if (!shippingAddress.trim()) {
      setOrderMessage("Shipping address is required.");
      return;
    }
    const payload = {
      customization: savedCustomizationId,
      quantity: orderQty,
      shipping_address: shippingAddress.trim(),
      guest_email: guestEmail.trim(),
    };
    setOrdering(true);
    try {
      const order = await placeOrder(payload);
      setOrderMessage(
        `Order placed successfully. Order #${order.id} — track it from TRACK ORDER.`
      );
    } catch (err) {
      setOrderMessage(err.message || "Order failed.");
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
          Choose fabric, segment colors (body / sleeves / collar), size, and style
          options. Save your design, then place an order.
        </p>
        <p style={s.hint}>
          No products? Run{" "}
          <code style={s.code}>python manage.py seed_demo</code> in the backend folder.
        </p>
      </header>

      <form onSubmit={handleSaveDesign} style={s.form}>
        <label style={s.label}>
          Product
          <select
            style={s.input}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.product_type_display || p.product_type})
              </option>
            ))}
          </select>
        </label>

        <label style={s.label}>
          Design title (optional)
          <input
            style={s.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My summer tee"
          />
        </label>

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
              Body
              <input
                type="color"
                value={bodyColor}
                onChange={(e) => setBodyColor(e.target.value)}
              />
            </label>
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

        <label style={s.label}>
          Pattern
          <select
            style={s.input}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          >
            <option value="plain">Plain</option>
            <option value="check_line">Check line</option>
          </select>
        </label>

        <label style={s.check}>
          <input
            type="checkbox"
            checked={hasCollar}
            onChange={(e) => setHasCollar(e.target.checked)}
          />
          Collar
        </label>

        <label style={s.label}>
          Sleeves
          <select
            style={s.input}
            value={sleeveStyle}
            onChange={(e) => setSleeveStyle(e.target.value)}
          >
            <option value="full">Full sleeve</option>
            <option value="half">Half sleeve</option>
            <option value="none">No sleeves</option>
          </select>
        </label>

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

        <label style={s.check}>
          <input
            type="checkbox"
            checked={hasHoodie}
            onChange={(e) => setHasHoodie(e.target.checked)}
          />
          Hoodie
        </label>

        {isPant && (
          <label style={s.label}>
            Pant length
            <select
              style={s.input}
              value={pantLength}
              onChange={(e) => setPantLength(e.target.value)}
            >
              <option value="half">Half pant</option>
              <option value="full">Full pant</option>
            </select>
          </label>
        )}

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

        <label style={s.label}>
          Notes
          <textarea
            style={{ ...s.input, minHeight: "80px" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button type="submit" style={s.primary} disabled={saving}>
          {saving ? "Saving…" : "Save design"}
        </button>
        {saveMessage && <p style={s.msg}>{saveMessage}</p>}
      </form>

      <section style={s.orderSection}>
        <h2 style={s.orderTitle}>Place order</h2>
        <p style={s.sub}>
          After saving, submit shipping details. Guests must use the same email as
          checkout for tracking.
        </p>
        <form onSubmit={handlePlaceOrder} style={s.form}>
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
          <label style={s.label}>
            Shipping address
            <textarea
              style={{ ...s.input, minHeight: "72px" }}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
            />
          </label>
          <label style={s.label}>
            Guest email (required if not signed in)
            <input
              type="email"
              style={s.input}
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button type="submit" style={s.secondary} disabled={ordering}>
            {ordering ? "Placing…" : "Place order"}
          </button>
          {orderMessage && <p style={s.msg}>{orderMessage}</p>}
        </form>
      </section>
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
};
