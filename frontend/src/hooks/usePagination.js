import { useState, useMemo } from "react";

export const usePagination = ({
  currentPage: initialPage = 1,
  totalPages,
  maxVisibleButtons = 5,
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const paginationRange = useMemo(() => {
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
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }, [currentPage, totalPages, maxVisibleButtons]);

  return { currentPage, setCurrentPage, paginationRange };
};
