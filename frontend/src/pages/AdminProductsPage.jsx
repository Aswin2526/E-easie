import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminCreateProduct, adminPatchProductQuantity, fetchAdminProductsCatalog } from "../api";
import { formatNPR } from "../currency";
import { adminSharedStyles as s } from "../admin/sharedStyles";
import { apiErrorMessage, matchesSearch } from "../admin/adminUtils";

export default function AdminProductsPage() {
  const { searchQuery } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [qtyDrafts, setQtyDrafts] = useState({});
  const [qtySavingById, setQtySavingById] = useState({});
  const [qtyError, setQtyError] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    product_type: "tshirt",
    base_price: "",
    description: "",
    is_active: true,
    image: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAdminProductsCatalog();
        if (!cancelled) setProducts(res?.products || []);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Failed to load products."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const searchOk = matchesSearch(searchQuery, p.id, p.name, p.slug, p.product_type);
      if (!searchOk) return false;
      if (categoryFilter === "all") return true;
      return String(p.product_type || "").trim().toLowerCase() === categoryFilter;
    });
  }, [products, searchQuery, categoryFilter]);

  const categoryOptions = useMemo(() => {
    const base = ["tshirt", "pant", "hoodie"];
    const seen = new Set(base);
    for (const p of products) {
      const value = String(p.product_type || "").trim().toLowerCase();
      if (value && !seen.has(value)) {
        seen.add(value);
        base.push(value);
      }
    }
    return base;
  }, [products]);

  const createTypeOptions = useMemo(
    () => ["tshirt", "hoodie", "pant", "shirt", "skirt", "jacket"],
    [],
  );

  useEffect(() => {
    if (!products.length) return;
    setQtyDrafts((prev) => {
      const next = { ...prev };
      for (const p of products) {
        next[p.id] = String(Number(p.quantity) || 0);
      }
      return next;
    });
  }, [products]);

  function openAddModal() {
    setAddError("");
    setNewProduct({
      name: "",
      product_type: "tshirt",
      base_price: "",
      description: "",
      is_active: true,
      image: null,
    });
    setShowAddModal(true);
  }

  async function onSubmitNewProduct(e) {
    e.preventDefault();
    setSubmitting(true);
    setAddError("");
    try {
      const form = new FormData();
      form.append("name", newProduct.name.trim());
      form.append("product_type", newProduct.product_type);
      form.append("base_price", String(newProduct.base_price).trim());
      form.append("description", newProduct.description.trim());
      form.append("is_active", newProduct.is_active ? "true" : "false");
      if (newProduct.image) form.append("image", newProduct.image);

      const res = await adminCreateProduct(form);
      const created = res?.product;
      if (created) {
        setProducts((prev) => [created, ...prev]);
      }
      setShowAddModal(false);
    } catch (err) {
      setAddError(apiErrorMessage(err, "Failed to create product."));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveQuantity(productId) {
    const raw = String(qtyDrafts[productId] ?? "").trim();
    if (raw === "") return;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setQtyError("Quantity must be a whole number (0 or more).");
      return;
    }
    const current = products.find((p) => p.id === productId);
    if (!current) return;
    if (Number(current.quantity || 0) === parsed) return;

    setQtySavingById((prev) => ({ ...prev, [productId]: true }));
    setQtyError("");
    try {
      await adminPatchProductQuantity(productId, parsed);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                quantity: parsed,
              }
            : p,
        ),
      );
    } catch (err) {
      setQtyError(apiErrorMessage(err, "Failed to update quantity."));
      setQtyDrafts((prev) => ({ ...prev, [productId]: String(Number(current.quantity) || 0) }));
    } finally {
      setQtySavingById((prev) => ({ ...prev, [productId]: false }));
    }
  }

  if (loading) {
    return (
      <main style={inner}>
        <p style={s.muted}>Loading products…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={inner}>
        <section style={s.panel}>
          <h2 style={s.heading}>Products</h2>
          <p style={s.error}>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={inner}>
      <section style={s.tableCard}>
        <div style={catalogHeader}>
          <div>
            <h2 style={s.tableTitle}>Catalog</h2>
            <p style={s.tableHint}>All products including inactive. Storefront only shows active items.</p>
          </div>
          <button type="button" style={addProductButton} onClick={openAddModal}>
            Add product
          </button>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>
                <div style={categoryHeaderWrap}>
                  <span>Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={categoryHeaderSelect}
                    aria-label="Filter products by category"
                  >
                    <option value="all">All</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th style={s.th}>Preview</th>
              <th style={s.th}>Name</th>
              <th style={s.th}>Price</th>
              <th style={s.th}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={s.td}>{p.product_type}</td>
                <td style={s.td}>
                  {p.image ? (
                    <img src={p.image} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <span style={s.actionMuted}>—</span>
                  )}
                </td>
                <td style={s.td}>{p.name}</td>
                <td style={s.td}>{formatNPR(p.base_price)}</td>
                <td style={s.td}>
                  <div style={qtyEditor.wrap}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={qtyDrafts[p.id] ?? String(Number(p.quantity) || 0)}
                      onChange={(e) =>
                        setQtyDrafts((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      onBlur={() => saveQuantity(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveQuantity(p.id);
                        }
                      }}
                      style={qtyEditor.input}
                      aria-label={`Quantity for ${p.name}`}
                    />
                    {qtySavingById[p.id] ? <span style={qtyEditor.status}>Saving...</span> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {qtyError ? <p style={{ ...s.error, padding: "8px 16px 0" }}>{qtyError}</p> : null}
        {filtered.length === 0 ? <p style={{ ...s.muted, padding: "16px" }}>No products match your search/filter.</p> : null}
      </section>
      {showAddModal ? (
        <div style={modal.backdrop} onClick={() => (submitting ? null : setShowAddModal(false))}>
          <section style={modal.card} onClick={(e) => e.stopPropagation()}>
            <h3 style={modal.title}>Add product</h3>
            <form onSubmit={onSubmitNewProduct} style={modal.form}>
              <label style={modal.label}>
                Name
                <input
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  style={modal.input}
                />
              </label>
              <label style={modal.label}>
                Category
                <select
                  value={newProduct.product_type}
                  onChange={(e) => setNewProduct((p) => ({ ...p, product_type: e.target.value }))}
                  style={modal.input}
                >
                  {createTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label style={modal.label}>
                Price (NPR)
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 555.25"
                  value={newProduct.base_price}
                  onChange={(e) => setNewProduct((p) => ({ ...p, base_price: e.target.value }))}
                  style={modal.input}
                />
              </label>
              <label style={modal.label}>
                Description
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                  style={modal.textarea}
                />
              </label>
              <label style={modal.label}>
                Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewProduct((p) => ({ ...p, image: e.target.files?.[0] || null }))}
                  style={modal.fileInput}
                />
              </label>
              <label style={modal.checkboxWrap}>
                <input
                  type="checkbox"
                  checked={newProduct.is_active}
                  onChange={(e) => setNewProduct((p) => ({ ...p, is_active: e.target.checked }))}
                />
                Active product
              </label>
              {addError ? <p style={s.error}>{addError}</p> : null}
              <div style={modal.actions}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={modal.cancelBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" style={modal.submitBtn} disabled={submitting}>
                  {submitting ? "Adding..." : "Add product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

const inner = {
  padding: "24px 28px 40px",
  maxWidth: "1280px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const qtyEditor = {
  wrap: {
    display: "grid",
    gap: "4px",
    maxWidth: "110px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "6px 8px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#111827",
    fontFamily: "inherit",
  },
  status: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: 600,
  },
};

const catalogHeader = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  padding: "16px 16px 8px",
};

const addProductButton = {
  border: "1px solid #111827",
  borderRadius: "10px",
  background: "#111827",
  color: "#fff",
  fontSize: "13px",
  fontWeight: 700,
  fontFamily: "inherit",
  padding: "10px 14px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const categoryHeaderWrap = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: "180px",
};

const categoryHeaderSelect = {
  minWidth: "110px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "5px 8px",
  background: "#fff",
  color: "#111827",
  fontSize: "12px",
  fontWeight: 600,
  fontFamily: "inherit",
};

const modal = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(17, 24, 39, 0.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 40,
    padding: "16px",
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    padding: "16px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },
  title: {
    margin: "0 0 12px",
    fontSize: "22px",
    fontWeight: 800,
    color: "#111827",
  },
  form: {
    display: "grid",
    gap: "10px",
  },
  label: {
    display: "grid",
    gap: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "8px 10px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  textarea: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "8px 10px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },
  fileInput: {
    fontSize: "13px",
    fontFamily: "inherit",
  },
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
  },
  actions: {
    marginTop: "4px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  cancelBtn: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#fff",
    color: "#111827",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "inherit",
    padding: "8px 12px",
    cursor: "pointer",
  },
  submitBtn: {
    border: "1px solid #111827",
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "inherit",
    padding: "8px 12px",
    cursor: "pointer",
  },
};
