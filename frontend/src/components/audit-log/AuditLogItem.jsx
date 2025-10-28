import React from "react";
import {
  FaHistory,
  FaTrash,
  FaPlusCircle,
  FaEdit,
  FaSignInAlt,
  FaKey,
  FaClock,
} from "react-icons/fa";

const getActionIcon = (action) => {
  if (action.includes("SİLİNDİ") || action.includes("REDDET")) {
    return { icon: <FaTrash />, color: "var(--danger-color)" };
  }
  if (action.includes("OLUŞTURULDU") || action.includes("EKLENDİ")) {
    return { icon: <FaPlusCircle />, color: "var(--success-color)" };
  }
  if (action.includes("GÜNCELLENDİ") || action.includes("ONAYLANDI")) {
    return { icon: <FaEdit />, color: "var(--info-color)" };
  }
  if (action.includes("GİRİŞ")) {
    return { icon: <FaSignInAlt />, color: "var(--primary-color)" };
  }
  if (action.includes("ŞİFRE")) {
    return { icon: <FaKey />, color: "#e67e22" };
  }
  return { icon: <FaHistory />, color: "var(--text-color-light)" };
};

const AuditLogItem = ({ log }) => {
  const { icon, color } = getActionIcon(log.action);

  return (
    <div className="timeline-item">
      <div className="timeline-icon" style={{ color }}>
        {icon}
      </div>
      <div className="timeline-content">
        <div className="timeline-header">
          <span className="timeline-user">
            {log.user?.username || "Sistem"}
          </span>
          <span className="timeline-action-type">
            {log.action.replace(/_/g, " ")}
          </span>
          <span className="timeline-time">
            <FaClock />
            {new Date(log.createdAt).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="timeline-details">{log.details}</p>
      </div>
    </div>
  );
};

export default AuditLogItem;
