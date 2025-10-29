import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/api", // Tüm istekler /api'ye gidecek
  withCredentials: true, // Cookie'lerin her istekte gönderilmesini sağla
});

// Axios interceptor'u ile her isteğe otomatik olarak token ekleyelim
axiosInstance.interceptors.request.use(
  (config) => {
    // Her istekte localStorage'ı yeniden oku.
    const storedUser =
      localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    const userInfo = storedUser ? JSON.parse(storedUser) : null;

    // Sadece accessToken varsa ve header'da zaten bir token yoksa ekle
    if (userInfo && userInfo.accessToken && !config.headers["Authorization"]) {
      config.headers["Authorization"] = `Bearer ${userInfo.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
