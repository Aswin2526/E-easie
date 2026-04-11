import React from "react";

const lineStyle = {
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 600,
  minHeight: "1.35em",
  lineHeight: 1.35,
  margin: "0 0 8px 0",
};

/**
 * Compact average rating for product cards (uses API `rating_average` / `rating_count`).
 */
export default function ProductStarsLine({ average, count }) {
  const n = Number(count);
  if (!n || n < 1) {
    return (
      <p style={{ ...lineStyle, color: "#94a3b8", fontWeight: 500 }} title="No ratings yet">
        No ratings yet
      </p>
    );
  }
  const avg = typeof average === "number" ? average : Number(average);
  const label = Number.isFinite(avg) ? avg.toFixed(1) : "—";
  return (
    <p style={lineStyle} title={`${label} out of 5 from ${n} rating(s)`}>
      <span style={{ color: "#ca8a04" }} aria-hidden="true">
        ★
      </span>{" "}
      {label}
      <span style={{ color: "#94a3b8", fontWeight: 500 }}> · {n} review{n === 1 ? "" : "s"}</span>
    </p>
  );
}
