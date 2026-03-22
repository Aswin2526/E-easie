const API_ORIGIN =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "" : "http://127.0.0.1:8000");

export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path}`;
}

function parseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_ORIGIN}${path}`;
  const headers = { ...(options.headers || {}) };
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { credentials: "include", ...options, headers });
  const text = await res.text();
  const data = parseBody(text);
  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null
        ? JSON.stringify(data)
        : res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function fetchProducts() {
  return apiFetch("/api/products/");
}

export function fetchProduct(id) {
  return apiFetch(`/api/products/${id}/`);
}

export function saveCustomization(payload) {
  return apiFetch("/api/customizations/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function placeOrder(payload) {
  return apiFetch("/api/orders/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function trackOrder(orderId, email) {
  const q = new URLSearchParams({ id: String(orderId) });
  if (email) q.set("email", email);
  return apiFetch(`/api/orders/track/?${q.toString()}`);
}

export function loginUser(email, password) {
  return apiFetch("/api/users/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser({ username, email, password, password2 }) {
  return apiFetch("/api/users/register/", {
    method: "POST",
    body: JSON.stringify({ username, email, password, password2 }),
  });
}
