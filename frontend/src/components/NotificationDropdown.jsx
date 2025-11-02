import React, { useState, useEffect, useRef } from "react";
import {
  FaBell,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import Loader from "./Loader";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => axiosInstance.get("/notifications").then((res) => res.data),
    refetchInterval: 1000 * 60, // 1 dakikada bir kontrol et
    refetchOnWindowFocus: true,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      axiosInstance.put(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => axiosInstance.put("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
    setIsOpen(false);
  };

  const getIconForType = (type) => {
    switch (type) {
      case "leave_approved":
        return <FaCheckCircle className="text-success" />;
      case "leave_rejected":
        return <FaTimesCircle className="text-danger" />;
      default:
        return <FaInfoCircle className="text-info" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-text-light hover:text-white transition-colors"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card-background rounded-lg shadow-lg border border-border z-50">
          <div className="p-3 flex justify-between items-center border-b border-border">
            <h3 className="font-bold text-text-main">Bildirimler</h3>
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-primary hover:underline disabled:text-text-light"
              disabled={unreadCount === 0 || markAllAsReadMutation.isLoading}
            >
              Tümünü Okundu İşaretle
            </button>
          </div>
          {isLoading ? (
            <div className="p-4">
              <Loader size="sm" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-text-light">
              <FaCheckCircle className="mx-auto text-success mb-2" size={24} />
              Henüz yeni bildirim yok.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notif) => (
                <Link
                  key={notif._id}
                  to={notif.link}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-3 border-b border-border last:border-b-0 hover:bg-background-soft ${
                    !notif.isRead ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="mt-1">{getIconForType(notif.type)}</div>
                  <div>
                    <p className="text-sm text-text-main">{notif.message}</p>
                    <p className="text-xs text-text-light mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
