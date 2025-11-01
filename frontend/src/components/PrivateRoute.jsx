import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PrivateRoute = ({ children, requiredPermission }) => {
  const { userInfo, hasPermission } = useAuth(); // hasPermission fonksiyonunu context'ten al
  const location = useLocation();

  if (!userInfo) {
    // Kullanıcı giriş yapmamışsa, onu login sayfasına yönlendir.
    // Nereden geldiğini de state olarak gönder ki, giriş yaptıktan sonra geri dönebilsin.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission) {
    // Yetki kontrolünü merkezi hasPermission fonksiyonuna devret
    if (!hasPermission(requiredPermission)) {
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
