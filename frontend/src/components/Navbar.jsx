import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  X,
  Package,
  LogOut,
  Settings as SettingsIcon,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  selectIsAuthenticated,
  selectUser,
  logout,
} from "../store/authSlice.js";
import { selectCartCount } from "../store/cartSlice.js";
import { cn } from "../utils/cn.js";
import { getThemeMode, setThemeMode } from "../utils/theme.js";
import BrandLogo from "./BrandLogo.jsx";

const navLinks = [
  { to: "/shop", label: "Shop" },
  { to: "/collections", label: "Collections" },
  { to: "/new", label: "New Arrivals" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartCount);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMode, setThemeModeState] = useState(getThemeMode);

  const closeMenus = () => {
    setOpen(false);
    setMenuOpen(false);
  };

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest("[data-menu]")) setMenuOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success("Logged out");
      navigate("/");
    } catch (err) {
      toast.error(err?.message || "Logout failed");
    }
  };

  const cycleTheme = () => {
    const modes = ["system", "light", "dark"];
    const nextMode = modes[(modes.indexOf(themeMode) + 1) % modes.length];
    setThemeMode(nextMode);
    setThemeModeState(nextMode);
  };
  const ThemeIcon =
    themeMode === "system" ? Monitor : themeMode === "light" ? Sun : Moon;

  return (
    <header className="site-navbar sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="page-container flex h-16 items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <BrandLogo className="h-11 w-11 rounded-lg" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold tracking-tight gradient-text">
              TRYVOXEL³ᴰ
            </span>
            <span className="navbar-muted hidden sm:block text-[10px] uppercase tracking-[0.22em]">
              Experiment • Create • Experience
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "navbar-nav-link px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "navbar-active"
                    : "",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        <button
          aria-label="Search"
          className="navbar-control h-10 w-10 grid place-items-center rounded-lg"
          onClick={() => navigate("/shop")}
        >
          <Search size={18} />
        </button>
        <button
          type="button"
          aria-label={`Theme: ${themeMode}`}
          title={`Theme: ${themeMode}`}
          onClick={cycleTheme}
          className="navbar-control h-10 w-10 grid place-items-center rounded-lg"
        >
          <ThemeIcon size={18} />
        </button>

        <Link
          to="/cart"
          aria-label="Cart"
          className="navbar-control relative h-10 w-10 grid place-items-center rounded-lg"
        >
          <ShoppingBag size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold grid place-items-center shadow">
              {cartCount}
            </span>
          )}
        </Link>

        <div className="relative hidden md:block" data-menu>
          <button
            aria-label="Account"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="navbar-control navbar-border h-10 w-10 grid place-items-center rounded-lg border"
          >
            <User size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 card p-2 z-50 animate-[fadeIn_.15s_ease-out]">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 border-b border-ink-800">
                    <div className="font-medium truncate">
                      {user?.name || "Account"}
                    </div>
                    <div className="text-xs text-ink-400 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <Link
                    onClick={closeMenus}
                    to="/account"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-ink-800/70 text-sm"
                  >
                    <User size={16} /> My Account
                  </Link>
                  <Link
                    onClick={closeMenus}
                    to="/account/orders"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-ink-800/70 text-sm"
                  >
                    <Package size={16} /> My Orders
                  </Link>
                  <div className="h-px bg-ink-800 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md hover:bg-rose-500/10 text-rose-300 text-sm"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    onClick={closeMenus}
                    to="/login"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-ink-800/70 text-sm font-medium"
                  >
                    Log in
                  </Link>
                  <Link
                    onClick={closeMenus}
                    to="/register"
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-brand-500/10 text-brand-200 hover:bg-brand-500/20 text-sm font-medium"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <button
          className="navbar-control md:hidden h-10 w-10 grid place-items-center rounded-lg"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="site-navbar-submenu md:hidden border-t">
          <nav className="page-container py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={closeMenus}
                className={({ isActive }) =>
                  cn(
                    "navbar-nav-link px-3 py-2 rounded-md text-sm",
                    isActive
                      ? "navbar-active"
                      : "",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="navbar-divider h-px my-2" />
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  onClick={closeMenus}
                  className="navbar-nav-link px-3 py-2 rounded-md text-sm"
                >
                  My Account
                </Link>
                <Link
                  to="/account/orders"
                  onClick={closeMenus}
                  className="navbar-nav-link px-3 py-2 rounded-md text-sm"
                >
                  My Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left px-3 py-2 rounded-md text-sm text-rose-700"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="navbar-nav-link px-3 py-2 rounded-md text-sm"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenus}
                  className="navbar-action px-3 py-2 rounded-md text-sm"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
