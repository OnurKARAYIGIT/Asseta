import React from "react";
import { FaList } from "react-icons/fa";

const DisplaySettings = ({ settings, onSettingChange }) => {
  return (
    <div className="settings-card">
      <h2>Veri Gösterimi</h2>
      <div className="setting-item">
        <div className="setting-label">
          <FaList style={{ marginRight: "10px", color: "#2ecc71" }} />
          Sayfa başına gösterilecek kayıt sayısı
        </div>
        <div className="setting-control">
          <select
            name="itemsPerPage"
            value={settings.itemsPerPage}
            onChange={onSettingChange}
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DisplaySettings;
