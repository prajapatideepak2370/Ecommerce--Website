import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectAuthLoading,
  selectIsAdmin,
  selectIsAuthenticated,
} from "../store/authSlice.js";
import Skeleton from "react-loading-skeleton";

export default function AdminRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const loading = useSelector(selectAuthLoading);
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-container py-16 space-y-6">
        <Skeleton height={36} width={300} />
        <Skeleton height={20} count={6} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!isAdmin) {
    return <Navigate to="/404" replace />;
  }
  return children;
}
