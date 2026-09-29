import { api, unwrap } from "./client";

export const authApi = {
  me: () => api.get("/users/me").then(unwrap),
  register: (payload) => api.post("/users/register", payload).then(unwrap),
  login: (payload) => api.post("/users/login", payload).then(unwrap),
  logout: () => api.post("/users/logout").then(unwrap),
  updateProfile: (payload) => api.put("/users/profile", payload).then(unwrap),
};

export const productApi = {
  list: (params) => api.get("/products", { params }).then(unwrap),
  bySlug: (slug) => api.get(`/products/${slug}`).then(unwrap),
};

export const categoryApi = {
  list: () => api.get("/categories").then(unwrap),
};

export const cartApi = {
  get: () => api.get("/cart").then(unwrap),
  addItem: (payload) => api.post("/cart/items", payload).then(unwrap),
  updateQty: (itemId, quantity) =>
    api.put(`/cart/items/${itemId}`, { quantity }).then(unwrap),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`).then(unwrap),
  clear: () => api.delete("/cart").then(unwrap),
};

export const orderApi = {
  create: (payload) => api.post("/orders", payload).then(unwrap),
  mine: () => api.get("/orders").then(unwrap),
  byId: (id) => api.get(`/orders/${id}`).then(unwrap),
  cancel: (id) => api.post(`/orders/${id}/cancel`).then(unwrap),
};
