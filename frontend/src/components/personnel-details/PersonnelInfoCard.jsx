import React from "react";
import { FaEnvelope, FaPhone, FaBriefcase } from "react-icons/fa";

const PersonnelInfoCard = ({ profileInfo }) => {
  return (
    <div className="profile-details-card no-print">
      <h3 className="section-subtitle">İletişim Bilgileri</h3>
      <div className="profile-detail-item">
        <FaEnvelope />
        <span>{profileInfo?.email || "E-posta Bilgisi Yok"}</span>
      </div>
      <div className="profile-detail-item">
        <FaPhone />
        <span>{profileInfo?.phone || "Telefon Bilgisi Yok"}</span>
      </div>
      <div className="profile-detail-item">
        <FaBriefcase />
        <span>{profileInfo?.position || "Pozisyon Bilgisi Yok"}</span>
      </div>
    </div>
  );
};

export default PersonnelInfoCard;
