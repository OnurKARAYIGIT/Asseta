import React from "react";
import { FaSearch, FaPrint } from "react-icons/fa";
import Button from "../shared/Button";

const PersonnelSearchToolbar = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  loading,
  showPrintButton,
  handlePrint,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden">
      <form onSubmit={handleSearch} className="flex-grow sm:max-w-md w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-text-light" />
          </div>
          <input
            type="text"
            placeholder="Personel adı veya sicil no ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </form>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          type="submit"
          onClick={handleSearch}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Aranıyor..." : "Ara"}
        </Button>
        {showPrintButton && (
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="w-full sm:w-auto"
          >
            <FaPrint className="mr-2" /> Yazdır
          </Button>
        )}
      </div>
    </div>
  );
};

export default PersonnelSearchToolbar;
