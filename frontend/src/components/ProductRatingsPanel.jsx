import React, { useCallback, useEffect, useState } from "react";
import {
  fetchProductRatingSummary,
  fetchProductRatings,
  postProductRating,
} from "../api";
import ProductStarsLine from "./ProductStarsLine";

const box = {
  marginTop: "20px",
  padding: "16px 18px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
};
const h = { margin: "0 0 10px 0", fontSize: "15px", fontWeight: 800, color: "#1a1a2e" };
const row = { display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginBottom: "10px" };
const starBtn = (on, interactive) => ({
  fontSize: "22px",
  lineHeight: 1,
  padding: "2px 4px",
  border: "none",
  background: "transparent",
  cursor: interactive ? "pointer" : "default",
  color: on ? "#ca8a04" : "#cbd5e1",
});
const textarea = {
  width: "100%",
  minHeight: "72px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  fontFamily: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
};
const submit = {
  marginTop: "10px",
  padding: "8px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#1a1a2e",
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};
const reviewItem = {
  padding: "10px 0",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "13px",
};
const muted = { color: "#64748b", fontSize: "12px", margin: "4px 0 0 0" };

export default function ProductRatingsPanel({ productId, isLoggedIn }) {
  const [summary, setSummary] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draftStars, setDraftStars] = useState(5);
  const [draftComment, setDraftComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setMessage(null);
    try {
      const [sum, reviews] = await Promise.all([
        fetchProductRatingSummary(productId),
        fetchProductRatings(productId),
      ]);
      setSummary(sum);
      setList(Array.isArray(reviews) ? reviews : []);
      if (sum?.mine?.stars) {
        setDraftStars(sum.mine.stars);
        setDraftComment(sum.mine.comment || "");
      } else {
        setDraftStars(5);
        setDraftComment("");
      }
    } catch {
      setSummary(null);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isLoggedIn || !productId) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await postProductRating(productId, { stars: draftStars, comment: draftComment.trim() });
      setMessage("Thanks — your rating was saved.");
      await load();
    } catch (err) {
      const d = err?.data;
      const text = typeof d === "object" && d?.detail ? String(d.detail) : err.message || "Could not save.";
      setMessage(text);
    } finally {
      setSubmitting(false);
    }
  }

  if (!productId) return null;

  return (
    <div style={box}>
      <h3 style={h}>Ratings & reviews</h3>
      {loading ? (
        <p style={muted}>Loading…</p>
      ) : (
        <>
          <ProductStarsLine average={summary?.average} count={summary?.count} />
          {isLoggedIn && summary && summary.can_submit_review === false && !summary.mine ? (
            <p style={{ ...muted, marginTop: "10px", color: "#92400e", fontWeight: 600 }}>
              Reviews unlock after your order for this product is marked delivered. You can also leave a review from
              My Profile → Purchased orders.
            </p>
          ) : null}
          {isLoggedIn && (summary?.can_submit_review !== false || summary?.mine) ? (
            <form onSubmit={handleSubmit}>
              <p style={{ margin: "0 0 6px 0", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                Your rating
              </p>
              <div style={row} role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    style={starBtn(n <= draftStars, true)}
                    onClick={() => setDraftStars(n)}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    aria-pressed={n <= draftStars}
                  >
                    ★
                  </button>
                ))}
              </div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                Comment (optional)
                <textarea
                  style={{ ...textarea, marginTop: "6px" }}
                  value={draftComment}
                  onChange={(e) => setDraftComment(e.target.value)}
                  maxLength={2000}
                  placeholder="Share what you think about this product…"
                />
              </label>
              <button type="submit" style={submit} disabled={submitting}>
                {submitting ? "Saving…" : summary?.mine ? "Update my rating" : "Submit rating"}
              </button>
            </form>
          ) : isLoggedIn ? null : (
            <p style={muted}>Sign in to rate this product.</p>
          )}
          {message ? <p style={{ ...muted, color: message.startsWith("Thanks") ? "#15803d" : "#b91c1c" }}>{message}</p> : null}
          {list.length > 0 ? (
            <div style={{ marginTop: "16px" }}>
              <p style={{ margin: "0 0 6px 0", fontSize: "13px", fontWeight: 700, color: "#475569" }}>
                Recent reviews
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {list.map((r) => (
                  <li key={r.id} style={reviewItem}>
                    <strong style={{ color: "#1a1a2e" }}>{r.reviewer_name}</strong>{" "}
                    <span style={{ color: "#ca8a04" }}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                    {r.comment ? <p style={{ margin: "6px 0 0", color: "#334155", whiteSpace: "pre-wrap" }}>{r.comment}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
