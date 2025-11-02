import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PersonnelPagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
}) => {
  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-text-light">
        {totalItems ? (
          <span>Toplam {totalItems} kayıt</span>
        ) : (
          <span>
            Sayfa {currentPage} / {totalPages}
          </span>
        )}
      </div>
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="px-3 py-1 mx-1 rounded-md bg-button-secondary-background text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaChevronLeft />
      </button>
      <span className="text-text-light mx-4">
        Sayfa {currentPage} / {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-3 py-1 mx-1 rounded-md bg-button-secondary-background text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaChevronRight />
      </button>
    </div>
  );
};

export default PersonnelPagination;
