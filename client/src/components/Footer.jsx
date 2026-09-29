import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-800/80 bg-ink-950">
      <div className="page-container py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center">
              <span className="font-display font-bold text-ink-950 text-lg">
                T³
              </span>
            </div>
            <div>
              <div className="font-display text-lg font-semibold gradient-text">
                TRYVOXEL³ᴰ
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-ink-400">
                Experiment • Create • Experience
              </div>
            </div>
          </div>
          <p className="text-ink-300 max-w-md text-sm leading-relaxed">
            A premium, experimental 3D-first e-commerce platform. Curated by
            three creators — Jasvinder, Shruti, Vishal — for the products you'll
            want to live inside.
          </p>
          <div className="flex items-center gap-2 mt-4">
            {[Instagram, Twitter, Youtube, Github].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="h-9 w-9 grid place-items-center rounded-lg border border-ink-800 text-ink-300 hover:text-white hover:bg-ink-800"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-ink-100 mb-3 uppercase tracking-wider">
            Shop
          </div>
          <ul className="space-y-2 text-sm text-ink-300">
            <li>
              <Link to="/shop" className="hover:text-brand-300">
                All Products
              </Link>
            </li>
            <li>
              <Link to="/collections" className="hover:text-brand-300">
                Collections
              </Link>
            </li>
            <li>
              <Link to="/new" className="hover:text-brand-300">
                New Arrivals
              </Link>
            </li>
            <li>
              <Link to="/shop?featured=1" className="hover:text-brand-300">
                Featured
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-ink-100 mb-3 uppercase tracking-wider">
            Company
          </div>
          <ul className="space-y-2 text-sm text-ink-300">
            <li>
              <Link to="/about" className="hover:text-brand-300">
                About
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-brand-300">
                My Account
              </Link>
            </li>
            <li>
              <a
                href="mailto:hello@tryvoxel.com"
                className="hover:text-brand-300"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800/80">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-400">
          <div>
            © {new Date().getFullYear()} TRYVOXEL³ᴰ — Built by Jasvinder ×
            Shruti × Vishal
          </div>
          <div className="flex items-center gap-4">
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
