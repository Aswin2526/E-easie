export function apiErrorMessage(err, fallback) {
  const d = err?.data;
  if (typeof d === "object" && d && d.detail) return String(d.detail);
  if (typeof d === "object" && d) {
    const first = Object.values(d)[0];
    if (Array.isArray(first) && first[0]) return String(first[0]);
  }
  return err?.message || fallback;
}

export function matchesSearch(query, ...fields) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => String(f ?? "").toLowerCase().includes(q));
}
