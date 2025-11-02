import React from "react";
import {
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaBriefcase,
  FaCalendarAlt,
  FaUserTie,
} from "react-icons/fa";

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="text-secondary mt-1 mr-3">{icon}</div>
    <div>
      <p className="text-xs text-text-light">{label}</p>
      <p className="text-sm font-medium text-text-main">{value || "-"}</p>
    </div>
  </div>
);

const PersonnelInfoCard = ({ personnel }) => {
  if (!personnel) return null;

  return (
    <div className="bg-card-background backdrop-blur-xl p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
      <h3 className="text-xl font-bold text-text-main mb-4">Genel Bilgiler</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <InfoItem
          icon={<FaIdCard />}
          label="Sicil No"
          value={personnel.employeeId}
        />
        <InfoItem
          icon={<FaEnvelope />}
          label="E-posta"
          value={personnel.email}
        />
        <InfoItem
          icon={<FaPhone />}
          label="Telefon"
          value={personnel.contactInfo?.phone}
        />
        <InfoItem
          icon={<FaBuilding />}
          label="Departman"
          value={personnel.jobInfo?.department}
        />
        <InfoItem
          icon={<FaBriefcase />}
          label="Pozisyon"
          value={personnel.jobInfo?.position}
        />
        <InfoItem
          icon={<FaCalendarAlt />}
          label="İşe Başlangıç"
          value={
            personnel.jobInfo?.startDate
              ? new Date(personnel.jobInfo.startDate).toLocaleDateString(
                  "tr-TR"
                )
              : "-"
          }
        />
        <InfoItem
          icon={<FaUserTie />}
          label="Yöneticisi"
          value={personnel.manager?.fullName}
        />
      </div>
    </div>
  );
};

export default PersonnelInfoCard;
