import React, {
  createContext,
  useState,
  useReducer,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axiosInstance, { setupInterceptors } from "../api/axiosInstance";
import { toast } from "react-toastify";
import { parseJwt } from "../utils/jwtHelper"; // JWT çözümleyiciyi import et

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const initialState = {
  userInfo: null,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        userInfo: action.payload,
        error: null,
      };
    case "LOGIN_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "LOGOUT":
      return { ...initialState, loading: false }; // Çıkış yapıldığında başlangıç durumuna dön, loading false olsun.
    case "SET_USER_ON_LOAD":
      return { ...state, loading: false, userInfo: action.payload };
    case "SET_LOADING_FALSE":
      return { ...state, loading: false };
    case "REFRESH_SUCCESS":
      return { ...state, userInfo: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { userInfo, loading, error } = state;
  const sessionTimeoutRef = useRef(null);
  const inactivityTimeoutRef = useRef(null); // İnaktivite için yeni ref

  // Oturum süresi dolmak üzereyken gösterilecek özel Toast bileşeni
  const SessionWarningToast = ({ closeToast }) => {
    const handleExtend = async () => {
      try {
        await refreshToken();
        toast.success("Oturumunuz başarıyla uzatıldı.");
      } catch (error) {
        toast.error("Oturum uzatılamadı. Lütfen tekrar giriş yapın.");
      }
      closeToast();
    };

    return (
      <div>
        <p className="mb-2">Oturumunuz 1 dakika içinde sona erecek.</p>
        <button
          onClick={handleExtend}
          className="bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-primary-dark transition-colors"
        >
          Oturumu Uzat
        </button>
      </div>
    );
  };

  // YENİ: Hareketsizlik uyarısı için özel Toast bileşeni
  const InactivityWarningToast = ({ closeToast }) => {
    const [countdown, setCountdown] = useState(60); // 60 saniye geri sayım

    useEffect(() => {
      if (countdown <= 0) {
        logout({ isSilent: true }); // Süre dolunca sessizce çıkış yap
        closeToast();
        return;
      }

      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }, [countdown, closeToast]);

    const handleStayLoggedIn = () => {
      // Kullanıcı "Oturumda Kal" butonuna tıkladığında, bu bir aktivite sayılır.
      // Ana `resetInactivityTimer` fonksiyonu bu tıklamayı yakalayıp ana sayacı sıfırlayacaktır.
      // Bizim burada sadece bu uyarıyı kapatmamız yeterli.
      closeToast();
    };

    return (
      <div>
        <p className="mb-2">
          Bir süredir işlem yapmadınız. Oturumunuz{" "}
          <strong>{countdown} saniye</strong> içinde sonlandırılacak.
        </p>
        <button
          onClick={handleStayLoggedIn}
          className="bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-primary-dark transition-colors"
        >
          Oturumda Kal
        </button>
      </div>
    );
  };

  // logout fonksiyonu artık bir obje alabilir: { isSilent: boolean, navigate: function }
  const logout = useCallback(({ isSilent = false, navigate } = {}) => {
    // Oturum zamanlayıcısını temizle
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }

    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("userInfo");
    delete axiosInstance.defaults.headers.common["Authorization"];
    dispatch({ type: "LOGOUT" }); // State'i reducer ile temizle
    if (!isSilent && navigate) {
      navigate("/login"); // Sadece navigate fonksiyonu varsa yönlendirme yap.
    }
    if (!isSilent) {
      toast.info("Başarıyla çıkış yaptınız.");
    }

    // İnaktivite sayacını da temizle
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  // Oturum zamanlayıcılarını kuran fonksiyon
  const setupSessionTimers = useCallback(
    (accessToken) => {
      // Önceki zamanlayıcıyı temizle
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }

      const decodedToken = parseJwt(accessToken);
      if (!decodedToken || !decodedToken.exp) return;

      const expiresIn = decodedToken.exp * 1000 - Date.now();
      const warningTime = expiresIn - 60 * 1000; // 1 dakika önce

      if (warningTime > 0) {
        sessionTimeoutRef.current = setTimeout(() => {
          toast.warn(<SessionWarningToast />, {
            autoClose: false, // Otomatik kapanmasın
            closeOnClick: false, // Tıklayınca kapanmasın
            draggable: false,
            toastId: "session-warning", // Tek bir uyarı göster
          });
        }, warningTime);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // refreshToken'ı buraya eklemek döngüye neden olabilir, bu yüzden boş bırakıyoruz.
  );

  // YENİ: İnaktivite sayacını yöneten useEffect
  useEffect(() => {
    // Eğer kullanıcı giriş yapmamışsa, bu özelliği çalıştırma
    if (!userInfo) return;

    // Uyarıyı 9 dakika sonra göster, 1 dakika da uyarı ekranında saysın. Toplam 10 dakika.
    const INACTIVITY_WARNING_TIMEOUT_MS = 9 * 60 * 1000;

    // Zamanlayıcıyı sıfırlayan fonksiyon
    const resetInactivityTimer = () => {
      // Eğer bir uyarı gösteriliyorsa, onu kapat.
      toast.dismiss("inactivity-warning");

      // Önceki zamanlayıcıyı temizle
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      // Yeni bir zamanlayıcı kur
      inactivityTimeoutRef.current = setTimeout(() => {
        // 9 dakika dolduğunda, 1 dakikalık geri sayım içeren uyarıyı göster.
        toast.warn(<InactivityWarningToast />, {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          toastId: "inactivity-warning",
        });
      }, INACTIVITY_WARNING_TIMEOUT_MS);
    };

    // Kullanıcı aktivitesini dinleyecek olaylar
    const events = ["mousemove", "keydown", "click", "scroll"];

    // Olay dinleyicilerini ekle
    events.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer)
    );

    // İlk zamanlayıcıyı başlat
    resetInactivityTimer();

    // Component unmount olduğunda olay dinleyicilerini temizle
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [userInfo, logout]); // Sadece userInfo veya logout değiştiğinde yeniden çalışsın

  // Token yenileme fonksiyonu
  const refreshToken = useCallback(async () => {
    try {
      // GÜVENLİK KONTROLÜ: localStorage'da kullanıcı bilgisi ve refresh token var mı?
      const storedUser = JSON.parse(localStorage.getItem("userInfo"));
      if (!storedUser?.refreshToken) {
        console.error(
          "Yenileme için kullanıcı bilgisi veya refresh token bulunamadı."
        );
        logout({ isSilent: true });
        return null;
      }

      const { data } = await axiosInstance.post("/users/refresh-token", {
        token: storedUser.refreshToken,
      });

      // Yeni accessToken'ı al ve userInfo'yu güncelle
      const newUserInfo = { ...storedUser, accessToken: data.accessToken };
      dispatch({ type: "REFRESH_SUCCESS", payload: newUserInfo });
      localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${data.accessToken}`;

      // Yeni token için zamanlayıcıları kur
      setupSessionTimers(data.accessToken);
      return data.accessToken;
    } catch (refreshError) {
      // logout() fonksiyonu artık navigate kullandığı için burada çağıramayız.
      // Bunun yerine state'i temizleyip, ProtectedRoute'un yönlendirme yapmasını sağlıyoruz.
      console.error("Token yenilenemedi, çıkış yapılıyor:", refreshError);
      logout({ isSilent: true }); // Sadece state'i ve localStorage'ı temizle
      return null;
    }
  }, [logout, setupSessionTimers]);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      dispatch({ type: "SET_USER_ON_LOAD", payload: userData });
      if (userData.accessToken) {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${userData.accessToken}`;
        // Uygulama ilk yüklendiğinde zamanlayıcıları kur
        setupSessionTimers(userData.accessToken);
      }
    }
    dispatch({ type: "SET_LOADING_FALSE" });

    setupInterceptors(refreshToken, logout);
  }, [refreshToken, logout, setupSessionTimers]);

  // Artık sicil numarası (username) ile giriş yapılıyor
  const login = async (username, password) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const { data } = await axiosInstance.post("/users/login", {
        username,
        password,
      });

      // --- loginSuccess mantığı buraya taşındı ---
      // 1. Kullanıcı bilgilerini state'e ata
      dispatch({ type: "LOGIN_SUCCESS", payload: data });

      // 2. Axios için varsayılan Authorization başlığını ayarla
      if (data.accessToken) {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.accessToken}`;
      }

      // 3. Bilgileri tarayıcı hafızasına kaydet
      localStorage.setItem("userInfo", JSON.stringify(data));

      // Giriş yapıldığında zamanlayıcıları kur
      setupSessionTimers(data.accessToken);
      // 4. YÖNLENDİRME KALDIRILDI. Bu işlem artık LoginPage tarafından yapılacak.
      return true; // Başarılı girişi belirtmek için
    } catch (err) {
      const errorMessage =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.";
      dispatch({ type: "LOGIN_FAIL", payload: errorMessage });
      toast.error(errorMessage);
      return false; // Başarısız girişi belirtmek için
    }
  };

  const hasPermission = useCallback(
    (requiredPermission) => {
      if (!userInfo) return false;

      // Admin ve Developer her zaman yetkilidir
      if (userInfo.role === "admin" || userInfo.role === "developer") {
        return true;
      }

      // Eğer yetki "anahtar:eylem" formatındaysa (örn: "zimmetler:onayla"),
      // kullanıcının yetkileri arasında tam eşleşme ara.
      if (requiredPermission.includes(":")) {
        return userInfo.permissions?.includes(requiredPermission);
      }

      // Eğer yetki genel bir anahtarsa (örn: "zimmetler"),
      // menü görünürlüğü için `startsWith` kontrolünü kullan.
      // Bu, "zimmetler" yetkisi olan birinin "zimmetler/onayla" gibi alt yolları
      // görmesini sağlar.
      return userInfo.permissions?.some((p) =>
        requiredPermission.startsWith(p)
      );
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
