import React, { createContext, useState, useContext, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserInfo(userData);
      // Axios instance'ın varsayılan başlıklarını ayarla
      if (userData.token) {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${userData.token}`;
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post("/users/login", {
        username,
        password,
      });

      setUserInfo(data);

      // Giriş yapıldığında Axios başlıklarını ayarla
      if (data.token) {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.token}`;
      }

      // Şimdilik sadece local storage kullanalım
      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      return true; // Başarılı girişi belirtmek için
    } catch (err) {
      const errorMessage =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
      return false; // Başarısız girişi belirtmek için
    }
  };
  const logout = () => {
    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("userInfo");
    // Çıkış yapıldığında Axios başlıklarını temizle
    delete axiosInstance.defaults.headers.common["Authorization"];
    setUserInfo(null);
  };

  const value = { userInfo, loading, error, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
