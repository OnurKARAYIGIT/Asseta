import React from "react";
import { FaBoxOpen } from "react-icons/fa";

const ItemSummaryCard = ({ item, assignmentCount }) => {
  if (!item) return null;

  return (
    <div className="report-summary-card no-print">
      <div className="card-avatar-section">
        <FaBoxOpen />
      </div>
      <div className="card-details-section">
        <div className="card-main-info">
          <h2>{item.name}</h2>
          <p>Eşya Zimmet Özeti</p>
        </div>
        <div className="card-stats">
          <div className="stat-item">
            <span className="stat-value">{assignmentCount}</span>
            <span className="stat-label">Toplam Zimmet</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{item.brand}</span>
            <span className="stat-label">Marka</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{item.assetTag}</span>
            <span className="stat-label">Demirbaş No</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{item.serialNumber || "-"}</span>
            <span className="stat-label">Seri No</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSummaryCard;
