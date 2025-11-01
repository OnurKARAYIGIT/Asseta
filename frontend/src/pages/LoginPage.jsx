import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { FaUser, FaLock, FaIdCard } from "react-icons/fa"; // FaIdCard ikonunu ekledik
import logoAsseta from "../assets/logo.svg";
import "./LoginPage.css";
import axiosInstance from "../api/axiosInstance";
import { history } from "../history";
import { FaEnvelope } from "react-icons/fa"; // E-posta ikonu

const LoginPage = () => {
  const { userInfo, login, loading: authLoading } = useAuth(); // Artık context'ten gelen login ve loading'i kullanacağız
  const location = useLocation();

  // React Hook Form kurulumu
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Eğer kullanıcı zaten giriş yapmışsa, onu doğrudan dashboard'a yönlendir.
  // Bu, /login sayfasına tekrar erişmeye çalıştığında /no-access'e gitmesini engeller.
  useEffect(() => {
    // Sadece kullanıcı /login sayfasındaysa ve giriş yapmışsa yönlendirme yap.
    if (userInfo && location.pathname === "/login") {
      history.push("/dashboard");
    }
  }, [userInfo, location.pathname]);

  // Form gönderimini ele alan fonksiyon
  const onSubmit = async (data) => {
    await login(data.username, data.password); // AuthContext'teki login fonksiyonunu çağır
  };

  return (
    // Sadece bu sayfayı etkilemesi için 'dark' sınıfını buraya ekliyoruz.
    <div className="login-page dark">
      <div className="login-container">
        <div className="login-header">
          {/* 2. Metin yerine logonuzu kullanın */}
          <img src={logoAsseta} alt="Asseta Logo" className="login-logo" />
          <p className="login-tagline">
            Kurumsal Varlık ve Zimmet Yönetim Platformu
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Sicil Numarası</label>
            <div className="input-wrapper">
              <FaIdCard className="input-icon" />
              <input
                type="text"
                id="username"
                {...register("username", {
                  required: "Sicil numarası zorunludur.",
                })}
                placeholder="Sicil numaranızı girin"
              />
            </div>
            {errors.username && (
              <p className="error-message">{errors.username.message}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="password"
                {...register("password", { required: "Şifre zorunludur." })}
                placeholder="Şifrenizi girin"
              />
            </div>
            {errors.password && (
              <p className="error-message">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={authLoading}
          >
            {authLoading ? <Loader size="sm" /> : "Giriş Yap"}
          </button>
        </form>
      </div>
      <footer className="login-footer">
        <p>&copy; {new Date().getFullYear()} Asseta. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
};

export default LoginPage;
