import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderKanban,
  Warehouse,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAdminAuth } from "../store/AuthContext.jsx";
import { cn } from "../../utils/cn.js";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/products", label: "Products", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Warehouse },
  { to: "/categories", label: "Categories", icon: FolderKanban },
];

export default function AdminConsoleLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out.");
    } catch (_) {
      toast.error("Sign out failed.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside
        className={cn(
          "md:min-h-screen border-r border-ink-800 bg-ink-950/70 backdrop-blur p-4 md:p-6 flex flex-col",
          open ? "block fixed inset-0 z-40" : "hidden md:flex",
        )}
      >
        <div className="flex items-center justify-between md:block md:mb-8">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center">
              <span className="font-display font-bold text-ink-950 text-lg">
                T³
              </span>
            </div>
            <div>
              <div className="font-display font-semibold gradient-text">
                TRYVOXEL³
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
                Console
              </div>
            </div>
          </div>
          <button
            className="md:hidden h-10 w-10 rounded-lg grid place-items-center text-ink-200"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 mt-6 md:mt-0">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-brand-500/15 text-brand-200 border border-brand-500/30"
                    : "text-ink-200 hover:bg-ink-800/70 border border-transparent",
                )
              }
            >
              <it.icon size={16} /> {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-4 border-t border-ink-800 mt-6 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-800/50 border border-ink-700">
            <div className="h-8 w-8 rounded-lg bg-brand-500/20 grid place-items-center">
              <User size={14} className="text-brand-300" />
            </div>
            <div className="min-w-0">
              <div className="text-sm truncate">{admin?.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400 truncate">
                {admin?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-col min-h-screen">
        <header className="h-16 border-b border-ink-800 flex items-center px-4 md:px-8 gap-3 sticky top-0 z-30 bg-ink-950/80 backdrop-blur">
          <button
            className="md:hidden h-10 w-10 rounded-lg grid place-items-center text-ink-200 hover:bg-ink-800/60"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex-1" />
          <span className="text-xs text-ink-400 hidden sm:block">
            TRYVOXEL³ Console — Catalog
          </span>
        </header>
        <main className="flex-1 p-4 md:p-8 space-y-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
