import React from "react";
import DatePicker from "react-datepicker";
import { FaTimes, FaFileExcel } from "react-icons/fa";

const AuditLogToolbar = ({
  filters,
  users,
  isFilterActive,
  handleFilterChange,
  handleDateChange,
  clearFilters,
  handleExport,
}) => {
  return (
    <div className="filter-toolbar">
      <div className="toolbar-group">
        <select
          name="userId"
          value={filters.userId}
          onChange={handleFilterChange}
        >
          <option value="">Tüm Kullanıcılar</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.username}
            </option>
          ))}
        </select>
        <DatePicker
          selectsRange={true}
          startDate={filters.startDate ? new Date(filters.startDate) : null}
          endDate={filters.endDate ? new Date(filters.endDate) : null}
          onChange={handleDateChange}
          isClearable={true}
          placeholderText="Tarih aralığı seçin"
          dateFormat="dd/MM/yyyy"
          maxDate={new Date()}
          locale="tr"
          popperClassName="datepicker-popper"
          className="date-picker-input"
        />
        {isFilterActive && (
          <button
            onClick={clearFilters}
            title="Filtreleri Temizle"
            style={{ backgroundColor: "var(--secondary-color)" }}
          >
            <FaTimes />
          </button>
        )}
      </div>
      <div className="toolbar-group">
        <button onClick={handleExport} style={{ backgroundColor: "#1D6F42" }}>
          <FaFileExcel /> Excel'e Aktar
        </button>
      </div>
    </div>
  );
};

export default AuditLogToolbar;
