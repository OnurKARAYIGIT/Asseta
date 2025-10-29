import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { FaUser, FaLock } from "react-icons/fa";
import logoAsseta from "../assets/logo.svg";
import "./LoginPage.css";
import axiosInstance from "../api/axiosInstance";
import { history } from "../history";

const LoginPage = () => {
  const { userInfo, loginSuccess } = useAuth();
  const location = useLocation();

  // React Hook Form kurulumu
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // React Query ile login mutation'ı
  const { mutate: login, isLoading } = useMutation({
    mutationFn: ({ username, password }) =>
      axiosInstance.post(
        "/users/login",
        { username, password },
        { withCredentials: true } // <-- Cookie’lerin tarayıcıya kaydedilmesini sağlar
      ),
    onSuccess: (response) => {
      // Eğer backend, kullanıcı bilgilerini response.body içinde döndürüyorsa
      // AuthContext'i güncelle ve yönlendir
      response.data.token = document.cookie.split(";")[0].split("=")[1];
      loginSuccess(response.data);
      toast.success("Giriş başarılı!");
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || "Giriş sırasında bir hata oluştu.";
      toast.error(message);
    },
  });

  // Eğer kullanıcı zaten giriş yapmışsa, onu doğrudan dashboard'a yönlendir.
  // Bu, /login sayfasına tekrar erişmeye çalıştığında /no-access'e gitmesini engeller.
  useEffect(() => {
    // Sadece kullanıcı /login sayfasındaysa ve giriş yapmışsa yönlendirme yap.
    if (userInfo && location.pathname === "/login") {
      history.push("/dashboard");
    }
  }, [userInfo, location.pathname]);

  // Form gönderimini ele alan fonksiyon
  const onSubmit = (data) => {
    login(data);
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
            <label htmlFor="username">Kullanıcı Adı</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input
                type="text"
                id="username"
                {...register("username", {
                  required: "Kullanıcı adı zorunludur.",
                })}
                placeholder="Kullanıcı adınızı girin"
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
            disabled={isLoading}
          >
            {isLoading ? <Loader size="sm" /> : "Giriş Yap"}
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
