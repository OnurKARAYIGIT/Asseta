import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {
  FaChevronDown,
  FaUser,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaClock,
} from "react-icons/fa";
import ConfirmationModal from "./shared/ConfirmationModal";

const UserMenu = ({ inactivityTime, isTimeoutWarning }) => {
  const { userInfo, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    // Component kaldırıldığında event listener'ı temizle
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Menü dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Kalan süreyi MM:SS formatına çevir
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false); // Önce menüyü kapat
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout({ navigate });
  };

  if (!userInfo) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${
          isScrolled ? "text-shadow-md" : ""
        } hover:bg-white/10`}
      >
        <FaUserCircle className="text-3xl text-yellow-400" />
        <div className="hidden md:flex flex-col items-start text-white">
          <span className="font-semibold">
            {userInfo.personnel?.fullName || userInfo.email}
          </span>
          <div
            className={`flex items-center gap-1 text-xs transition-colors ${
              isTimeoutWarning
                ? "font-bold text-yellow-400 animate-pulse"
                : "text-white/70"
            }`}
            title="Oturumun sonlanmasına kalan süre"
          >
            <FaClock />
            <span>Oturum: {formatTime(inactivityTime)}</span>
          </div>
        </div>
        <FaChevronDown
          className={`ml-1 text-xs text-white transition-transform ${
            isMenuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isMenuOpen && (
        <ul className="absolute top-full right-0 mt-2 w-48 rounded-lg border border-white/10 bg-slate-400/50 p-2 shadow-xl backdrop-blur-xl z-20">
          <li>
            <button
              onClick={() => {
                navigate("/profile");
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded-md"
            >
              <FaUser className="text-blue-500" /> Profilim
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                navigate("/settings");
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded-md"
            >
              <FaCog className="text-orange-500" /> Ayarlar
            </button>
          </li>
          <li>
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/20 rounded-md"
            >
              <FaSignOutAlt /> Çıkış Yap
            </button>
          </li>
        </ul>
      )}

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Çıkış Yapma Onayı"
        confirmText="Evet, Çıkış Yap"
        confirmButtonVariant="danger"
      >
        <p>Sistemden çıkış yapmak istediğinizden emin misiniz?</p>
      </ConfirmationModal>
    </div>
  );
};

export default UserMenu;
