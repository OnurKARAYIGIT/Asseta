import React from "react";
import { FaPrint, FaSearch } from "react-icons/fa";

const ItemReportToolbar = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  loading,
  showPrintButton,
  handlePrint,
}) => {
  return (
    <div className="filter-toolbar no-print">
      <form onSubmit={handleSearch} className="search-form">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Demirbaş No veya Seri No ile arama yapın..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Aranıyor..." : "Ara"}
        </button>
      </form>
      {showPrintButton && (
        <button onClick={handlePrint} className="print-button no-print">
          <FaPrint /> Yazdır
        </button>
      )}
    </div>
  );
};

export default ItemReportToolbar;
