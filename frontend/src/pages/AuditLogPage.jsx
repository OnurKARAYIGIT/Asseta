import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaHistory } from "react-icons/fa";
import { registerLocale } from "react-datepicker";
import * as XLSX from "xlsx";
import { tr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import AuditLogToolbar from "../components/audit-log/AuditLogToolbar";
import AuditLogTimeline from "../components/audit-log/AuditLogTimeline";
import AuditLogPagination from "../components/audit-log/AuditLogPagination";

registerLocale("tr", tr); // Türkçe yerelleştirmeyi kaydet

const AuditLogPage = () => {
  // Filtreleme state'leri
  const [filters, setFilters] = useState({
    userId: "",
    startDate: "",
    endDate: "",
  });

  // Sayfalama state'leri
  const [currentPage, setCurrentPage] = useState(1);

  // --- React Query ile Veri Çekme ---

  // 1. Denetim Kayıtları
  const {
    data: logsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["auditLogs", { filters, currentPage }],
    queryFn: async () => {
      const params = { ...filters, page: currentPage, limit: 15 };
      const { data } = await axiosInstance.get("/audit-logs", { params });
      return data;
    },
    keepPreviousData: true,
  });

  // 2. Filtre için Kullanıcı Listesi
  const { data: users = [] } = useQuery({
    queryKey: ["auditLogUsers"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/audit-logs/users");
      return data;
    },
    staleTime: 1000 * 60 * 10, // Kullanıcı listesi 10 dakika boyunca taze kabul edilsin
  });

  // React Query'den gelen verileri bileşenin kullanacağı değişkenlere ata
  const logs = logsData?.logs || [];
  const totalPages = logsData?.pages || 1;

  // Kayıtları tarihe göre gruplayan ve "Bugün", "Dün" gibi başlıklar ekleyen fonksiyon
  const groupLogsByDate = (logs) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toLocaleDateString("tr-TR");
    const yesterdayStr = yesterday.toLocaleDateString("tr-TR");

    return logs.reduce((acc, log) => {
      const logDate = new Date(log.createdAt);
      const logDateStr = logDate.toLocaleDateString("tr-TR");

      let dateKey;
      if (logDateStr === todayStr) {
        dateKey = "Bugün";
      } else if (logDateStr === yesterdayStr) {
        dateKey = "Dün";
      } else {
        dateKey = logDate.toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(log);
      return acc;
    }, {});
  };

  // Veri değiştiğinde gruplamayı yeniden hesaplamak için useMemo kullan
  const groupedLogs = useMemo(() => groupLogsByDate(logs), [logs]);

  const handleFilterChange = (e) => {
    setCurrentPage(1); // Filtre değiştiğinde ilk sayfaya dön
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ userId: "", startDate: "", endDate: "" });
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setCurrentPage(1); // Filtre değiştiğinde ilk sayfaya dön
    setFilters({
      ...filters,
      // Tarihleri backend'in beklediği YYYY-MM-DD formatına çevir
      startDate: start ? start.toISOString().split("T")[0] : "",
      endDate: end ? end.toISOString().split("T")[0] : "",
    });
  };

  // Herhangi bir filtre aktif mi kontrolü
  const isFilterActive = filters.userId || filters.startDate || filters.endDate;

  const handleExport = () => {
    // Not: Bu export sadece mevcut sayfadaki verileri dışa aktarır.
    // Tüm verileri aktarmak için ayrı bir API isteği gerekebilir.
    // Şimdilik mevcut davranış korunmuştur.
    if (logs.length === 0) {
      return;
    }
    const dataToExport = logs.map((log) => ({
      Kullanıcı: log.user?.username || "Sistem",
      İşlem: log.action.replace(/_/g, " "),
      Detaylar: log.details,
      Tarih: new Date(log.createdAt).toLocaleString("tr-TR"),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "0056B3" } },
    };
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      ws[XLSX.utils.encode_cell({ r: 0, c: C })].s = headerStyle;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Denetim Kayıtları");
    XLSX.writeFile(wb, "Denetim_Kayitlari.xlsx");
  };

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6 print:hidden">
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

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="text-red-500">{error.message}</p>
      ) : (
        <>
          <AuditLogTimeline groupedLogs={groupedLogs} />
          <AuditLogPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};
export default AuditLogPage;
