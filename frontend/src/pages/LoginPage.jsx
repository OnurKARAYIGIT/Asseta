import React from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { FaUser, FaLock, FaIdCard } from "react-icons/fa"; // FaIdCard ikonunu ekledik
import logoAsseta from "../assets/logo.svg";
import "./LoginPage.css";

const LoginPage = () => {
  const { userInfo, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // React Hook Form kurulumu
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Eğer kullanıcı zaten giriş yapmışsa, onu doğrudan dashboard'a yönlendir.
  if (userInfo) {
    return <Navigate to="/dashboard" replace />;
  }

  // Form gönderimini ele alan fonksiyon
  const onSubmit = async (data) => {
    const loginSuccessful = await login(data.username, data.password);

    if (loginSuccessful) {
      // Kullanıcının nereden geldiğini kontrol et. Eğer özel bir yönlendirme yoksa /dashboard'a git.
      // PrivateRoute'tan gelen 'from' bilgisini kullan, yoksa /dashboard'a yönlendir.
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
      toast.success("Başarıyla giriş yapıldı!");
    }
  };

  return (
    // Manuel 'dark' sınıfını kaldırıyoruz. Tema yönetimi global olarak yapılacak.
    <div className="login-page">
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
            className="btn btn-primary w-full flex justify-center items-center"
            disabled={authLoading}
          >
            {authLoading ? (
              <>
                <Loader size="sm" />{" "}
                <span className="ml-2">Giriş Yapılıyor...</span>
              </>
            ) : (
              "Giriş Yap"
            )}
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
