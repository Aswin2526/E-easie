/**
 * Matches backend `Customization.unit_price_for_order`: +25% when fabric is not cotton.
 */
const NON_COTTON_MARKUP = 0.25;

export function customizationUnitPrice(basePrice, fabric) {
  const base = Number(basePrice);
  if (Number.isNaN(base)) return 0;
  const f = String(fabric || "").toLowerCase();
  if (f === "cotton" || f === "") return Math.round(base * 100) / 100;
  const marked = base * (1 + NON_COTTON_MARKUP);
  return Math.round(marked * 100) / 100;
}

export function fabricHasNonCottonMarkup(fabric) {
  const f = String(fabric || "").toLowerCase();
  return f !== "" && f !== "cotton";
}
