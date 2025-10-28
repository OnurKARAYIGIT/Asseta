import React from "react";
import {
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaUserTag,
  FaClock,
  FaHistory,
} from "react-icons/fa";

const ProfileInfoCard = ({ profileData, onOpenPasswordModal }) => {
  return (
    <div className="profile-card profile-info-card">
      <h2>Kullanıcı Bilgileri</h2>
      <div className="profile-detail-item">
        <FaEnvelope className="profile-icon email" />
        <span>{profileData?.email}</span>
      </div>
      <div className="profile-detail-item">
        <FaPhone className="profile-icon phone" />
        <span>{profileData?.phone}</span>
      </div>
      <div className="profile-detail-item">
        <FaBriefcase className="profile-icon position" />
        <span>{profileData?.position}</span>
      </div>
      <div className="profile-detail-item">
        <FaUserTag className="profile-icon role" />
        <span>Rol: {profileData?.role}</span>
      </div>
      <div className="profile-detail-item">
        <FaClock className="profile-icon last-login" />
        <span>
          Son Giriş:{" "}
          {profileData?.lastLogin
            ? new Date(profileData.lastLogin).toLocaleString("tr-TR")
            : "Bilinmiyor"}
        </span>
      </div>
      {profileData?.actions && profileData.actions.length > 0 && (
        <div className="profile-detail-item">
          <FaHistory className="profile-icon last-action" />
          <span>
            Son İşlem: {profileData.actions[0].action.replace(/_/g, " ")} (
            {new Date(profileData.actions[0].createdAt).toLocaleString("tr-TR")}
            )
          </span>
        </div>
      )}
      <div style={{ marginTop: "1.5rem" }}>
        <button onClick={onOpenPasswordModal}>Şifre Değiştir</button>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
