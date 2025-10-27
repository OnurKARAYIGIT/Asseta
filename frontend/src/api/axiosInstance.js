import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/api", // Tüm istekler /api'ye gidecek
});

// Axios interceptor'u ile her isteğe otomatik olarak token ekleyelim
axiosInstance.interceptors.request.use(
  (config) => {
    // Her istekte localStorage'ı yeniden oku.
    // Bu, kullanıcı giriş yaptıktan sonraki isteklerin
    // doğru token ile gönderilmesini sağlar.
    const storedUser =
      localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    const userInfo = storedUser ? JSON.parse(storedUser) : null;
    if (userInfo && userInfo.token) {
      config.headers["Authorization"] = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
