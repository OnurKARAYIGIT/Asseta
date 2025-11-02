import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import UserMenu from "./UserMenu"; // UserMenu bileşenini import ediyoruz
import { useTheme } from "./ThemeContext";
import { usePendingCount } from "../contexts/PendingCountContext";
import NotificationDropdown from "./NotificationDropdown";
import axiosInstance from "../api/axiosInstance";
import {
  FaClipboardList,
  FaFileAlt,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaHistory,
  FaClock,
  FaUsersCog,
  FaChevronDown,
  FaFolderOpen,
  FaAddressCard, // Yeni ikon
  FaSignInAlt,
  FaMoneyBillWave,
  FaSearch,
  FaBusinessTime, // Yeni ikon
  FaCalendarCheck,
  FaRegCalendarAlt,
  FaUserClock, // Yeni ikon
  FaChartBar,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import logoAsseta from "../assets/logo.svg";

const Navbar = ({ inactivityTime, isTimeoutWarning }) => {
  const { userInfo, hasPermission } = useAuth(); // hasPermission fonksiyonunu AuthContext'ten al
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const searchInputRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null); // Hangi menünün açık olduğunu tutacak state
  const [isScrolled, setIsScrolled] = useState(false);
  const searchContainerRef = useRef(null);
  const { pendingCount } = usePendingCount();

  // Saati her saniye güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sayfa kaydırıldığında Navbar'ın arkaplanını değiştirmek için
  useEffect(() => {
    const handleScroll = () => {
      // 10px'den fazla kaydırıldıysa state'i güncelle
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    // Component kaldırıldığında event listener'ı temizle
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    {
      to: "/assignments",
      label: "Zimmetler",
      className: "nav-assignments",
      icon: <FaClipboardList />,
      iconColorClass: "text-yellow-400",
      permission: "zimmetler",
      children: [
        {
          to: "/assignments",
          label: "Tüm Zimmetler",
          className: "nav-assignments",
          icon: <FaClipboardList />,
          iconColorClass: "text-yellow-400",
          permission: "zimmetler",
        },
        {
          to: "/pending-assignments",
          label: "Bekleyenler",
          className: "nav-pending",
          icon: <FaClock />,
          iconColorClass: "text-orange-500",
          permission: "zimmetler",
        },
        {
          to: "/items",
          label: "Eşyalar",
          className: "nav-items",
          icon: <FaBoxOpen />,
          iconColorClass: "text-green-500",
          permission: "items",
        },
        {
          to: "/locations",
          label: "Konumlar",
          className: "nav-locations",
          icon: <FaMapMarkerAlt />,
          iconColorClass: "text-purple-500",
          permission: "locations",
        },
      ],
    },
    {
      to: "/personnel-report",
      label: "Personel Raporu",
      className: "nav-report",
      icon: <FaFileAlt />,
      iconColorClass: "text-teal-400",
      permission: "personnel-report",
    },
    {
      to: "/item-report",
      label: "Eşya Raporu",
      className: "nav-item-report",
      // Bu className için ikon rengi aşağıda tanımlanacak
      icon: <FaChartBar />,
      iconColorClass: "text-blue-400",
      permission: "item-report",
    },
    {
      className: "nav-audit",
      // --- YENİ İK İŞLEMLERİ MENÜSÜ ---
      label: "İK İşlemleri",
      className: "nav-hr",
      icon: <FaUserClock />,
      iconColorClass: "text-cyan-400",
      permission: "ik-islemleri", // Bu genel bir yetki, alt menüler kendi yetkilerini kontrol edecek
      children: [
        {
          to: "/my-attendance",
          label: "Mesaiye Başla/Bitir",
          className: "nav-hr",
          icon: <FaClock />,
          iconColorClass: "text-cyan-400",
          permission: "my-attendance", // Tüm çalışanlar
        },
        {
          to: "/my-leaves",
          label: "İzin Talebi",
          className: "nav-hr",
          icon: <FaCalendarCheck />,
          iconColorClass: "text-lime-400",
          permission: "my-leaves", // Tüm çalışanlar
        },
        {
          to: "/attendance-records",
          label: "Mesai Kayıtları",
          className: "nav-hr",
          icon: <FaBusinessTime />,
          iconColorClass: "text-cyan-400",
          permission: "admin", // Sadece adminler
        },
        {
          to: "/leave-management",
          label: "İzin Yönetimi",
          className: "nav-hr",
          icon: <FaCalendarCheck />,
          iconColorClass: "text-emerald-400",
          permission: "admin",
        },
        {
          to: "/payroll-management",
          label: "Maaş Yönetimi",
          className: "nav-hr",
          icon: <FaMoneyBillWave />,
          iconColorClass: "text-yellow-400",
          permission: "admin",
        },
        {
          to: "/payroll-periods",
          label: "Bordro İşlemleri",
          className: "nav-hr",
          icon: <FaFolderOpen />, // Yeni ikon
          iconColorClass: "text-orange-400",
          permission: "admin",
        },
      ],
    },
    {
      to: "/admin",
      label: "Yönetim Paneli",
      className: "nav-admin",
      icon: <FaUsersCog />,
      iconColorClass: "text-pink-300",
      permission: "admin",
      children: [
        {
          to: "/admin",
          label: "Kullanıcı Yönetimi",
          className: "nav-admin",
          icon: <FaUsersCog />,
          iconColorClass: "text-pink-300",
          permission: "admin",
        },
        {
          to: "/personnel",
          label: "Personel Yönetimi",
          className: "nav-admin",
          icon: <FaAddressCard />,
          iconColorClass: "text-pink-300",
          permission: "admin",
        },
        {
          to: "/audit-logs",
          label: "Denetim Kayıtları",
          className: "nav-audit",
          icon: <FaHistory />,
          iconColorClass: "text-pink-500",
          permission: "audit-logs",
        },
      ],
    },
  ];

  // Dışarıya tıklandığında arama çubuğunu kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsSearchVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Arama kutusu görünür olduğunda input'a odaklan
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  const performSearch = () => {
    if (globalSearchTerm.trim()) {
      navigate(`/search?q=${globalSearchTerm}`);
      setIsSearchVisible(false); // Aramadan sonra çubuğu kapat
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch();
  };

  // Menüye tıklandığında aç/kapat
  const handleMenuClick = (itemLabel) => {
    setOpenMenu(openMenu === itemLabel ? null : itemLabel);
  };

  // Dışarıya tıklandığında menüyü kapat
  useEffect(() => {
    document.addEventListener("click", () => setOpenMenu(null));
  }, []);

  // Menü elemanlarını render etmek için iç içe (recursive) fonksiyon
  const renderNavItems = (items) => {
    return items
      .filter((item) => hasPermission(item.permission))
      .map((item, index) => {
        const commonClasses =
          "flex items-center gap-2 px-4 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors";

        // Kaydırma durumuna göre metin gölgesi ekle
        const textShadowClass = isScrolled
          ? "text-shadow-md" // Bu özel sınıfı index.css'e ekleyeceğiz
          : "";

        return (
          <li
            key={item.label}
            className="relative"
            onClick={(e) => {
              // Eğer alt menü varsa, linke gitmesini engelle ve menüyü aç/kapat
              if (item.children) {
                e.stopPropagation(); // Dışarıya tıklama event'ini tetikleme
                handleMenuClick(item.label);
              } else {
                // Alt menü yoksa, menüyü kapat (mobil için)
                setOpenMenu(null);
              }
            }}
          >
            <NavLink
              className={({ isActive }) =>
                `${commonClasses} ${textShadowClass} ${
                  isActive ? "!text-white shadow-sm shadow-gray-600" : ""
                }`
              }
              to={item.children ? "#" : item.to} // Alt menü varsa link verme, yoksa ver
            >
              <span className={item.iconColorClass || "text-current"}>
                {item.icon}
              </span>
              <span className="text-white">{item.label}</span>
              {item.children && (
                <FaChevronDown
                  className={`ml-1 text-xs transition-transform ${
                    openMenu === item.label ? "rotate-180" : ""
                  } ${textShadowClass}`}
                />
              )}
              {item.to === "/pending-assignments" && pendingCount > 0 && (
                <span className="ml-auto text-xs font-bold bg-danger text-white rounded-full px-2 py-0.5 animate-pulse">
                  {pendingCount}
                </span>
              )}
            </NavLink>
            {item.children && openMenu === item.label && (
              <ul className="absolute top-full left-0 mt-2 min-w-[220px] rounded-b-lg border border-white/10 bg-slate-500/50 p-2 shadow-xl backdrop-blur-xl z-150">
                {renderNavItems(item.children)}
              </ul>
            )}
          </li>
        );
      });
  };

  return (
    <nav
      className={`sticky top-0 z-[1000] flex items-center justify-between px-6 py-2 transition-all duration-300 ${
        isScrolled
          ? " rounded-b-lg backdrop-blur-3xl shadow-lg border-white bg-slate-400 bg-opacity-35"
          : "bg-transparent border-transparent shadow-none"
      }`}
    >
      <div className="flex items-center gap-6">
        <Link to="/dashboard">
          <img
            src={logoAsseta}
            alt="Asseta Logo"
            className="h-[70px] w-[105px]"
          />
        </Link>
        <ul className="hidden md:flex items-center gap-1">
          {renderNavItems(navItems)}
        </ul>
      </div>

      <div
        className={`flex items-center gap-6 ${
          isScrolled
            ? " rounded-lg backdrop-blur-3xl shadow-lg  border-white bg-slate-400 bg-opacity-35"
            : "bg-transparent  border-transparent shadow-none"
        }`}
      >
        {userInfo && (
          // NotificationDropdown bileşeninin içindeki stillerin Tailwind'e çevrilmesi gerekebilir.
          <NotificationDropdown className="flex-shrink-0" />
        )}
        <div className="hidden lg:flex items-center gap-3   rounded-lg px-4 py-2 text-white select-none">
          <div className="flex flex-col items-start text-sm leading-tight">
            <div
              className={`flex items-center gap-2 transition-all ${
                isScrolled ? "text-shadow-md" : ""
              }`}
            >
              <FaClock className="opacity-80" />
              <span className="font-semibold">
                {currentDateTime.toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 text-xs opacity-90 transition-all ${
                isScrolled ? "text-shadow-md" : ""
              }`}
            >
              <FaRegCalendarAlt />
              <span>
                {`${currentDateTime.toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })} - ${currentDateTime.toLocaleDateString("tr-TR", {
                  weekday: "long",
                })}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1" ref={searchContainerRef}>
          <div
            className={`transition-all duration-300 ease-in-out ${
              isSearchVisible ? "w-56 opacity-100" : "w-0 opacity-0"
            }`}
          >
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                className="w-full px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-white placeholder:text-white/70 focus:bg-white focus:text-text-main focus:placeholder:text-text-light outline-none"
                placeholder="Sayfada Ara..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                ref={searchInputRef}
              />
            </form>
          </div>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:bg-white/10 ${
              isScrolled ? "text-shadow-md" : ""
            }`}
            onClick={() => setIsSearchVisible((prev) => !prev)}
            aria-label="Aramayı aç/kapat"
          >
            <FaSearch />
          </button>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-all hover:bg-white/10 ${
              isScrolled ? "text-shadow-md" : ""
            }`}
            onClick={toggleTheme}
            aria-label="Temayı değiştir"
          >
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
        </div>
        {userInfo ? (
          // UserMenu bileşeninin içindeki stillerin Tailwind'e çevrilmesi gerekebilir.
          // Özellikle metin renkleri ve açılır menü konumlandırması kontrol edilmeli.
          <UserMenu
            className="flex-shrink-0"
            inactivityTime={inactivityTime}
            isTimeoutWarning={isTimeoutWarning}
          />
        ) : (
          <ul className="flex items-center gap-2">
            <li>
              <NavLink
                to="/login"
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-all ${
                  isScrolled ? "text-shadow-md" : ""
                }`}
              >
                <FaSignInAlt /> Giriş Yap
              </NavLink>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
