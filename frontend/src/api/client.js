import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "/api/v1";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err?.response?.status === 401 &&
      !window.location.pathname.startsWith("/login")
    ) {
      // Will be handled by the auth state in Phase 2
      // eslint-disable-next-line no-console
      console.warn("401 received from API — auth may be invalid");
    }
    return Promise.reject(err);
  }
);

export const unwrap = (response) => response?.data?.data ?? response?.data;
export const getErrorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.error?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;
