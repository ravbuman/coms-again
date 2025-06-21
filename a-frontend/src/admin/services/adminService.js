import api from "./api";

// Product Management
export const createProduct = (formData) => {
  const token = localStorage.getItem('token');
  return api.post("/products/", formData, {
    headers: { 
      "Content-Type": "multipart/form-data",
      "Authorization": `Bearer ${token}`
    }
  });
};

export const updateProduct = (id, formData) => {
  const token = localStorage.getItem('token');
  return api.put(`/products/orders/${id}/status`, formData, {
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
};

export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Order Management
export const getAllOrders = () => api.get("/products/orders/all");
export const updateOrderStatus = (id, status) => {
  const token = localStorage.getItem('token');
  return api.put(`/products/orders/${id}/status`, status, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
};
export const markOrderAsPaid = (id) => api.post(`/products/orders/${id}/mark-paid`);
export const getOrderById = (id) => api.get(`/products/orders/${id}`);

// User Management
export const getAllUsers = () => api.get("/products/users/all");
export const getUserOrders = (userId) => api.get(`/products/orders/user/${userId}`);
export const deleteUser = (id) => api.delete(`/products/users/${id}`);

// Coupon Management
export const createCoupon = (couponData) => api.post("/coupons/", couponData);
export const getAllCoupons = () => api.get("/coupons/");
export const updateCoupon = (id, couponData) => api.put(`/coupons/${id}`, couponData);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);

// Admin Authentication
export const adminLogin = (credentials) => api.post("/auth/admin/login", credentials);
export const adminRegister = (adminData) => api.post("/auth/admin/register", adminData);

// Push Token for Admin
export const saveAdminPushToken = (token) => api.post("/admins/push-token", { token }); 