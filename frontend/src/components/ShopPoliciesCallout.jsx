import React from "react";

const box = {
  marginTop: "18px",
  padding: "14px 16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "13px",
  lineHeight: 1.55,
  color: "#334155",
};
const title = { margin: "0 0 8px 0", fontSize: "13px", fontWeight: 800, color: "#0f172a" };
const ul = { margin: "6px 0 0", paddingLeft: "18px" };

export default function ShopPoliciesCallout() {
  return (
    <aside style={box} aria-label="Order and return policy">
      <p style={title}>Orders, cancellation &amp; returns</p>
      <ul style={ul}>
        <li>
          <strong>Cancellation:</strong> You can cancel from <strong>Track order</strong> while your order is still{" "}
          <strong>Pending</strong> or <strong>Confirmed</strong> (before it ships). After that, contact support.
        </li>
        <li>
          <strong>7-day returns:</strong> Unworn items with tags may be returned within <strong>7 days</strong> of the
          order being marked <strong>delivered</strong>. Start a return from Track order when you are eligible, or email
          support with your order number.
        </li>
      </ul>
    </aside>
  );
}
