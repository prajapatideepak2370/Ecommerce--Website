import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderKanban,
  Truck,
  Users,
  MessageSquare,
  Warehouse,
  CreditCard,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logout } from "../store/authSlice.js";
import { clearCart } from "../store/cartSlice.js";
import { cn } from "../utils/cn.js";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderKanban },
  { to: "/admin/orders", label: "Orders", icon: Truck },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      await dispatch(clearCart()).unwrap();
      toast.success("Logged out");
      navigate("/login");
    } catch (e) {
      toast.error(e?.message || "Logout failed");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="md:min-h-screen border-r border-ink-800 bg-ink-950/70 p-4 md:p-6 flex flex-col">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center">
            <span className="font-display font-bold text-ink-950 text-lg">T³</span>
          </div>
          <div>
            <div className="font-display font-semibold gradient-text">TRYVOXEL³</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">Admin Console</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-brand-500/15 text-brand-200 border border-brand-500/30"
                    : "text-ink-200 hover:bg-ink-800/70 border border-transparent"
                )
              }
            >
              <it.icon size={16} /> {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="pt-4 border-t border-ink-800 mt-6 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-200 hover:bg-ink-800/70">
            ← Back to Store
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>
      <div className="flex flex-col min-h-screen">
        <header className="md:hidden h-16 border-b border-ink-800 flex items-center px-4" />
        <main className="flex-1 p-4 md:p-8 space-y-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
