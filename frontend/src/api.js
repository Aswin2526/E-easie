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

export function fetchProductRatingSummary(productId) {
  return apiFetch(`/api/products/${productId}/rating-summary/`);
}

export function fetchProductRatings(productId) {
  return apiFetch(`/api/products/${productId}/ratings/`);
}

export function postProductRating(productId, { stars, comment }) {
  return apiFetch(`/api/products/${productId}/ratings/`, {
    method: "POST",
    body: JSON.stringify({ stars, comment: comment ?? "" }),
  });
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

/** List current user's placed orders (GET). */
export function fetchMyOrders() {
  return apiFetch("/api/orders/");
}

/** List current user's saved customizations (GET). */
export function fetchMyCustomizations() {
  return apiFetch("/api/customizations/");
}

/** Create orders from cart and return eSewa signed fields; caller should POST form to epay_url. */
export function checkoutCartWithEsewa(shippingAddress) {
  return apiFetch("/api/cart/esewa-checkout/", {
    method: "POST",
    body: JSON.stringify({ shipping_address: shippingAddress }),
  });
}

/** Browser-only: POST redirect to eSewa (cannot use fetch due to CORS). */
export function fetchPaymentReceipt(ref) {
  const q = new URLSearchParams({ ref: String(ref) });
  return apiFetch(`/api/payment-receipt/?${q.toString()}`);
}

export function submitEsewaPaymentForm(epayUrl, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = epayUrl;
  form.acceptCharset = "UTF-8";
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value ?? "");
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
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

export function requestForgotPasswordOtp(email) {
  return apiFetch("/api/users/forgot-password/request-otp/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyForgotPasswordOtp(email, otp) {
  return apiFetch("/api/users/forgot-password/verify-otp/", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export function resetPasswordWithOtp({ email, otp, password, password2 }) {
  return apiFetch("/api/users/forgot-password/reset/", {
    method: "POST",
    body: JSON.stringify({ email, otp, password, password2 }),
  });
}

export function createVendorRequest({ name, email, company_name, details }) {
  return apiFetch("/api/users/vendor-requests/", {
    method: "POST",
    body: JSON.stringify({ name, email, company_name, details }),
  });
}

export function registerUser({ name, email, password, password2 }) {
  return apiFetch("/api/users/register/", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      password2,
    }),
  });
}

export function fetchCurrentUser() {
  return apiFetch("/api/users/me/");
}

export function fetchAdminDashboard() {
  return apiFetch("/api/users/admin/dashboard/");
}

export function fetchAdminUsers() {
  return apiFetch("/api/users/admin/users/");
}

export function fetchAdminOrders() {
  return apiFetch("/api/users/admin/orders/");
}

export function adminPatchOrder(orderId, { status, cancel_description }) {
  return apiFetch(`/api/users/admin/orders/${orderId}/`, {
    method: "PATCH",
    body: JSON.stringify({ status, cancel_description: cancel_description ?? "" }),
  });
}

export function fetchAdminProductsCatalog() {
  return apiFetch("/api/users/admin/products/");
}

export function fetchAdminReport() {
  return apiFetch("/api/users/admin/report/");
}

export function fetchAdminVendorRequests() {
  return apiFetch("/api/users/admin/vendor-requests/");
}

export function adminUpdateVendorRequest(requestId, { status, admin_note }) {
  return apiFetch(`/api/users/admin/vendor-requests/${requestId}/`, {
    method: "PATCH",
    body: JSON.stringify({ status, admin_note: admin_note ?? "" }),
  });
}

export function adminPatchUser(userId, isActive) {
  return apiFetch(`/api/users/admin/users/${userId}/`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function adminDeleteUser(userId) {
  return apiFetch(`/api/users/admin/users/${userId}/`, {
    method: "DELETE",
  });
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

export function patchCartItem(itemId, body) {
  return apiFetch(`/api/cart/items/${itemId}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
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
