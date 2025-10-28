import React from "react";
import { FaFileExcel } from "react-icons/fa";

const ItemsToolbar = ({
  statusFilter,
  setStatusFilter,
  assetTypeFilter,
  setAssetTypeFilter,
  searchTerm,
  setSearchTerm,
  handleExport,
  assetTypesList,
}) => {
  return (
    <div className="filter-toolbar no-print">
      <div className="toolbar-group">
        <div className="tab-buttons">
          <button
            className={statusFilter === "" ? "active" : ""}
            onClick={() => setStatusFilter("")}
          >
            Tümü
          </button>
          <button
            className={statusFilter === "assigned" ? "active" : ""}
            onClick={() => setStatusFilter("assigned")}
          >
            Zimmetli
          </button>
          <button
            className={statusFilter === "arizali" ? "active" : ""}
            onClick={() => setStatusFilter("arizali")}
          >
            Arızalı
          </button>
          <button
            className={statusFilter === "beklemede" ? "active" : ""}
            onClick={() => setStatusFilter("beklemede")}
          >
            Beklemede
          </button>
          <button
            className={statusFilter === "unassigned" ? "active" : ""}
            onClick={() => setStatusFilter("unassigned")}
          >
            Boşta
          </button>
          <button
            className={statusFilter === "hurda" ? "active" : ""}
            onClick={() => setStatusFilter("hurda")}
          >
            Hurda
          </button>
        </div>
      </div>
      <div className="toolbar-group">
        <select
          value={assetTypeFilter}
          onChange={(e) => setAssetTypeFilter(e.target.value)}
        >
          <option value="">Tüm Varlık Cinsleri</option>
          {assetTypesList.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar-group">
        <input
          type="text"
          placeholder="Eşya ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: "250px" }}
        />
      </div>
      <button onClick={handleExport} style={{ backgroundColor: "#1D6F42" }}>
        <FaFileExcel style={{ marginRight: "0.5rem" }} /> Excel'e Aktar
      </button>
    </div>
  );
};

export default ItemsToolbar;
