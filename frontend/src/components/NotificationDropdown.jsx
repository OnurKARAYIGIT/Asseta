import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaCheckCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // useAuth hook'unu import et
import axiosInstance from "../api/axiosInstance";
import Modal from "./Modal"; // Modal bileşenini import et
import "./NotificationDropdown.css";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const [isAllNotificationsModalOpen, setIsAllNotificationsModalOpen] =
    useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const { userInfo } = useAuth(); // AuthContext'ten userInfo'yu al
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const readNotifications =
        JSON.parse(localStorage.getItem("readNotifications")) || [];
      try {
        const { data } = await axiosInstance.get("/audit-logs?limit=7");
        setNotifications(
          data.logs.map((log) => ({
            ...log,
            read: readNotifications.includes(log._id),
          }))
        );
      } catch (error) {
        console.error("Bildirimler alınamadı:", error);
      } finally {
        setLoading(false);
      }
    };

    // Sadece kullanıcı bilgileri yüklendiğinde bildirimleri çek
    if (userInfo) {
      fetchNotifications();
    }
  }, [userInfo]); // useEffect'i userInfo değişimine bağla

  // Dışarıya tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Esc tuşu ile tüm bildirimler modalını kapatma
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape" && isAllNotificationsModalOpen) {
        setIsAllNotificationsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isAllNotificationsModalOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif) => {
    // Bildirimi okundu olarak işaretle
    handleMarkAsRead(notif._id);

    // Detay metninden ID'yi ayıkla (örn: ... (ID: 60c72b2f9b1d8c001c8e4d8e))
    const match = notif.details.match(/\(ID: ([a-f0-9]{24})\)/);
    if (match && match[1]) {
      const assignmentId = match[1];
      // İlgili zimmetin modalını açmak için özel parametre ile yönlendir
      navigate(`/assignments?openModal=${assignmentId}`);
      setIsOpen(false); // Dropdown'ı kapat
    }
  };

  const handleMarkAsRead = (id, shouldNavigate = false) => {
    const readNotifications =
      JSON.parse(localStorage.getItem("readNotifications")) || [];
    if (!readNotifications.includes(id)) {
      localStorage.setItem(
        "readNotifications",
        JSON.stringify([...readNotifications, id])
      );
    }
    setNotifications(
      notifications.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = (e) => {
    e.stopPropagation(); // Olayın dropdown'ı kapatmasını engelle
    const allIds = notifications.map((n) => n._id);
    localStorage.setItem("readNotifications", JSON.stringify(allIds));
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleShowAll = async () => {
    setIsOpen(false); // Açılır menüyü kapat
    setIsAllNotificationsModalOpen(true);
    try {
      // Tüm denetim kayıtlarını çek (limitsiz)
      const { data } = await axiosInstance.get("/audit-logs");
      setAllNotifications(data.logs);
    } catch (error) {
      console.error("Tüm bildirimler alınamadı:", error);
      // Hata durumunda modal içinde bir mesaj gösterilebilir.
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button className="nav-action-btn" onClick={() => setIsOpen(!isOpen)}>
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="dropdown-panel">
          <div className="panel-header">
            <h3>Bildirimler</h3>
            <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
              Tümünü Okundu İşaretle
            </button>
          </div>
          <ul className="notification-list">
            {loading ? (
              <li className="notification-item">Yükleniyor...</li>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <li
                  key={notif._id}
                  className={`notification-item ${!notif.read ? "unread" : ""}`}
                  onClick={() => handleMarkAsRead(notif._id)}
                >
                  <div className="notification-icon">
                    <FaCheckCircle />
                  </div>
                  <div className="notification-content">
                    <p className="notification-text">{notif.details}</p>
                    <span className="notification-time">
                      {new Date(notif.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="notification-item">Yeni bildirim yok.</li>
            )}
          </ul>
          <div className="panel-footer">
            <button className="link-button" onClick={handleShowAll}>
              Tüm Bildirimleri Gör
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isAllNotificationsModalOpen}
        onClose={() => setIsAllNotificationsModalOpen(false)}
        title="Tüm Bildirimler"
        size="large"
      >
        <ul className="notification-list" style={{ maxHeight: "60vh" }}>
          {allNotifications.length > 0 ? (
            allNotifications.map((notif) => (
              <li
                key={notif._id}
                className="notification-item"
                style={{ alignItems: "flex-start" }}
              >
                <div className="notification-icon">
                  <FaCheckCircle />
                </div>
                <div className="notification-content">
                  <p className="notification-text">
                    <strong>{notif.username}</strong> kullanıcısı bir işlem
                    yaptı: {notif.details}
                  </p>
                  <span className="notification-time">
                    {new Date(notif.createdAt).toLocaleString("tr-TR")}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <li className="notification-item">Yükleniyor veya bildirim yok.</li>
          )}
        </ul>
      </Modal>
    </div>
  );
};

export default NotificationDropdown;
