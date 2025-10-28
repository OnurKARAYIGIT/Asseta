import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PrivateRoute = ({ children, requiredPermission }) => {
  const { userInfo } = useAuth();
  const location = useLocation();

  if (!userInfo) {
    // Kullanıcı giriş yapmamışsa, onu login sayfasına yönlendir.
    // Nereden geldiğini de state olarak gönder ki, giriş yaptıktan sonra geri dönebilsin.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission) {
    // Developer rolü her zaman tüm yetkilere sahiptir.
    // Diğer roller (admin dahil) sadece kendilerine atanan yetkilere erişebilir.
    const hasPermission =
      userInfo.role === "developer" ||
      (userInfo.permissions &&
        userInfo.permissions.includes(requiredPermission));

    if (!hasPermission) {
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
