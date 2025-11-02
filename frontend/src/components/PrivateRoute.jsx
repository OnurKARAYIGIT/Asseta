import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PrivateRoute = ({ children, requiredPermission }) => {
  const { userInfo, loading } = useAuth();
  const location = useLocation();

  // Eğer kullanıcı 'developer' ise, her zaman yetkisi vardır.
  if (userInfo && userInfo.role === "developer") {
    return children;
  }

  // Eğer auth durumu henüz yüklenmediyse, yönlendirme yapma — bekle
  if (loading) return null; // veya bir Loader bileşeni gösterilebilir

  // Kullanıcı bilgisi yoksa ve localStorage'da da token yoksa, login sayfasına yönlendir
  if (!userInfo) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission) {
    // Yetki kontrolü
    if (!userInfo.permissions?.includes(requiredPermission)) {
      return (
        <div className="page-container">
          <h1>Bu sayfaya erişim yetkiniz bulunmamaktadır.</h1>
          <p>
            Gerekli yetkiye sahip değilsiniz. Lütfen sistem yöneticinizle
            iletişime geçin.
          </p>
        </div>
      );
    }
  }

  return children;
};

export default PrivateRoute;
