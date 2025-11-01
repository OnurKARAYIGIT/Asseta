import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaCheckCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // useAuth hook'unu import et
import axiosInstance from "../api/axiosInstance";
import Modal from "./shared/Modal.jsx";

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
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-primary-hover"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Bildirimleri aç"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 rounded-lg bg-card-background shadow-2xl border border-border/50">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <h3 className="font-semibold text-text-main">Bildirimler</h3>
            <button
              className="text-xs text-primary hover:underline"
              onClick={handleMarkAllAsRead}
            >
              Tümünü Okundu İşaretle
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {loading ? (
              <li className="px-4 py-3 text-center text-sm text-text-light">
                Yükleniyor...
              </li>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <li
                  key={notif._id}
                  className={`flex gap-3 border-b border-border/50 px-4 py-3 last:border-b-0 hover:bg-background/50 ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleMarkAsRead(notif._id)}
                >
                  <div className="mt-1 text-secondary">
                    <FaCheckCircle />
                  </div>
                  <div>
                    <p className="text-sm text-text-main">{notif.details}</p>
                    <span className="text-xs text-text-light">
                      {new Date(notif.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-center text-sm text-text-light">
                Yeni bildirim yok.
              </li>
            )}
          </ul>
          <div className="border-t border-border px-4 py-2 text-center">
            <button
              className="text-sm font-semibold text-primary hover:underline"
              onClick={handleShowAll}
            >
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
        <ul className="max-h-[60vh] overflow-y-auto">
          {allNotifications.length > 0 ? (
            allNotifications.map((notif) => (
              <li
                key={notif._id}
                className="flex items-start gap-3 border-b border-border/50 p-3 last:border-b-0"
              >
                <div className="mt-1 text-secondary">
                  <FaCheckCircle />
                </div>
                <div>
                  <p className="text-sm text-text-main">
                    <strong>{notif.username}</strong> kullanıcısı bir işlem
                    yaptı: {notif.details}
                  </p>
                  <span className="text-xs text-text-light">
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
