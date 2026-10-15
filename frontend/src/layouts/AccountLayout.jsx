import { NavLink, Outlet, useLocation } from "react-router-dom";
import { User as UserIcon, MapPin, Package, Settings2 } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/authSlice.js";
import { cn } from "../utils/cn.js";

const links = [
  { to: "/account", label: "Profile", icon: UserIcon, end: true },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/orders", label: "My Orders", icon: Package },
  { to: "/account/settings", label: "Settings", icon: Settings2 },
];

export default function AccountLayout() {
  const user = useSelector(selectUser);
  const location = useLocation();
  return (
    <div className="page-container py-10 grid md:grid-cols-[260px_1fr] gap-6">
      <aside className="card p-4 self-start md:sticky md:top-20">
        <div className="px-3 py-4 border-b border-ink-800 mb-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500/40 to-accent/30 grid place-items-center mb-3 font-display text-xl font-semibold">
            {user?.name?.[0] || "Y"}
          </div>
          <div className="font-medium truncate">
            {user?.name || "Your account"}
          </div>
          <div className="text-xs text-ink-400 truncate">{user?.email}</div>
        </div>
        <nav className="space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-brand-500/15 text-brand-200 border border-brand-500/30"
                    : "text-ink-200 hover:bg-ink-800/70 border border-transparent",
                )
              }
            >
              <l.icon size={16} /> {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="card p-6 md:p-8 min-h-[60vh]">
        <Outlet />
      </div>
    </div>
  );
}
