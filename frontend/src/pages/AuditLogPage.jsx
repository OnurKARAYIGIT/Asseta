import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import {
  FaHistory,
  FaTimes,
  FaFileExcel,
  FaTrash,
  FaPlusCircle,
  FaEdit,
  FaSignInAlt,
  FaKey,
  FaClock,
} from "react-icons/fa";
import "./AuditLogPage.css"; // Yeni CSS dosyasını import et
import DatePicker, { registerLocale } from "react-datepicker";
import * as XLSX from "xlsx";
import { tr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import "./AssignmentsPage.css"; // Mevcut tablo ve filtre stillerini kullan

registerLocale("tr", tr); // Türkçe yerelleştirmeyi kaydet

const getActionIcon = (action) => {
  if (action.includes("SİLİNDİ") || action.includes("REDDET")) {
    return { icon: <FaTrash />, color: "var(--danger-color)" };
  }
  if (action.includes("OLUŞTURULDU") || action.includes("EKLENDİ")) {
    return { icon: <FaPlusCircle />, color: "var(--success-color)" };
  }
  if (action.includes("GÜNCELLENDİ") || action.includes("ONAYLANDI")) {
    return { icon: <FaEdit />, color: "var(--info-color)" };
  }
  if (action.includes("GİRİŞ")) {
    return { icon: <FaSignInAlt />, color: "var(--primary-color)" };
  }
  if (action.includes("ŞİFRE")) {
    return { icon: <FaKey />, color: "#e67e22" };
  }
  // Varsayılan ikon
  return { icon: <FaHistory />, color: "var(--text-color-light)" };
};

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [groupedLogs, setGroupedLogs] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtreleme state'leri
  const [filters, setFilters] = useState({
    userId: "",
    startDate: "",
    endDate: "",
  });

  // Sayfalama state'leri
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = {
          ...filters,
          page: currentPage,
          limit: 15, // Sabit bir limit kullanalım
        };
        const { data } = await axiosInstance.get("/audit-logs", {
          params,
        });
        setLogs(data.logs);
        setGroupedLogs(groupLogsByDate(data.logs)); // Veriyi tarihe göre grupla
        setTotalPages(data.pages);
      } catch (err) {
        setError("Denetim kayıtları getirilemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filters, currentPage]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axiosInstance.get("/audit-logs/users");
        setUsers(data);
      } catch (err) {
        console.error("Kullanıcılar getirilemedi:", err);
      }
    };
    fetchUsers();
  }, []);

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

  return (
    <div className="page-container">
      <h1>
        <FaHistory style={{ color: "var(--secondary-color)" }} /> Denetim
        Kayıtları
      </h1>

      <div className="filter-toolbar">
        <div className="toolbar-group">
          <select
            name="userId"
            value={filters.userId}
            onChange={handleFilterChange}
          >
            <option value="">Tüm Kullanıcılar</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.username}
              </option>
            ))}
          </select>
          <DatePicker
            selectsRange={true}
            startDate={filters.startDate ? new Date(filters.startDate) : null}
            endDate={filters.endDate ? new Date(filters.endDate) : null}
            onChange={handleDateChange}
            isClearable={true}
            placeholderText="Tarih aralığı seçin"
            dateFormat="dd/MM/yyyy"
            maxDate={new Date()} // Gelecekteki tarihlerin seçilmesini engelle
            locale="tr" // Takvimi Türkçe yap
            popperClassName="datepicker-popper" // Açılır panele özel sınıf
            className="date-picker-input" // Gerekirse özel stil için
          />
          {isFilterActive && (
            <button
              onClick={clearFilters}
              title="Filtreleri Temizle"
              style={{ backgroundColor: "var(--secondary-color)" }}
            >
              <FaTimes />
            </button>
          )}
        </div>
        <div className="toolbar-group">
          <button
            onClick={handleExport}
            style={{
              backgroundColor: "#1D6F42",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FaFileExcel />
            Excel'e Aktar
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <div className="timeline-container">
            {Object.keys(groupedLogs).length > 0 ? (
              Object.keys(groupedLogs).map((date) => (
                <div key={date} className="timeline-group">
                  <h2 className="timeline-date-header">{date}</h2>
                  <div className="timeline">
                    {groupedLogs[date].map((log) => {
                      const { icon, color } = getActionIcon(log.action);
                      return (
                        <div key={log._id} className="timeline-item">
                          <div className="timeline-icon" style={{ color }}>
                            {icon}
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="timeline-user">
                                {log.user?.username || "Sistem"}
                              </span>
                              <span className="timeline-action-type">
                                {log.action.replace(/_/g, " ")}
                              </span>
                              <span className="timeline-time">
                                <FaClock />
                                {new Date(log.createdAt).toLocaleTimeString(
                                  "tr-TR",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                            <p className="timeline-details">{log.details}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p>Filtre kriterlerine uygun denetim kaydı bulunamadı.</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="pagination no-print">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                &laquo;&laquo;
              </button>
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
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                &raquo;&raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default AuditLogPage;
