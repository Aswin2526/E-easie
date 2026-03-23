/**
 * Nepalese Rupee (NPR). `base_price` from the API is stored as NPR (see seed commands).
 */
export function formatNPR(nprAmount) {
  const npr = Math.round(Number(nprAmount));
  if (Number.isNaN(npr)) return "Rs. 0";
  return `Rs. ${npr.toLocaleString("en-IN")}`;
}
