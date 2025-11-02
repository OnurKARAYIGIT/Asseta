import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaMoneyBillWave, FaPencilAlt } from "react-icons/fa";
import Select from "react-select";
import { toast } from "react-toastify";
import SalaryInfoModal from "../components/personnel/SalaryInfoModal";
import Button from "../components/shared/Button";
import Pagination from "../components/shared/Pagination";
import { calculateNetSalary } from "../utils/payrollCalculator"; // YENİ: Hesaplama fonksiyonunu import et

const PayrollManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [companyFilter, setCompanyFilter] = useState(null); // Şirket filtresi için state
  const [selectedPersonnel, setSelectedPersonnel] = useState(null); // Modal için seçilen personel

  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Şirketleri filtre için çek
  const { data: companyOptions, isLoading: companiesLoading } = useQuery({
    queryKey: ["companiesForFilter"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/locations/for-selection");
      // react-select formatına dönüştür
      return data.map((c) => ({ value: c._id, label: c.name }));
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
  });

  const {
    data: personnelData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "personnelList",
      { currentPage, debouncedSearchTerm, company: companyFilter?.value },
    ],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: 15,
        keyword: debouncedSearchTerm,
        company: companyFilter?.value, // Filtre değerini API'ye gönder
      };
      const { data } = await axiosInstance.get("/personnel/list", { params });
      return data;
    },
    keepPreviousData: true,
  });

  const updateSalaryMutation = useMutation({
    mutationFn: ({ personnelId, salaryData }) => {
      return axiosInstance.put(`/personnel/${personnelId}/salary`, salaryData);
    },
    onSuccess: () => {
      toast.success("Maaş bilgileri başarıyla güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["personnelList"] });
      setIsSalaryModalOpen(false); // Doğru state'i kapat
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Maaş güncellenirken bir hata oluştu."
      );
    },
  });

  const handleOpenModal = (personnel) => {
    setSelectedPersonnel(personnel);
    setIsSalaryModalOpen(true); // Doğru state'i aç
  };

  const handleSalarySubmit = (salaryData) => {
    if (!selectedPersonnel) return;
    updateSalaryMutation.mutate({
      personnelId: selectedPersonnel._id,
      salaryData,
    });
  };

  if (isLoading) return <Loader />;
  if (isError) return <p className="text-danger">{error.message}</p>;

  const { personnel = [], pages = 1, total = 0 } = personnelData;

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <FaMoneyBillWave className="text-secondary text-2xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          Maaş Yönetimi
        </h1>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <input
            type="text"
            placeholder="Personel ara (İsim, Sicil, E-posta...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>
        <div className="md:col-span-1">
          <Select
            options={companyOptions}
            isLoading={companiesLoading}
            value={companyFilter}
            onChange={setCompanyFilter}
            placeholder="Şirkete göre filtrele..."
            isClearable
            classNamePrefix="react-select"
          />
        </div>
      </div>

      <div className="flex justify-end mb-2">
        <div className="text-sm text-text-light whitespace-nowrap">
          Toplam <strong>{total}</strong> personel bulundu
        </div>
      </div>

      <div className="overflow-x-auto bg-background rounded-lg shadow border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-light-gray">
            <tr>
              <th className="th-cell">Personel</th>
              <th className="th-cell text-center">Departman</th>
              <th className="th-cell text-center">Pozisyon</th>
              <th className="th-cell text-right">Brüt Maaş</th>
              <th className="th-cell text-right">Toplam Kazanç</th>
              <th className="th-cell text-right">Net Maaş (Tahmini)</th>
              <th className="th-cell text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {personnel.map((p) => (
              <tr key={p._id} className="hover:bg-background-soft">
                <td className="td-cell font-medium">
                  {p.fullName}
                  <span className="block text-xs text-text-light">
                    {p.employeeId}
                  </span>
                </td>
                <td className="td-cell text-center">
                  {p.jobInfo?.department || "-"}
                </td>
                <td className="td-cell text-center">
                  {p.jobInfo?.position || "-"}
                </td>
                <td className="td-cell text-right font-mono">
                  {p.salaryInfo?.grossSalary?.toLocaleString("tr-TR") || "0.00"}{" "}
                  {p.salaryInfo?.currency || "TRY"}
                </td>
                <td className="td-cell text-right font-mono font-bold text-primary">
                  {p.salaryInfo?.totalEarnings?.toLocaleString("tr-TR") ||
                    "0.00"}{" "}
                  {p.salaryInfo?.currency || "TRY"}
                </td>
                <td className="td-cell text-right font-mono text-success">
                  {p.salaryInfo?.currency === "TRY"
                    ? calculateNetSalary(
                        p.salaryInfo?.grossSalary
                      ).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "-"}
                </td>
                <td className="td-cell text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(p)}
                  >
                    <FaPencilAlt />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={pages}
        onPageChange={setCurrentPage}
      />

      {selectedPersonnel && (
        <SalaryInfoModal
          isOpen={isSalaryModalOpen}
          onClose={() => setIsSalaryModalOpen(false)}
          onSubmit={handleSalarySubmit}
          personnel={selectedPersonnel}
        />
      )}
    </div>
  );
};

export default PayrollManagementPage;
