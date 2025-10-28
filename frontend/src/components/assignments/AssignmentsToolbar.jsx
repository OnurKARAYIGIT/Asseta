import React from "react";
import { FaPlus, FaFileExcel } from "react-icons/fa";

const AssignmentsToolbar = ({
  searchTerm,
  setSearchTerm,
  filterLocation,
  setFilterLocation,
  companies,
  handleExport,
  onAddNew,
}) => {
  return (
    <div className="filter-toolbar no-print">
      <div className="toolbar-group">
        <input
          type="text"
          placeholder="Ara (Personel, Eşya, Seri No...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: "250px" }}
        />
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        >
          <option value="">Tüm Konumlar</option>
          {companies.map((company) => (
            <option key={company._id} value={company._id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar-group">
        <button onClick={onAddNew}>
          <FaPlus /> Yeni Zimmet Ekle
        </button>
        <button onClick={handleExport} style={{ backgroundColor: "#1D6F42" }}>
          <FaFileExcel /> Excele Aktar
        </button>
      </div>
    </div>
  );
};

export default AssignmentsToolbar;
