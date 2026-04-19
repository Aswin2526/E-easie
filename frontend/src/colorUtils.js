/** Normalize #rgb / #rrggbb for color inputs; invalid values return null. */
export function normalizeHexColor(input) {
  if (input == null || typeof input !== "string") return null;
  const s = input.trim();
  if (!/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(s)) return null;
  if (s.length === 4) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return s.toLowerCase();
}
