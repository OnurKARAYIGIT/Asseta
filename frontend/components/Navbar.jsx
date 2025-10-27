import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaClipboardList,
  FaFileAlt,
  FaBuilding,
  FaBoxOpen,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "./AuthContext";
import "./Navbar.css"; // CSS dosyasını import et
import logoAsseta from "/src/assets/logo.svg"; // Yeni logoyu import et
import PermissionGuard from "../src/components/PermissionGuard";

const Navbar = () => {
  // Artık kullanıcı bilgilerini ve logout fonksiyonunu context'ten alıyoruz.
  const { userInfo, logout } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-logo-link">
        <img src={logoAsseta} alt="Asseta Logo" className="nav-logo" />
      </NavLink>
      {userInfo && (
        <ul className="nav-links">
          <li>
            <NavLink to="/dashboard">
              <FaTachometerAlt /> Ana Panel
            </NavLink>
          </li>
          <PermissionGuard requiredPermission="assignments">
            <li>
              <NavLink to="/assignments">
                <FaClipboardList /> Zimmetler
              </NavLink>
            </li>
          </PermissionGuard>
          <PermissionGuard requiredPermission="personnel-report">
            <li>
              <NavLink to="/personnel-report">
                <FaFileAlt /> Personel Raporu
              </NavLink>
            </li>
          </PermissionGuard>
          <PermissionGuard requiredPermission="locations">
            <li>
              <NavLink to="/locations">
                <FaBuilding /> Konumlar
              </NavLink>
            </li>
          </PermissionGuard>
          <PermissionGuard requiredPermission="items">
            <li>
              <NavLink to="/items">
                <FaBoxOpen /> Eşyalar
              </NavLink>
            </li>
          </PermissionGuard>
          <li className="user-section">
            <span className="user-info">
              <FaUserCircle className="user-info-icon" />
              Hoşgeldin, {userInfo.username}
            </span>
            <button onClick={logout} className="logout-button">
              <FaSignOutAlt /> Çıkış Yap
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
};
