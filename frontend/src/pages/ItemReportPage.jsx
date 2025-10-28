import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { FaChartBar } from "react-icons/fa";
import Loader from "../components/Loader";
import ItemReportToolbar from "../components/item-report/ItemReportToolbar";
import ItemSummaryCard from "../components/item-report/ItemSummaryCard";
import ItemReportHistoryTable from "../components/item-report/ItemReportHistoryTable";
import "./PersonnelReportPage.css"; // Stil benzerliği için yeniden kullanıyoruz
import "./AssignmentsPage.css";

const ItemReportPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
  const reportRef = useRef();

  // --- React Query ile Veri Çekme ---
  const {
    data: reportData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["itemReport", submittedSearchTerm],
    queryFn: async () => {
      // Bu endpoint, bir demirbaş/seri no'ya ait tüm zimmetleri getirmeli
      const { data } = await axiosInstance.get("/assignments/search", {
        params: { itemKeyword: submittedSearchTerm },
      });
      return data;
    },
    enabled: !!submittedSearchTerm,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSubmittedSearchTerm(searchTerm);
  };

  const handlePrint = () => {
    window.print();
  };

  // Gelen veriyi işleyelim
  const item = reportData?.item || null;
  const assignments = reportData?.assignments || [];
  const noResultsFound =
    !isLoading && submittedSearchTerm && (!reportData || !item);

  return (
    <div className="page-container">
      <div className="page-header no-print">
        <h1>
          <FaChartBar style={{ color: "var(--secondary-color)" }} /> Eşya Raporu
        </h1>
      </div>

      <ItemReportToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        loading={isLoading}
        showPrintButton={!!item}
        handlePrint={handlePrint}
      />

      {isError && <p className="error-message no-print">{error.message}</p>}

      {isLoading && <Loader />}

      {noResultsFound && (
        <p>"{submittedSearchTerm}" kriterine uygun eşya bulunamadı.</p>
      )}

      {item && (
        <div ref={reportRef}>
          <ItemSummaryCard item={item} assignmentCount={assignments.length} />
          <ItemReportHistoryTable assignments={assignments} />
        </div>
      )}
    </div>
  );
};

export default ItemReportPage;
