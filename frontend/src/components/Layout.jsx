import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import ScrollToTopButton from "./ScrollToTopButton"; // Yeni bileşeni import et
import useInactivityTimeout from "../hooks/useInactivityTimeout";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const Layout = () => {
  const { logout, userInfo } = useAuth();
  const navigate = useNavigate();

  // Zaman aşımı gerçekleştiğinde çalışacak fonksiyon
  const handleTimeout = () => {
    // Sadece giriş yapmış bir kullanıcı varsa çıkış yap
    if (userInfo) {
      toast.warn("Hareketsizlik nedeniyle oturumunuz sonlandırıldı.");
      logout();
      navigate("/login"); // Güvenlik için tekrar yönlendir
    }
  };
  const { remainingTime, isWarning } = useInactivityTimeout(
    handleTimeout,
    10 * 60 * 1000
  );

  return (
    <div className="app-container">
      <Navbar inactivityTime={remainingTime} isTimeoutWarning={isWarning} />
      <main className="main-content">
        <Outlet />
      </main>
      <ScrollToTopButton /> {/* Butonu buraya ekle */}
    </div>
  );
};

export default Layout;
