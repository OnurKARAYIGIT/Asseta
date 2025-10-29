import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import ActionDropdown from "./ActionDropdown";
import {
  FaUser,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaChevronDown,
  FaClock,
} from "react-icons/fa";

const UserMenu = ({ inactivityTime, isTimeoutWarning }) => {
  const { userInfo, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const handleScroll = () => {
      // 10px'den fazla kaydırıldıysa state'i güncelle
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    // Component kaldırıldığında event listener'ı temizle
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  // Kalan süreyi MM:SS formatına çevir
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!userInfo) return null;

  return (
    <ActionDropdown
      toggleComponent={
        <div
          className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-color  ${
            isScrolled ? "backdrop-blur-3xl text-shadow-md" : ""
          }`}
        >
          <div>
            <FaUserCircle className="text-3xl text-yellow-400" />
          </div>
          <div className="flex flex-col items-start text-white">
            <span className="font-semibold">{userInfo.username}</span>
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
          <FaChevronDown className="ml-1 text-white/70" />
        </div>
      }
      actions={[
        {
          label: "Profilim",
          icon: <FaUser />,
          onClick: () => navigate("/profile"),
        },
        {
          label: "Ayarlar",
          icon: <FaCog />,
          onClick: () => navigate("/settings"),
        },
        {
          label: "Çıkış Yap",
          icon: <FaSignOutAlt />,
          onClick: logout,
          className: "text-danger hover:bg-danger/10 hover:!text-danger",
        },
      ]}
    />
  );
};

export default UserMenu;
