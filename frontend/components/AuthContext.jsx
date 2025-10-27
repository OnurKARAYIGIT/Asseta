import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { history } from "../history";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Uygulama ilk yüklendiğinde localStorage'ı kontrol et
  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post("/users/login", {
        username,
        password,
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUserInfo(data);
      // Yönlendirme LoginPage içindeki useEffect tarafından yapılacak.
    } catch (err) {
      const message =
        err.response?.data?.message || "Giriş sırasında bir hata oluştu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("userInfo");
    setUserInfo(null);
    // Kullanıcıyı login sayfasına yönlendir.
    // history.push() kullanarak yönlendirme yapıyoruz çünkü bu fonksiyon bir hook değil
    // ve her yerden çağrılabilir.
    history.push("/login");
  };

  const value = {
    userInfo,
    loading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Diğer bileşenlerin context'e kolayca erişmesi için bir custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};
