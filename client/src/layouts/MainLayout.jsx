import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useBootstrap } from "../hooks/useBootstrap.js";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function MainLayout({ children }) {
  const { authLoading } = useBootstrap();

  if (authLoading && typeof window !== "undefined" && window.location.pathname === "/") {
    // Allow page content to render alongside auth check (non-blocking for public pages)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {authLoading ? (
        <div className="page-container py-10">
          <Skeleton height={18} count={4} className="mb-2" />
        </div>
      ) : null}
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
