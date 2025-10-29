import React from "react";
import Button from "../shared/Button";

const AuditLogPagination = ({ currentPage, totalPages, setCurrentPage }) => {
  const getPaginationRange = () => {
    const maxVisibleButtons = 5;
    if (totalPages <= maxVisibleButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisibleButtons / 2)
    );
    let endPage = startPage + maxVisibleButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisibleButtons + 1;
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-6 print:hidden">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
      >
        &laquo;&laquo;
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &laquo; Geri
      </Button>
      {getPaginationRange().map((number) => (
        <Button
          key={number}
          size="sm"
          variant={currentPage === number ? "primary" : "secondary"}
          onClick={() => setCurrentPage(number)}
        >
          {number}
        </Button>
      ))}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        İleri &raquo;
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
      >
        &raquo;&raquo;
      </Button>
    </div>
  );
};

export default AuditLogPagination;
