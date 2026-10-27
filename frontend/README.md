# TRYVOXEL³ — Frontend (React + Vite SPA)

Independent React 18 single-page application for the TRYVOXEL³ storefront and
admin console. It renders the UI and talks to the backend exclusively through
REST APIs — it never accesses the database or holds server secrets.

## Responsibilities

- UI, layouts, and reusable components
- Client-side routing (React Router) and protected routes
- Forms, tables, dashboards, and navigation
- API integration via a centralized Axios client
- Form validation, loading / error / empty states, and toasts
- Global state (Redux Toolkit: `auth`, `cart`)

## Stack

React 18 · Vite 5 · React Router 6 · Redux Toolkit + React Redux · Axios ·
Tailwind CSS · Framer Motion · Three.js + React Three Fiber + drei ·
lucide-react · react-hot-toast · react-loading-skeleton

## Structure

```text
frontend/
├── src/
│   ├── api/         centralized Axios client + endpoint functions
│   ├── admin/       separate admin console app (own entry, own API client)
│   ├── components/  reusable UI components
│   ├── layouts/     page layouts
│   ├── pages/       storefront + account pages
│   ├── routes/      routing + route guards
│   ├── store/       Redux Toolkit slices
│   └── utils/       helpers
├── public/
├── index.html       storefront entry
├── admin.html       admin console entry
└── vite.config.js
```

## Environment

Copy `.env.example` to `.env`:

```env
VITE_API_BASE=http://localhost:5000/api/v1
VITE_ADMIN_API_BASE=http://localhost:5000/api/admin
VITE_ADMIN_BASE=/tvx-console
```

Only `VITE_*` variables are exposed to the browser — never put backend secrets
in this file. The API base URLs are read by
[`src/api/client.js`](./src/api/client.js) and
[`src/admin/api/client.js`](./src/admin/api/client.js).

## Run

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
```

The backend must be running on the `VITE_API_BASE` origin (default
`http://localhost:5000`). Requests use `withCredentials` so the session cookie
is sent to the API.

- Storefront: `http://localhost:5173/`
- Admin console: `http://localhost:5173/tvx-console` (separate entry, not linked
  from the customer UI)

## Build

```bash
npm run build     # outputs to frontend/dist
npm run preview   # preview the production build
```

Production builds use same-origin API paths: `/api/v1` and `/api/admin`.
Vercel forwards these paths to the Render API so browser session cookies stay
first-party. Do not set `VITE_API_BASE` or `VITE_ADMIN_API_BASE` to the Render
origin in Vercel; the build routes those known API origins through Vercel.
The Vercel configuration also serves `/tvx-console` from `admin.html` and
falls back to `index.html` for storefront routes.

For a separate API host, set `VITE_API_BASE` and `VITE_ADMIN_API_BASE` to its
HTTPS URLs at build time. Admin authentication uses secure,
SameSite=Strict session cookies, so keep the frontend and API under the same
site.
