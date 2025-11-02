import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { FaUserClock, FaFilter, FaTimes } from "react-icons/fa";
import Loader from "../components/Loader";
import { format } from "date-fns";
import { tr as trLocale } from "date-fns/locale";
import Select from "react-select";
import Button from "../components/shared/Button";
import Pagination from "../components/shared/Pagination";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("tr", trLocale);

// Bileşen dışında tanımlanan yardımcı fonksiyon, gereksiz yeniden oluşturmaları önler.
const formatDuration = (minutes) => {
  if (minutes === null || isNaN(minutes) || minutes <= 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} sa ${mins} dk`;
};

const AttendanceRecordsPage = () => {
  const [filters, setFilters] = useState({
    personnel: null, // react-select için null daha uygun
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Personel listesini çeken sorgu (Select kutusu için)
  const { data: personnelOptions } = useQuery({
    queryKey: ["personnelForSelection"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/personnel/for-selection");
      return data.map((p) => ({ value: p._id, label: p.fullName }));
    },
    staleTime: Infinity, // Bu veri nadiren değişir, cache'de uzun süre tutabiliriz.
  });

  const {
    data: attendanceData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["allAttendanceRecords", { filters, currentPage, itemsPerPage }],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        personnelId: filters.personnel?.value || undefined,
      };
      const { data } = await axiosInstance.get("/attendance/", {
        params,
      });
      return data;
    },
    keepPreviousData: true,
  });

  const records = attendanceData?.records || [];
  const totalPages = attendanceData?.pages || 1;
  const totalRecords = attendanceData?.total || 0;

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Filtre değiştiğinde ilk sayfaya dön
  };

  const clearFilters = () => {
    setFilters({
      personnel: null,
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1); // Filtreler temizlendiğinde ilk sayfaya dön
  };

  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    setFilters((prev) => ({
      ...prev,
      startDate: start ? start.toISOString().split("T")[0] : "",
      endDate: end ? end.toISOString().split("T")[0] : "",
    }));
    setCurrentPage(1);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="text-center text-danger">
        Hata: {error.response?.data?.message || error.message}
      </div>
    );
  }

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <FaUserClock className="text-secondary text-2xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          Mesai Kayıtları Raporu
        </h1>
      </div>

      {/* --- FİLTRELEME BÖLÜMÜ --- */}
      <div className="mb-6 p-4 bg-background-soft border border-border rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="label-form" htmlFor="personnel-filter">
              Personel
            </label>
            <Select
              id="personnel-filter"
              options={personnelOptions}
              value={filters.personnel}
              onChange={(option) => handleFilterChange("personnel", option)}
              isClearable
              placeholder="Personel ara veya seç..."
              classNamePrefix="react-select"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="label-form" htmlFor="date-range">
              Tarih Aralığı
            </label>
            <DatePicker
              id="date-range"
              selectsRange={true}
              startDate={filters.startDate ? new Date(filters.startDate) : null}
              endDate={filters.endDate ? new Date(filters.endDate) : null}
              onChange={handleDateRangeChange}
              isClearable={true}
              className="input-form"
              dateFormat="dd/MM/yyyy"
              locale="tr"
              placeholderText="Başlangıç - Bitiş Tarihi"
            />
          </div>
          <div className="lg:col-span-1">
            <Button
              variant="secondary"
              onClick={clearFilters}
              className="w-full"
            >
              <FaTimes className="mr-2" /> Temizle
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-2">
        <div className="text-sm text-text-light whitespace-nowrap">
          Toplam <strong>{totalRecords}</strong> kayıt bulundu
        </div>
      </div>

      <div className="overflow-x-auto bg-background rounded-lg shadow border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-light-gray">
            <tr>
              <th className="th-cell">Personel</th>
              <th className="th-cell">Giriş (Check-in)</th>
              <th className="th-cell">Çıkış (Check-out)</th>
              <th className="th-cell">Çalışma Süresi</th>
              <th className="th-cell">Fazla Mesai</th>
              <th className="th-cell">Durum</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record) => (
                <tr
                  key={record._id}
                  className="hover:bg-background-soft transition-colors"
                >
                  <td className="td-cell">
                    {record.personnel?.fullName || "Bilinmeyen Personel"}
                    <span className="block text-xs text-text-light">
                      {record.personnel?.employeeId}
                    </span>
                  </td>
                  <td className="td-cell">
                    {format(
                      new Date(record.checkIn),
                      "dd MMMM yyyy, HH:mm:ss",
                      {
                        locale: trLocale,
                      }
                    )}
                  </td>
                  <td className="td-cell">
                    {record.checkOut
                      ? format(
                          new Date(record.checkOut),
                          "dd MMMM yyyy, HH:mm:ss",
                          {
                            locale: trLocale,
                          }
                        )
                      : "Henüz Çıkış Yapılmadı"}
                  </td>
                  <td className="td-cell">
                    {formatDuration(record.workDuration)}
                  </td>
                  <td className="td-cell text-orange-500">
                    {formatDuration(record.overtime)}
                  </td>
                  <td className="td-cell">
                    <span
                      className={`status-badge ${
                        record.status === "Tamamlandı"
                          ? "status-success"
                          : "status-warning animate-pulse"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-8 text-center text-text-light">
                  Filtre kriterlerine uygun mesai kaydı bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalRecords}
      />
    </div>
  );
};

export default AttendanceRecordsPage;
