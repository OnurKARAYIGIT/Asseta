import React from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  totalItems,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (currentPage - half < 1) {
      end = Math.min(totalPages, maxPagesToShow);
    }

    if (currentPage + half > totalPages) {
      start = Math.max(1, totalPages - maxPagesToShow + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const renderButton = (page, icon, disabled, key) => (
    <button
      key={key}
      onClick={() => onPageChange(page)}
      disabled={disabled}
      className={`px-3 py-2 mx-1 rounded-md text-sm font-medium transition-colors
        ${
          currentPage === page
            ? "bg-primary text-white"
            : "bg-card-bg-light dark:bg-card-bg-dark text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {icon || page}
    </button>
  );

  return (
    <div
      className={`flex flex-col sm:flex-row justify-between items-center gap-4 ${className}`}
    >
      {totalItems !== undefined && (
        <div className="text-sm text-text-light">
          Toplam <strong>{totalItems}</strong> kayıt
        </div>
      )}
      <div className="flex justify-center items-center">
        {renderButton(1, <FaAngleDoubleLeft />, currentPage === 1, "first")}
        {renderButton(
          currentPage - 1,
          <FaChevronLeft />,
          currentPage === 1,
          "prev"
        )}
        {pageNumbers.map((number) => renderButton(number, null, false, number))}
        {renderButton(
          currentPage + 1,
          <FaChevronRight />,
          currentPage === totalPages,
          "next"
        )}
        {renderButton(
          totalPages,
          <FaAngleDoubleRight />,
          currentPage === totalPages,
          "last"
        )}
      </div>
    </div>
  );
};

export default Pagination;
