import React from "react";

const ItemsPagination = ({ currentPage, totalPages, setCurrentPage }) => {
  // Sayfalama için gösterilecek sayfa aralığını hesaplayan fonksiyon
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
    <div className="pagination no-print">
      <button
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &laquo; Geri
      </button>
      {getPaginationRange().map((number) => (
        <button
          key={number}
          onClick={() => setCurrentPage(number)}
          className={currentPage === number ? "active" : ""}
        >
          {number}
        </button>
      ))}
      <button
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        İleri &raquo;
      </button>
    </div>
  );
};

export default ItemsPagination;
