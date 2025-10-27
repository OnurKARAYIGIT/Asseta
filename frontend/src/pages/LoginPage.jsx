import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { FaUser, FaLock } from "react-icons/fa";
import logoAsseta from "/src/assets/logo.svg";
import "./LoginPage.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { userInfo, login, loading, error } = useAuth();
  const navigate = useNavigate();

  // Eğer kullanıcı zaten giriş yapmışsa, onu doğrudan dashboard'a yönlendir.
  // Bu, /login sayfasına tekrar erişmeye çalıştığında /no-access'e gitmesini engeller.
  useEffect(() => {
    if (userInfo) {
      // toast.info("Zaten giriş yaptınız. Ana panele yönlendiriliyorsunuz.");
      navigate("/dashboard");
    }
  }, [userInfo, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
    // Sadece login fonksiyonunu çağır. Yönlendirme useEffect ile yapılacak.
    login(username, password);
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

        <form onSubmit={submitHandler} className="login-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input
                type="text"
                id="username"
                placeholder="Kullanıcı adınızı girin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="password"
                placeholder="Şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Loader size="sm" /> : "Giriş Yap"}
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
