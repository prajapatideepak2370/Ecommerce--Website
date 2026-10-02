import axios from "axios";

export const adminApi = axios.create({
  baseURL: "/api/admin",
  withCredentials: true,
  timeout: 60_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

let _logoutCallback = null;
let _responseInterceptorId = null;
export function setAdminLogoutCallback(fn) {
  _logoutCallback = fn;
}

export function setupAdminInterceptors() {
  if (_responseInterceptorId !== null) return;
  _responseInterceptorId = adminApi.interceptors.response.use(
    (res) => res,
    (err) => {
      if (
        err &&
        err.response &&
        err.response.status === 401 &&
        typeof _logoutCallback === "function" &&
        !(
          err.config &&
          err.config.url &&
          /\/auth\/(?:login|logout|me)(?:[/?]|$)/.test(String(err.config.url))
        )
      ) {
        Promise.resolve(_logoutCallback()).catch((logoutError) => {
          console.error("Failed to clear the admin session:", logoutError);
        });
      }
      return Promise.reject(err);
    },
  );
}

export const unwrap = (response) =>
  response?.data?.data !== undefined ? response.data.data : response?.data;

export const getErrorMessage = (err, fallback = "Something went wrong.") => {
  const direct =
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    fallback;
  if (Array.isArray(direct)) return direct.join(", ");
  return direct || fallback;
};
