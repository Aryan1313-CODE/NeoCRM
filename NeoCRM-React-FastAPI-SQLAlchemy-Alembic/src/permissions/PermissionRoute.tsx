import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { hasPermission } from "./permissions";
export function PermissionRoute({ permission }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader">Loading Chemora...</div>;
  if (!hasPermission(user, permission)) return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  return <Outlet />;
}
