import { adminApi, unwrap } from "./client.js";

export const adminAuthApi = {
  me: () => adminApi.get("/auth/me").then(unwrap),
  login: (payload) => adminApi.post("/auth/login", payload).then(unwrap),
  logout: () => adminApi.post("/auth/logout").then(unwrap),
};

export const adminProductsApi = {
  list: (params) => adminApi.get("/products", { params }).then(unwrap),
  getById: (id) => adminApi.get(`/products/${id}`).then(unwrap),
  create: (payload) => adminApi.post("/products", payload).then(unwrap),
  update: (id, payload) =>
    adminApi.put(`/products/${id}`, payload).then(unwrap),
  patchStatus: (id, isActive) =>
    adminApi.patch(`/products/${id}/status`, { isActive }).then(unwrap),
  patchStock: (id, payload) =>
    adminApi.patch(`/products/${id}/stock`, payload).then(unwrap),
  bulk: (payload) => adminApi.post("/products/bulk", payload).then(unwrap),
  softDelete: (id, reason) =>
    adminApi
      .delete(`/products/${id}`, {
        params: { permanent: false },
        data: { reason },
      })
      .then(unwrap),
  permanentDelete: (id, reason) =>
    adminApi
      .delete(`/products/${id}`, {
        params: { permanent: true },
        data: { reason },
      })
      .then(unwrap),
  uploadImages: (id, files) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("images", f));
    return adminApi
      .post(`/products/${id}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(unwrap);
  },
  deleteImage: (id, publicId) =>
    adminApi
      .delete(`/products/${id}/images/${encodeURIComponent(publicId)}`)
      .then(unwrap),
  reorderImages: (id, order, primaryPublicId = null) =>
    adminApi
      .put(`/products/${id}/images`, { order, primaryPublicId })
      .then(unwrap),
  upload3D: (id, file, format) => {
    const fd = new FormData();
    fd.append("model3d", file);
    if (format) fd.append("format", format);
    return adminApi
      .post(`/products/${id}/model3d`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(unwrap);
  },
  delete3D: (id) => adminApi.delete(`/products/${id}/model3d`).then(unwrap),
};

export const adminCategoriesApi = {
  list: (params) => adminApi.get("/categories", { params }).then(unwrap),
  getById: (id) => adminApi.get(`/categories/${id}`).then(unwrap),
  create: (payload) => adminApi.post("/categories", payload).then(unwrap),
  update: (id, payload) =>
    adminApi.put(`/categories/${id}`, payload).then(unwrap),
  delete: (id, reassignTo = null) =>
    adminApi.delete(`/categories/${id}`, { data: { reassignTo } }).then(unwrap),
  uploadImage: (id, file) => {
    const fd = new FormData();
    fd.append("image", file);
    return adminApi
      .post(`/categories/${id}/image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(unwrap);
  },
  deleteImage: (id) => adminApi.delete(`/categories/${id}/image`).then(unwrap),
};

export const adminCatalogApi = {
  summary: () => adminApi.get("/catalog/summary").then(unwrap),
};

export const adminInventoryApi = {
  list: (params) => adminApi.get("/catalog/inventory", { params }).then(unwrap),
  patchStock: (id, payload) =>
    adminApi.patch(`/catalog/inventory/${id}`, payload).then(unwrap),
  history: (id, params) =>
    adminApi.get(`/catalog/inventory/${id}/history`, { params }).then(unwrap),
};
