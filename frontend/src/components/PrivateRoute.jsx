import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PrivateRoute = () => {
  const { userInfo, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Wait until auth state is determined

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (userInfo.role === "admin" || userInfo.role === "developer") {
    return <Outlet />;
  }

  const pageKey = location.pathname.split("/")[1];

  if (!pageKey || pageKey === "profile") {
    return <Outlet />;
  }

  const hasPermission = userInfo.permissions?.includes(pageKey);

  if (hasPermission) return <Outlet />;

  // Yetkisi yoksa, uyarı göster ve ana sayfaya yönlendir.
  return <Navigate to="/no-access" replace />;
};

export default PrivateRoute;
