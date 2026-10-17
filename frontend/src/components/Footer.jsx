import { Link } from "react-router-dom";
import { Instagram, Youtube } from "lucide-react";
import BrandLogo from "./BrandLogo.jsx";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-800/80 bg-ink-950">
      <div className="page-container py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <BrandLogo className="h-10 w-10 rounded-lg" />
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
            A premium, experimental 3D-first e-commerce platform, built for the
            products you'll want to live inside.
          </p>
          <div className="flex items-center gap-2 mt-4">
            {[
              {
                Icon: Instagram,
                label: "Instagram",
                href: "https://www.instagram.com/tryvoxel.3d/",
              },
              {
                Icon: Youtube,
                label: "YouTube",
                href: "https://youtube.com/@tryvoxel.3d?si=UD2vwEBrd5gW4lOp",
              },
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit TRYVOXEL on ${label}`}
                className="h-9 w-9 grid place-items-center rounded-lg border border-ink-800 text-ink-300 hover:text-ink-50 hover:bg-ink-800"
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
          <div>© {new Date().getFullYear()} TRYVOXEL³ᴰ</div>
          <div className="flex items-center gap-4">
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
