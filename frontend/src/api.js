const API_ORIGIN =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "" : "http://127.0.0.1:8000");

const AUTH_TOKEN_KEY = "authToken";
const AUTH_ROLE_KEY = "authRole";
const AUTH_NAME_KEY = "authName";

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
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token && !headers.Authorization) {
    headers.Authorization = `Token ${token}`;
  }
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
  const q = new URLSearchParams({ order_number: String(orderId) });
  if (email) q.set("email", email);
  return apiFetch(`/api/track-order?${q.toString()}`);
}

export function fetchTrackedOrders(email) {
  const q = new URLSearchParams();
  if (email) q.set("email", email);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/api/track-order${suffix}`);
}

export function loginUser(email, password) {
  return apiFetch("/api/users/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser({ name, email, password, password2, role }) {
  return apiFetch("/api/users/register/", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      password2,
      role,
    }),
  });
}

export function fetchCurrentUser() {
  return apiFetch("/api/users/me/");
}

export function fetchAdminDashboard() {
  return apiFetch("/api/users/admin/dashboard/");
}

// Wishlist
export function fetchWishlist() {
  return apiFetch("/api/wishlist/");
}

export function addToWishlist(productId) {
  return apiFetch("/api/wishlist/", {
    method: "POST",
    body: JSON.stringify({ product: productId }),
  });
}

export function removeFromWishlist(id) {
  return apiFetch(`/api/wishlist/${id}/`, {
    method: "DELETE",
  });
}

// Cart
export function fetchCart() {
  return apiFetch("/api/cart/current/");
}

export function addToCart({ product, customization, quantity }) {
  const payload = { product, quantity: quantity || 1 };
  if (customization) payload.customization = customization;
  return apiFetch("/api/cart/items/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removeCartItem(itemId) {
  return apiFetch(`/api/cart/items/${itemId}/`, {
    method: "DELETE",
  });
}

export function clearCart() {
  return apiFetch("/api/cart/clear/", {
    method: "POST",
  });
}

export function persistAuth({ token, role, name }) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (role) localStorage.setItem(AUTH_ROLE_KEY, role);
  if (name) localStorage.setItem(AUTH_NAME_KEY, name);
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(AUTH_NAME_KEY);
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredRole() {
  return localStorage.getItem(AUTH_ROLE_KEY);
}

export function getStoredName() {
  return localStorage.getItem(AUTH_NAME_KEY);
}
