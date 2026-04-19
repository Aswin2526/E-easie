"""Normalize #rgb / #rrggbb for comparing catalog vs customization colors."""

from __future__ import annotations


def normalize_hex_color(value: object) -> str | None:
    if value is None or not isinstance(value, str):
        return None
    s = value.strip()
    if not s.startswith("#"):
        return None
    h = s[1:].lower()
    if len(h) == 3 and all(c in "0123456789abcdef" for c in h):
        h = "".join(c * 2 for c in h)
    if len(h) != 6 or any(c not in "0123456789abcdef" for c in h):
        return None
    return f"#{h}"
