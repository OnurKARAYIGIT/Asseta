import React from "react";
import {
  FaEdit,
  FaTrash,
  FaKey,
  FaUserShield,
  FaUser,
  FaCode,
} from "react-icons/fa";
import { MdEmail, MdPhone, MdWork } from "react-icons/md";
import ActionDropdown from "../ActionDropdown";

const RoleDisplay = ({ role }) => {
  const roleInfo = {
    developer: { icon: <FaCode />, className: "role-badge-developer" },
    admin: { icon: <FaUserShield />, className: "role-badge-admin" },
    user: { icon: <FaUser />, className: "role-badge-user" },
  };

  const { icon, className } = roleInfo[role] || roleInfo.user;

  return (
    <div className={`role-badge ${className}`}>
      {icon}
      <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
    </div>
  );
};

const UserCard = ({
  user,
  currentUser,
  onEdit,
  onEditPermissions,
  onResetPassword,
  onDelete,
}) => {
  const isSelf = user._id === currentUser._id;
  const isRequesterDeveloper = currentUser.role === "developer";
  const isTargetDeveloper = user.role === "developer";

  const permissions = {
    canChangeRole: isRequesterDeveloper ? true : !isSelf,
    canEditPermissions: isRequesterDeveloper || user.role === "user",
    canResetPassword: isRequesterDeveloper || !isTargetDeveloper,
    canDelete: !isSelf && !isTargetDeveloper,
    canEdit: isRequesterDeveloper || !isTargetDeveloper,
  };

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Bilinmiyor";
    return new Date(dateString).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`user-card role-${user.role}`}>
      <div className="user-card-header">
        <div className="user-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <span className="user-name">{user.username}</span>
          <RoleDisplay role={user.role} />
        </div>
        <div className="user-actions">
          <ActionDropdown
            actions={[
              {
                label: "Düzenle",
                icon: <FaEdit />,
                onClick: () => onEdit(user),
                disabled: !permissions.canEdit,
              },
              {
                label: "Yetkileri Düzenle",
                icon: <FaUserShield />,
                onClick: () => onEditPermissions(user),
                disabled: !permissions.canEditPermissions,
              },
              {
                label: "Şifre Sıfırla",
                icon: <FaKey />,
                onClick: () => onResetPassword(user),
                disabled: !permissions.canResetPassword,
              },
              {
                label: "Sil",
                icon: <FaTrash />,
                onClick: () => onDelete(user),
                disabled: !permissions.canDelete,
              },
            ]}
          />
        </div>
      </div>
      <div className="user-card-body">
        <div className="user-detail-item">
          <MdEmail /> <span>{user.email}</span>
        </div>
        <div className="user-detail-item">
          <MdPhone /> <span>{user.phone}</span>
        </div>
        <div className="user-detail-item">
          <MdWork /> <span>{user.position}</span>
        </div>
      </div>
      <div className="user-card-footer">
        {isOnline(user.lastSeen) ? (
          <div className="status-badge online">
            <div className="dot"></div>
            <span>Online</span>
          </div>
        ) : (
          <div className="status-badge offline">
            <div className="dot"></div>
            <span>Son görülme: {formatRelativeTime(user.lastSeen)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;
