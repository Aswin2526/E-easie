"""eSewa ePay v2 helpers (sign request, verify callback, optional status check)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal


def sign_message(secret: str, message: str) -> str:
    mac = hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).digest()
    return base64.b64encode(mac).decode("utf-8")


def sign_payment_request(total_amount: str, transaction_uuid: str, product_code: str, secret: str) -> str:
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    return sign_message(secret, message)


def format_money(amount: Decimal) -> str:
    q = Decimal(amount).quantize(Decimal("0.01"))
    if q == q.to_integral():
        return str(int(q))
    return format(q, "f").rstrip("0").rstrip(".")


def build_response_signature_message(payload: dict) -> str | None:
    """Rebuild the string eSewa signed for the success callback (excluding signature field)."""
    raw = (payload.get("signed_field_names") or "").strip()
    if not raw:
        return None
    names = [n.strip() for n in raw.split(",") if n.strip()]
    parts: list[str] = []
    for name in names:
        if name not in payload:
            return None
        val = payload[name]
        if isinstance(val, (dict, list)):
            return None
        parts.append(f"{name}={val}")
    return ",".join(parts)


def verify_payment_response(payload: dict, secret: str) -> bool:
    expected = payload.get("signature")
    if not expected:
        return False
    message = build_response_signature_message(payload)
    if message is None:
        return False
    computed = sign_message(secret, message)
    return hmac.compare_digest(computed.strip(), str(expected).strip())


def fetch_transaction_status(
    *,
    status_url: str,
    product_code: str,
    total_amount: str,
    transaction_uuid: str,
    timeout: int = 15,
) -> dict | None:
    """GET eSewa status endpoint; returns parsed JSON or None on failure."""
    q = urllib.parse.urlencode(
        {
            "product_code": product_code,
            "total_amount": total_amount,
            "transaction_uuid": transaction_uuid,
        }
    )
    url = f"{status_url.rstrip('/')}/?{q}"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, json.JSONDecodeError, ValueError, TimeoutError):
        return None


def decode_callback_data(raw_b64: str) -> dict | None:
    if not raw_b64:
        return None
    try:
        decoded = base64.b64decode(raw_b64).decode("utf-8")
        return json.loads(decoded)
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        return None
