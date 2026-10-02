import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PackageCheck,
  PackageX,
  AlertTriangle,
  Ban,
  Boxes,
  ArrowUpRight,
} from "lucide-react";
import { adminCatalogApi, adminProductsApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import TableSkeleton from "../components/TableSkeleton.jsx";

function StockBadge({ availability }) {
  const map = {
    "out-of-stock": "bg-rose-500/15 text-rose-300 border-rose-500/30",
    "low-stock": "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "in-stock": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return (
    <span className={`chip border ${map[availability] || map["in-stock"]}`}>
      {String(availability || "in-stock")
        .split("-")
        .map((s) => s[0]?.toUpperCase() + s.slice(1))
        .join(" ")}
    </span>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await adminCatalogApi.summary();
        if (mounted) setSummary(data);
      } catch (e) {
        if (mounted) setErr(getErrorMessage(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const counts = summary?.totals || {};
  const recently = summary?.recentlyAdded || [];
  const lowStock = summary?.lowStockList || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Catalog Overview</h1>
          <p className="text-sm text-ink-400 mt-1">
            Product health, stock, and recent activity across the catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/products/new" className="btn btn-primary">
            + New Product
          </Link>
          <Link to="/inventory" className="btn-ghost">
            Inventory <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {loading && !summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="card p-5 space-y-3 animate-pulse h-[128px] bg-ink-800/30"
            />
          ))}
          <div className="col-span-full">
            <TableSkeleton rows={6} cols={6} />
          </div>
        </div>
      )}

      {err && !loading && (
        <div className="card p-4 border-amber-500/30 bg-amber-500/5 text-amber-300 text-sm">
          {err}
        </div>
      )}

      {summary && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Products"
              value={counts.totalProducts ?? 0}
              icon={PackageCheck}
              tone="ink"
            />
            <StatCard
              label="Active"
              value={counts.activeProducts ?? 0}
              icon={Boxes}
              tone="success"
            />
            <StatCard
              label="Low Stock"
              value={counts.lowStock ?? 0}
              icon={AlertTriangle}
              tone="warning"
            />
            <StatCard
              label="Out of Stock"
              value={counts.outOfStock ?? 0}
              icon={PackageX}
              tone="danger"
            />
            <StatCard
              label="Inactive"
              value={counts.inactiveProducts ?? 0}
              icon={Ban}
              tone="ink"
            />
            <StatCard
              label="Categories"
              value={counts.categoriesCount ?? 0}
              icon={Boxes}
              tone="default"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg">Recently added</h2>
                <Link
                  to="/products"
                  className="text-xs text-brand-300 hover:underline"
                >
                  View all
                </Link>
              </div>
              {recently.length === 0 ? (
                <div className="text-sm text-ink-400 py-6 text-center">
                  No products added yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {recently.map((p) => (
                    <li
                      key={p._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-ink-800/50 transition-colors"
                    >
                      <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-ink-800 grid place-items-center">
                        {p.images?.[0]?.url ? (
                          <img
                            src={p.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Boxes size={16} className="text-ink-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${p._id}`}
                          className="font-medium hover:text-brand-300 block truncate"
                        >
                          {p.name}
                        </Link>
                        <div className="text-xs text-ink-400 truncate">
                          SKU {p.sku} · {p.category?.name || "—"}
                        </div>
                      </div>
                      <StockBadge availability={p.availability} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg">Low stock alerts</h2>
                <Link
                  to="/inventory"
                  className="text-xs text-brand-300 hover:underline"
                >
                  Manage inventory
                </Link>
              </div>
              {lowStock.length === 0 ? (
                <div className="text-sm text-ink-400 py-6 text-center">
                  Stock levels look healthy. 🍀
                </div>
              ) : (
                <ul className="space-y-2">
                  {lowStock.map((p) => (
                    <li
                      key={p._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-ink-800/50 transition-colors"
                    >
                      <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-ink-800 grid place-items-center">
                        {p.images?.[0]?.url ? (
                          <img
                            src={p.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Boxes size={16} className="text-ink-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${p._id}`}
                          className="font-medium hover:text-brand-300 block truncate"
                        >
                          {p.name}
                        </Link>
                        <div className="text-xs text-ink-400 truncate">
                          Stock {p.stock}
                        </div>
                      </div>
                      <StockBadge availability={p.availability} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
