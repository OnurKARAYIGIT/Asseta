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
  FaSignInAlt,
  FaSearch,
  FaRegCalendarAlt,
  FaChartBar,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import logoAsseta from "/src/assets/logo.svg";
import "./Navbar.css";

const Navbar = ({ inactivityTime, isTimeoutWarning }) => {
  const { userInfo } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { pendingCount } = usePendingCount();

  // Bir linkin gösterilip gösterilmeyeceğini kontrol eden yardımcı fonksiyon
  const hasPermission = (requiredPermission) => {
    if (!userInfo) return false;
    // Admin ve Developer her zaman yetkilidir
    if (userInfo.role === "admin" || userInfo.role === "developer") {
      return true;
    }
    // 'user' rolü için özel yetkileri kontrol et
    return userInfo.permissions?.includes(requiredPermission);
  };

  // Saati her saniye güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const navItems = [
    {
      to: "/assignments",
      label: "Zimmetler",
      className: "nav-assignments",
      icon: <FaClipboardList />,
      permission: "zimmetler",
      children: [
        {
          to: "/pending-assignments",
          label: "Bekleyenler",
          className: "nav-pending",
          icon: <FaClock />,
          permission: "zimmetler",
        },
        {
          to: "/items",
          label: "Eşyalar",
          className: "nav-items",
          icon: <FaBoxOpen />,
          permission: "items",
        },
        {
          to: "/locations",
          label: "Konumlar",
          className: "nav-locations",
          icon: <FaMapMarkerAlt />,
          permission: "locations",
        },
      ],
    },
    {
      to: "/personnel-report",
      label: "Personel Raporu",
      className: "nav-report",
      icon: <FaFileAlt />,
      permission: "personnel-report",
    },
    {
      to: "/item-report",
      label: "Eşya Raporu",
      className: "nav-item-report",
      icon: <FaChartBar />,
      permission: "item-report",
    },
    {
      to: "/admin",
      label: "Admin Paneli",
      className: "nav-admin",
      icon: <FaUsersCog />,
      permission: "admin",
      children: [
        {
          to: "/audit-logs",
          label: "Denetim Kayıtları",
          className: "nav-audit",
          icon: <FaHistory />,
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

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to={userInfo ? "/dashboard" : "/"} className="nav-logo-link">
          <img src={logoAsseta} alt="Asseta Logo" className="nav-logo" />
        </Link>
        <ul className="nav-links">
          {navItems
            .filter((item) => hasPermission(item.permission))
            .map((item, index) => (
              <li key={index} className={`nav-item ${item.className || ""}`}>
                <NavLink to={item.to}>
                  {item.icon} {item.label}
                  {item.children && (
                    <FaChevronDown className="dropdown-arrow" />
                  )}
                </NavLink>
                {item.children && (
                  <ul className="dropdown-menu">
                    {item.children
                      .filter((child) => hasPermission(child.permission))
                      .map((child, childIndex) => (
                        <li
                          key={childIndex}
                          className={`nav-item ${child.className || ""}`}
                        >
                          <NavLink to={child.to}>
                            {child.icon} {child.label}
                            {child.to === "/pending-assignments" &&
                              pendingCount > 0 && (
                                <span className="badge">{pendingCount}</span>
                              )}
                          </NavLink>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))}
        </ul>
      </div>

      <div className="navbar-right">
        {userInfo && <NotificationDropdown />}
        <div className="datetime-container">
          <div className="datetime-text">
            <div className="datetime-line">
              <FaClock className="datetime-icon" />
              <span className="time">
                {currentDateTime.toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="datetime-line">
              <FaRegCalendarAlt className="datetime-icon small" />
              <span className="date">
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
        <div className="nav-actions" ref={searchContainerRef}>
          <div
            className={`search-container ${isSearchVisible ? "active" : ""}`}
          >
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                className="search-input"
                placeholder="  Sayfada Ara"
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                ref={searchInputRef}
              />
            </form>
          </div>
          <button
            className="nav-action-btn"
            onClick={() => setIsSearchVisible((prev) => !prev)}
          >
            <FaSearch />
          </button>
          <button
            className="nav-action-btn theme-toggle-btn"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
        </div>
        {userInfo ? (
          <UserMenu
            inactivityTime={inactivityTime}
            isTimeoutWarning={isTimeoutWarning}
          />
        ) : (
          <ul className="nav-links">
            <li className="nav-item">
              <NavLink to="/login">
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
