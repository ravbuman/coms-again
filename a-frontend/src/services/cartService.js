import api from "./api";

export const getCart = (token) => api.get("/products/cart/me", { headers: { Authorization: `Bearer ${token}` } });
export const addToCart = (productId, quantity = 1, token) =>
  api.post("/products/cart/add", { productId, quantity }, { headers: { Authorization: `Bearer ${token}` } });
export const removeFromCart = (productId, token) =>
  api.post("/products/cart/remove", { productId }, { headers: { Authorization: `Bearer ${token}` } });
export const clearCart = (token) =>
  api.post("/products/cart/clear", {}, { headers: { Authorization: `Bearer ${token}` } });
