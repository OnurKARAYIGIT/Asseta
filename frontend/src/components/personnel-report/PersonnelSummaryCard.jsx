import React from "react";
import { FaUser } from "react-icons/fa";

const PersonnelSummaryCard = ({ results, searchedPersonnel, onClick }) => {
  return (
    <div
      className="report-summary-card no-print"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      title="Bu personele ait tüm zimmetleri görmek için tıklayın"
    >
      <div className="card-avatar-section">
        <FaUser />
      </div>
      <div className="card-details-section">
        <div className="card-main-info">
          <h2>{searchedPersonnel}</h2>
          <p>Personel Zimmet Özeti</p>
        </div>
        <div className="card-stats">
          <div className="stat-item">
            <span className="stat-value">{results.length}</span>
            <span className="stat-label">Toplam Zimmet</span>
          </div>
          <div className="stat-item locations">
            <span className="stat-label">Bulunduğu Konumlar</span>
            <div className="location-tags">
              {[...new Set(results.map((r) => r.company.name))].map((loc) => (
                <span key={loc} className="location-tag">
                  {loc}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelSummaryCard;
