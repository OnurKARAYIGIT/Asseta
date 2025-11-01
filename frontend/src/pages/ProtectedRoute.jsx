import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Loader from "./Loader";

const ProtectedRoute = () => {
  const { userInfo, loading } = useAuth();

  // 1. AuthContext veriyi localStorage'dan okurken bekle.
  // Bu sırada bir yükleme göstergesi göstererek ani yönlendirmeleri engelle.
  if (loading) {
    // Tam sayfa bir loader göstermek daha iyi bir kullanıcı deneyimi sunar.
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // 2. Yükleme bittikten sonra kullanıcı bilgisinin olup olmadığını kontrol et.
  // Kullanıcı varsa, istenen sayfayı (Outlet) göster. Yoksa, login sayfasına yönlendir.
  return userInfo ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
