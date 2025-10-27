import React from "react";
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
  const navigate = useNavigate();

  // Kalan süreyi MM:SS formatına çevir
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!userInfo) return null;

  return (
    <div className="user-menu">
      <ActionDropdown
        toggleComponent={
          <div className="user-menu-button">
            <div className="user-avatar">
              <FaUserCircle className="user-avatar-icon" />
            </div>
            <div className="user-info">
              <span className="user-name">{userInfo.username}</span>
              <div
                className={`inactivity-timer ${
                  isTimeoutWarning ? "warning" : ""
                }`}
                title="Oturumun sonlanmasına kalan süre"
              >
                <FaClock />
                <span>Oturum Kalan Süre: {formatTime(inactivityTime)}</span>
              </div>
            </div>

            <FaChevronDown className="dropdown-arrow user-menu-arrow" />
          </div>
        }
        actions={[
          {
            label: "Profilim",
            className: "edit",
            icon: <FaUser />,
            onClick: () => navigate("/profile"),
          },
          {
            label: "Ayarlar",
            className: "secondary",
            icon: <FaCog />,
            onClick: () => navigate("/settings"),
          },
          {
            label: "Çıkış Yap",
            className: "delete",
            icon: <FaSignOutAlt />,
            onClick: logout,
          },
        ]}
      />
    </div>
  );
};

export default UserMenu;
