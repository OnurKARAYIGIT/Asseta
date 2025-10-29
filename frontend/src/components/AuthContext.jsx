import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import { history } from "../history"; // history objesini import et

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loginSuccess = (userData) => {
    // 1. Kullanıcı bilgilerini state'e ata
    setUserInfo(userData);

    // 2. Axios için varsayılan Authorization başlığını ayarla
    if (userData.accessToken) {
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${userData.accessToken}`;
    }

    // 3. Bilgileri tarayıcı hafızasına kaydet
    localStorage.setItem("userInfo", JSON.stringify(userData));
    // 4. Kullanıcıyı ana panele yönlendir
    history.push("/dashboard");
  };
  // Token yenileme fonksiyonu
  const refreshToken = useCallback(async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("userInfo"));
      // if (!storedUser?.refreshToken) {
      //   throw new Error("Refresh token bulunamadı.");
      // }

      const { data } = await axiosInstance.post("/users/refresh-token", {
        token: storedUser.refreshToken,
      });

      // Yeni accessToken'ı al ve userInfo'yu güncelle
      const newUserInfo = { ...storedUser, accessToken: data.accessToken };
      setUserInfo(newUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${data.accessToken}`;
      return data.accessToken;
    } catch (refreshError) {
      console.error("Token yenilenemedi:", refreshError);
      logout(true); // Yenileme başarısız olursa kullanıcıyı login sayfasına yönlendirerek sistemden at
      return null;
    }
  }, []); // useCallback'in bağımlılık dizisi boş kalmalı, çünkü logout'u içermesi döngüye neden olabilir.

  useEffect(() => {
    const storedUser =
      localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserInfo(userData);
      if (userData.accessToken) {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${userData.accessToken}`;
      }
    }
    setLoading(false);

    // Axios Interceptor Kurulumu
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        // 401 hatası ve daha önce denenmemiş bir istek ise
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; // Sonsuz döngüyü engelle
          const newAccessToken = await refreshToken();
          if (newAccessToken) {
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest); // Başarısız olan isteği tekrarla
          }
        }
        return Promise.reject(error);
      }
    );

    // Component unmount olduğunda interceptor'ı temizle
    return () => axiosInstance.interceptors.response.eject(interceptor);
  }, [refreshToken]);

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
      if (data.accessToken) {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.accessToken}`;
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

  const logout = useCallback((isSilent = false) => {
    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("userInfo");
    delete axiosInstance.defaults.headers.common["Authorization"];
    setUserInfo(null);
    if (!isSilent) {
      history.push("/login"); // Kullanıcıyı login sayfasına yönlendir.
    }
  }, []);

  const hasPermission = useCallback(
    (requiredPermission) => {
      if (!userInfo) return false;
      // Admin ve Developer her zaman yetkilidir
      if (userInfo.role === "admin" || userInfo.role === "developer") {
        return true;
      }
      // 'user' rolü için özel yetkileri kontrol et
      return userInfo.permissions?.includes(requiredPermission);
    },
    [userInfo]
  );
  const value = {
    userInfo,
    loading,
    error,
    login,
    logout,
    refreshToken,
    hasPermission,
    loginSuccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
