import api from "./api";

export const getWishlist = (token) => api.get("/products/wishlist/me", { headers: { Authorization: `Bearer ${token}` } });
export const addToWishlist = (productId, token) =>
  api.post("/products/wishlist/add", { productId }, { headers: { Authorization: `Bearer ${token}` } });
export const removeFromWishlist = (productId, token) =>
  api.post("/products/wishlist/remove", { productId }, { headers: { Authorization: `Bearer ${token}` } });
