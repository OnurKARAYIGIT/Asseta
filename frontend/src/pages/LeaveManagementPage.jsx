import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import {
  FaCalendarCheck,
  FaCheck,
  FaFilter,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";
import Loader from "../components/Loader";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Button from "../components/shared/Button";
import ConfirmationModal from "../components/shared/ConfirmationModal";
import Select from "react-select";

const LeaveStatusBadge = ({ status }) => {
  const statusMap = {
    Beklemede: "status-warning",
    Onaylandı: "status-success",
    Reddedildi: "status-danger",
  };
  return <span className={`status-badge ${statusMap[status]}`}>{status}</span>;
};

const LeaveManagementPage = () => {
  const queryClient = useQueryClient();
  const [actionToConfirm, setActionToConfirm] = useState(null); // { action: 'approve' | 'reject', leave: {...} }
  const [rejectionReason, setRejectionReason] = useState("");
  const [filterStatus, setFilterStatus] = useState("Beklemede"); // Filtreleme için state
  const [personnelFilter, setPersonnelFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });

  const {
    data: leaves = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["allLeaves"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/leaves");
      return data;
    },
  });

  // Personel listesini filtre için çek
  const { data: personnelOptions, isLoading: personnelLoading } = useQuery({
    queryKey: ["personnelForSelection"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/personnel/for-selection");
      // Seçeneklere "Tüm Personeller" ekle
      return [
        { value: null, label: "Tüm Personeller" },
        ...data.map((p) => ({ value: p._id, label: p.fullName })),
      ];
    },
    staleTime: 1000 * 60 * 5, // 5 dakika cache'le
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ leaveId, status, reason }) =>
      axiosInstance.put(`/leaves/${leaveId}/status`, {
        status,
        rejectionReason: reason,
      }),
    onSuccess: (data) => {
      toast.success(
        `İzin talebi başarıyla "${data.data.status}" olarak güncellendi.`
      );
      queryClient.invalidateQueries({ queryKey: ["allLeaves"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaves"] }); // Kullanıcının kendi sayfasını da yenile
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "İşlem sırasında bir hata oluştu."
      );
    },
    onSettled: () => {
      setActionToConfirm(null);
      setRejectionReason("");
    },
  });

  const handleConfirmAction = () => {
    if (!actionToConfirm) return;

    const { action, leave } = actionToConfirm;
    let status;
    let reason = null;

    if (action === "approve") {
      status = "Onaylandı";
    } else if (action === "reject") {
      if (!rejectionReason.trim()) {
        toast.warn("Reddetme nedeni belirtmek zorunludur.");
        return;
      }
      status = "Reddedildi";
      reason = rejectionReason;
    }

    updateStatusMutation.mutate({ leaveId: leave._id, status, reason });
  };

  if (isLoading) return <Loader />;
  if (isError)
    return <div className="text-danger">İzin talepleri yüklenemedi.</div>;

  const handleClearFilters = () => {
    setPersonnelFilter(null);
    setDateFilter({ startDate: "", endDate: "" });
  };

  // Filtreleme mantığı
  const filteredLeaves = leaves.filter((leave) => {
    const statusMatch =
      filterStatus === "Tümü" ? true : leave.status === filterStatus;

    const personnelMatch = personnelFilter
      ? leave.personnel?._id === personnelFilter.value
      : true;

    const dateMatch = () => {
      if (!dateFilter.startDate && !dateFilter.endDate) return true;
      const leaveStart = parseISO(leave.startDate);
      const leaveEnd = parseISO(leave.endDate);
      const filterStart = dateFilter.startDate
        ? new Date(dateFilter.startDate)
        : null;
      const filterEnd = dateFilter.endDate
        ? new Date(dateFilter.endDate)
        : null;

      if (filterStart && leaveEnd < filterStart) return false;
      if (filterEnd && leaveStart > filterEnd) return false;
      return true;
    };

    return statusMatch && personnelMatch && dateMatch();
  });
  const TABS = ["Beklemede", "Onaylandı", "Reddedildi", "Tümü"];

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <FaCalendarCheck className="text-secondary text-2xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          İzin Yönetimi
        </h1>
      </div>

      {/* Tab Bar */}
      <div className="mb-6">
        <div className="inline-flex items-center p-1 space-x-1 bg-background-soft rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                filterStatus === tab
                  ? "bg-primary text-white shadow"
                  : "text-text-light hover:bg-background-light hover:text-text-main"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Gelişmiş Filtreleme Çubuğu */}
      <div className="mb-6 p-4 bg-background-soft rounded-lg shadow-sm border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          {/* Personel Filtresi */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium mb-1">Personel</label>
            <Select
              options={personnelOptions}
              isLoading={personnelLoading}
              value={personnelFilter}
              onChange={setPersonnelFilter}
              placeholder="Personele göre filtrele..."
              isClearable
              classNamePrefix="react-select"
            />
          </div>

          {/* Tarih Filtresi */}
          <div className="md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              />
            </div>
          </div>

          {/* Filtreleri Temizle Butonu */}
          <div className="flex items-center justify-end">
            <Button variant="secondary" onClick={handleClearFilters}>
              <FaTimesCircle className="mr-2" /> Filtreleri Temizle
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-background rounded-lg shadow border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-light-gray">
            <tr>
              <th className="th-cell">Personel</th>
              <th className="th-cell">İzin Türü</th>
              <th className="th-cell">Tarih Aralığı</th>
              <th className="th-cell">Açıklama</th>
              <th className="th-cell">Durum</th>
              <th className="th-cell text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave) => (
                <tr
                  key={leave._id}
                  className="hover:bg-background-soft transition-colors"
                >
                  <td className="td-cell font-medium text-center">
                    {leave.personnel?.fullName || "Bilinmeyen"}
                    <span className="block text-xs text-text-light">
                      {leave.personnel?.employeeId}
                    </span>
                  </td>
                  <td className="td-cell text-center">{leave.leaveType}</td>
                  <td className="td-cell text-center">
                    {format(new Date(leave.startDate), "dd.MM.yy")} -{" "}
                    {format(new Date(leave.endDate), "dd.MM.yy")}
                  </td>
                  <td
                    className="td-cell max-w-xs truncate" // Açıklama sola hizalı kalmalı
                    title={leave.reason}
                  >
                    {leave.reason}
                  </td>
                  <td className="td-cell text-center">
                    <LeaveStatusBadge status={leave.status} />
                  </td>
                  <td className="td-cell">
                    {leave.status === "Beklemede" && (
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() =>
                            setActionToConfirm({ action: "approve", leave })
                          }
                        >
                          <FaCheck />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setActionToConfirm({ action: "reject", leave })
                          }
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-8 text-center text-text-light">
                  {leaves.length > 0
                    ? "Bu filtrelerle eşleşen bir izin talebi bulunamadı."
                    : "Yönetilecek izin talebi bulunmuyor."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={!!actionToConfirm}
        onClose={() => setActionToConfirm(null)}
        onConfirm={handleConfirmAction}
        title={`İzin Talebini ${
          actionToConfirm?.action === "approve" ? "Onayla" : "Reddet"
        }`}
        confirmText={`Evet, ${
          actionToConfirm?.action === "approve" ? "Onayla" : "Reddet"
        }`}
        confirmButtonVariant={
          actionToConfirm?.action === "approve" ? "success" : "danger"
        }
        isLoading={updateStatusMutation.isLoading}
      >
        <p>
          <strong>{actionToConfirm?.leave.personnel.fullName}</strong> adlı
          personelin izin talebini{" "}
          <strong>
            {actionToConfirm?.action === "approve" ? "onaylamak" : "reddetmek"}
          </strong>{" "}
          istediğinizden emin misiniz?
        </p>
        {actionToConfirm?.action === "reject" && (
          <div className="mt-4">
            <label htmlFor="rejectionReason" className="label-form">
              Reddetme Nedeni (Zorunlu)
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-form w-full min-h-[80px]"
              rows="3"
              placeholder="Lütfen talebin neden reddedildiğini açıklayın..."
            />
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
};

export default LeaveManagementPage;
