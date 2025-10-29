import React from "react";
import DatePicker from "react-datepicker";
import { FaFileExcel, FaTimes } from "react-icons/fa";
import Button from "../shared/Button";

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
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden">
      <div className="flex flex-wrap items-center gap-4">
        <select
          name="userId"
          value={filters.userId}
          onChange={handleFilterChange}
          className="w-full sm:w-auto px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Tüm Kullanıcılar</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.username}
            </option>
          ))}
        </select>
        <DatePicker
          selectsRange
          startDate={filters.startDate ? new Date(filters.startDate) : null}
          endDate={filters.endDate ? new Date(filters.endDate) : null}
          onChange={handleDateChange}
          isClearable={true}
          placeholderText="Tarih aralığı seçin"
          dateFormat="dd/MM/yyyy"
          locale="tr"
          className="w-full sm:w-auto px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {isFilterActive && (
          <Button variant="text" size="sm" onClick={clearFilters}>
            <FaTimes className="mr-1" /> Filtreleri Temizle
          </Button>
        )}
      </div>
      <Button
        variant="excel"
        onClick={handleExport}
        className="w-full sm:w-auto"
      >
        <FaFileExcel className="mr-2" /> Excel'e Aktar
      </Button>
    </div>
  );
};

export default AuditLogToolbar;
