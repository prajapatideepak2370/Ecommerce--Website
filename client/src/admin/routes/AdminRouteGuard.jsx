import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../store/AuthContext.jsx";
import TableSkeleton from "../components/TableSkeleton.jsx";

export default function AdminRouteGuard({ children }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <TableSkeleton rows={8} cols={6} />
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (admin.role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return children;
}
