import React from "react";
import {
  FaEdit,
  FaTrash,
  FaKey,
  FaUserShield,
  FaUser,
  FaEllipsisH,
  FaCode,
  FaCalendarAlt,
} from "react-icons/fa";
import { MdEmail, MdPhone, MdWork } from "react-icons/md";
import ActionDropdown from "../ActionDropdown";

const UserCard = ({
  user,
  currentUser,
  onEdit,
  onEditPermissions,
  onResetPassword,
  onDelete,
}) => {
  const roleInfo = {
    developer: {
      icon: <FaCode className="text-purple-500" />,
      name: "Geliştirici",
      className: "bg-purple-100 text-purple-800",
    },
    admin: {
      icon: <FaUserShield className="text-primary" />,
      name: "Admin",
      className: "bg-primary/10 text-primary",
    },
    user: {
      icon: <FaUser className="text-text-light" />,
      name: "Kullanıcı",
      className: "bg-light-gray text-text-light",
    },
  };

  const isCurrentUser = currentUser._id === user._id;

  // Hangi kullanıcının hangi işlemi yapabileceğini belirleyen yetki mantığı
  const isRequesterDeveloper = currentUser.role === "developer";
  const isTargetDeveloper = user.role === "developer";
  const permissions = {
    canEdit: isRequesterDeveloper || !isTargetDeveloper,
    canEditPermissions: isRequesterDeveloper || user.role === "user",
    canResetPassword: isRequesterDeveloper || !isTargetDeveloper,
    canDelete: !isCurrentUser && !isTargetDeveloper,
  };

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    // Son 5 dakika içinde aktifse online kabul et
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return "Bilinmiyor";
    return new Date(dateString).toLocaleString("tr-TR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`flex flex-col rounded-xl border bg-card-background shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl 
      border-l-4 
      ${
        roleInfo[user.role]?.className
          .replace("bg-", "hover:border-")
          .replace("/10", "") || "hover:border-border"
      }`}
    >
      <div className="flex items-center gap-4 border-b border-border p-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold 
          ${roleInfo[user.role]?.className || "bg-light-gray text-text-light"}`}
        >
          {user.username.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-text-main">{user.username}</h3>
          <div
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold 
            ${
              roleInfo[user.role]?.className || "bg-light-gray text-text-light"
            }`}
          >
            {roleInfo[user.role]?.icon}
            <span>{roleInfo[user.role]?.name}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <ActionDropdown
            actions={[
              {
                label: "Düzenle",
                icon: <FaEdit className="text-blue-500" />,
                onClick: () => onEdit(user),
                disabled: !permissions.canEdit,
              },
              {
                label: "Yetkileri Düzenle",
                icon: <FaUserShield className="text-secondary" />,
                onClick: () => onEditPermissions(user),
                disabled: !permissions.canEditPermissions,
              },
              {
                label: "Şifre Sıfırla",
                icon: <FaKey className="text-yellow-500" />,
                onClick: () => onResetPassword(user),
                disabled: !permissions.canResetPassword,
              },
              {
                label: "Sil",
                icon: <FaTrash className="text-danger" />,
                onClick: () => onDelete(user),
                disabled: !permissions.canDelete,
              },
            ]}
            toggleComponent={
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-text-light transition-colors hover:bg-light-gray">
                <FaEllipsisH />
              </button>
            }
          />
        </div>
      </div>
      <div className="flex-grow space-y-3 p-4">
        <div className="flex items-center gap-3 text-sm text-text-light">
          <MdEmail className="text-secondary" />
          <span>{user.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-text-light">
          <MdPhone className="text-secondary" /> <span>{user.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-text-light">
          <MdWork className="text-secondary" /> <span>{user.position}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-text-light">
          <FaCalendarAlt className="text-secondary" />
          <span>
            Kayıt: {new Date(user.createdAt).toLocaleDateString("tr-TR")}
          </span>
        </div>
      </div>
      <div className="mt-auto border-t border-border p-3 text-xs text-text-light">
        {isOnline(user.lastSeen) ? (
          <div className="flex items-center gap-2 text-green-500 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>Son görülme: {formatLastSeen(user.lastSeen)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;
