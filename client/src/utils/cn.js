import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatINR = (n, opts = {}) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    ...opts,
  }).format(Number(n) || 0);

export const formatDate = (date, opts) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...opts,
  }).format(date ? new Date(date) : new Date());

export const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

export const truncate = (s, n = 120) =>
  typeof s !== "string" ? "" : s.length <= n ? s : s.slice(0, n) + "…";
