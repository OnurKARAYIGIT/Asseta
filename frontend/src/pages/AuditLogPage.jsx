import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaHistory } from "react-icons/fa";
import AuditLogTable from "../components/audit-log/AuditLogTable";
import AuditLogToolbar from "../components/audit-log/AuditLogToolbar.jsx";
import Pagination from "../components/shared/Pagination.jsx";
import * as XLSX from "xlsx";
import { useAuth } from "../components/AuthContext";

const AuditLogPage = () => {
  const [filters, setFilters] = useState({
    userId: "",
    startDate: null,
    endDate: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const { userInfo, hasPermission } = useAuth();

  // --- React Query ile Veri Çekme ---

  // 1. Denetim Kayıtları
  const {
    data: auditData,
    isLoading: auditLoading,
    isError: auditIsError,
    error: auditError,
  } = useQuery({
    queryKey: ["auditLogs", { currentPage, itemsPerPage, filters }],
    enabled: !!userInfo && hasPermission("audit-logs"), // userInfo'nun varlığını kontrol et
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters,
      };
      const { data } = await axiosInstance.get("/audit-logs", { params });
      return data;
    },
    keepPreviousData: true,
  });

  // 2. Kullanıcı Listesi (Filtre için)
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/users");
      // Kullanıcıları isme göre sırala
      return data.sort((a, b) =>
        a.personnel?.fullName.localeCompare(b.personnel?.fullName)
      );
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handleDateChange = ([start, end]) => {
    setFilters({ ...filters, startDate: start, endDate: end });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ userId: "", startDate: null, endDate: null });
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = auditData.logs.map((log) => ({
      Tarih: new Date(log.createdAt).toLocaleString("tr-TR"),
      Kullanıcı: log.user.username,
      "İşlem Türü": log.action,
      Detaylar: log.details,
      "IP Adresi": log.ipAddress,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Denetim Kayıtları");
    XLSX.writeFile(wb, "Denetim_Kayitlari.xlsx");
  };

  const isFilterActive = filters.userId || filters.startDate || filters.endDate;

  if (auditLoading || usersLoading) return <Loader />;
  if (auditIsError) return <p className="text-danger">{auditError.message}</p>;

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <FaHistory className="text-secondary text-2xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          Denetim Kayıtları
        </h1>
      </div>

      <AuditLogToolbar
        filters={filters}
        users={users}
        isFilterActive={isFilterActive}
        handleFilterChange={handleFilterChange}
        handleDateChange={handleDateChange}
        clearFilters={clearFilters}
        handleExport={handleExport}
      />

      <AuditLogTable logs={auditData?.logs || []} />

      <Pagination
        currentPage={currentPage}
        totalPages={auditData?.pages || 1}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default AuditLogPage;
