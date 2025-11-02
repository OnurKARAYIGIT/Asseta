import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaCalculator, FaChevronLeft, FaFileCsv } from "react-icons/fa";
import Button from "../components/shared/Button";
import ConfirmationModal from "../components/shared/ConfirmationModal";
import PayrollRecordDetailModal from "../components/payroll/PayrollRecordDetailModal";
import Select from "react-select";
import { toast } from "react-toastify";

const PayrollStatusBadge = ({ status }) => {
  const statusMap = {
    Hesaplanmadı: "status-dark",
    Hesaplandı: "status-info",
    Ödendi: "status-success",
    Hatalı: "status-danger",
  };
  return <span className={`status-badge ${statusMap[status]}`}>{status}</span>;
};

const PayrollPeriodDetailPage = () => {
  const { periodId } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); // Durum filtresi için state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState(null);

  const statusOptions = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "Hesaplandı", label: "Hesaplandı" },
    { value: "Hesaplanmadı", label: "Hesaplanmadı" },
  ];

  const {
    data = { period: {}, personnel: [] }, // Veri gelene kadar varsayılan boş obje ve dizi ata
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["payrollPeriodDetail", periodId, statusFilter?.value],
    queryFn: () => {
      const params = {
        payrollStatus: statusFilter?.value,
      };
      return axiosInstance
        .get(`/payroll/periods/${periodId}`, { params })
        .then((res) => res.data);
    },
    enabled: !!periodId,
  });

  // YENİ: Tek bir bordro kaydını çekmek için query
  const { data: payrollRecord, isLoading: isLoadingRecord } = useQuery({
    queryKey: ["payrollRecord", periodId, selectedPersonnelId],
    queryFn: () =>
      axiosInstance
        .get(
          `/payroll/records/find?periodId=${periodId}&personnelId=${selectedPersonnelId}`
        )
        .then((res) => res.data),
    enabled: !!selectedPersonnelId && isDetailModalOpen, // Sadece modal açıkken ve personel seçiliyken çalış
  });

  const generatePayrollsMutation = useMutation({
    mutationFn: () =>
      axiosInstance.post(`/payroll/periods/${periodId}/generate`),
    onSuccess: (response) => {
      toast.success(response.data.message);
      queryClient.invalidateQueries(["payrollPeriodDetail", periodId]);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          "Bordrolar oluşturulurken bir hata oluştu."
      );
    },
    onSettled: () => {
      setIsConfirmModalOpen(false);
    },
  });

  const handleGenerateAll = () => {
    if (!periodId) return;
    generatePayrollsMutation.mutate();
  };

  const handleExportCsv = async () => {
    try {
      const response = await axiosInstance.get(
        `/payroll/periods/${periodId}/export-csv`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const periodName = data?.period?.name.replace(/\s/g, "_") || "donem";
      link.setAttribute("download", `banka_odeme_listesi_${periodName}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "CSV dosyası oluşturulurken bir hata oluştu."
      );
    }
  };

  const handleOpenDetailModal = (personnelId) => {
    setSelectedPersonnelId(personnelId);
    setIsDetailModalOpen(true);
  };

  if (isLoading) return <Loader />;
  if (isError)
    return <div className="text-danger">Dönem detayları yüklenemedi.</div>;

  const { period, personnel } = data;

  const filteredPersonnel = (personnel || []).filter(
    (p) =>
      (p.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.employeeId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/payroll-periods"
            className="p-2 rounded-full hover:bg-background-soft"
          >
            <FaChevronLeft className="text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
              {period.name} Bordrosu
            </h1>
            <p className="text-sm text-text-light">
              {personnel.length} Personel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleExportCsv}
            disabled={period.status !== "Kilitli"}
          >
            <FaFileCsv className="mr-2" /> Banka Listesi (.csv)
          </Button>
          <Button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={
              period.status !== "Açık" || generatePayrollsMutation.isLoading
            }
          >
            <FaCalculator className="mr-2" /> Tüm Bordroları Oluştur
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <input
            type="text"
            placeholder="Personel ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>
        <div className="md:col-span-1">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Duruma göre filtrele..."
            classNamePrefix="react-select"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-background rounded-lg shadow border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-light-gray">
            <tr>
              <th className="th-cell">Personel</th>
              <th className="th-cell text-center">Departman</th>
              <th className="th-cell text-center">Pozisyon</th>
              <th className="th-cell text-center">Bordro Durumu</th>
              <th className="th-cell text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPersonnel.map((p) => (
              <tr key={p._id} className="hover:bg-background-soft">
                <td className="td-cell font-medium">
                  {p.fullName}
                  <span className="block text-xs text-text-light">
                    {p.employeeId}
                  </span>
                </td>
                <td className="td-cell text-center">{p.jobInfo?.department}</td>
                <td className="td-cell text-center">{p.jobInfo?.position}</td>
                <td className="td-cell text-center">
                  <PayrollStatusBadge status={p.payrollStatus} />
                </td>
                <td className="td-cell text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetailModal(p._id)}
                    disabled={p.payrollStatus === "Hesaplanmadı"}
                  >
                    Detay
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleGenerateAll}
        title="Tüm Bordroları Oluştur"
        confirmText="Evet, Oluştur"
        isLoading={generatePayrollsMutation.isLoading}
      >
        <p>
          <strong>{period.name}</strong> dönemi için tüm aktif personellerin
          bordrolarını oluşturmak istediğinizden emin misiniz? Bu işlem sonrası
          dönem kilitlenecektir ve maaş bilgileri değiştirilemez.
        </p>
      </ConfirmationModal>

      <PayrollRecordDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        record={payrollRecord}
        isLoading={isLoadingRecord}
      />
    </div>
  );
};

export default PayrollPeriodDetailPage;
