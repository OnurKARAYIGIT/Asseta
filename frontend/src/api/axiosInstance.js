import axios from "axios";
import { toast } from "react-toastify";

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

// Bu fonksiyon, AuthContext'ten gelen refreshToken ve logout fonksiyonlarını alarak
// interceptor'ı kurar. Bu, döngüsel bağımlılığı (circular dependency) engeller.
export const setupInterceptors = (refreshToken, logout) => {
  // Önceki interceptor'ları temizle (eğer varsa)
  axiosInstance.interceptors.response.eject(0);

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // 401 Yetkisiz Hatası ve Token Yenileme Mantığı
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Sonsuz döngüyü engelle
        try {
          const newAccessToken = await refreshToken();
          if (newAccessToken) {
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest); // Başarısız olan isteği tekrarla
          } else {
            // Refresh token başarısız olduysa, kullanıcıyı sistemden at.
            logout({ isSilent: true });
          }
        } catch (refreshError) {
          logout({ isSilent: true });
        }
      }

      // Diğer Hata Durumları
      if (error.response) {
        // Sunucu bir hata koduyla yanıt verdi (4xx, 5xx)
        const status = error.response.status;
        if (status >= 500) {
          // 5xx Sunucu Hataları
          toast.error(
            "Sunucuda bir sorun oluştu. Lütfen daha sonra tekrar deneyin.",
            { toastId: "server-error" } // Aynı hatanın tekrar tekrar gösterilmesini engelle
          );
        } else if (status === 404) {
          // 404 Bulunamadı (İsteğe bağlı, çok sık gösterilebilir)
          // toast.warn("Aradığınız kaynak bulunamadı.", { toastId: "not-found-error" });
        }
      } else if (error.request) {
        // İstek yapıldı ama yanıt alınamadı (Ağ hatası)
        toast.error(
          "Ağ bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.",
          { toastId: "network-error" }
        );
      }

      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
