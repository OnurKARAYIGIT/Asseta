import React from "react";
import { FaColumns } from "react-icons/fa";

const ColumnManager = ({ visibleColumns, allColumns, onColumnChange }) => {
  return (
    <div className="settings-card">
      <h2>Tablo Görünümü Ayarları</h2>
      <div className="setting-item column-manager">
        <div className="setting-label">
          <FaColumns style={{ marginRight: "10px", color: "#1abc9c" }} />
          Zimmetler Tablosu Sütunları
          <p className="setting-description">
            Listeleme sayfasında varsayılan olarak görmek istediğiniz sütunları
            seçin.
          </p>
        </div>
        <div className="setting-control column-list">
          {allColumns.map((col) => (
            <label key={col.key} className="column-checkbox">
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => onColumnChange(col.key)}
              />
              {col.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColumnManager;
