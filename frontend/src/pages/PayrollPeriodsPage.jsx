import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaFolderOpen, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import Button from "../components/shared/Button";
import Modal from "../components/shared/Modal";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const PeriodStatusBadge = ({ status }) => {
  const statusMap = {
    Açık: "status-success",
    İşleniyor: "status-warning",
    Kilitli: "status-dark",
  };
  return <span className={`status-badge ${statusMap[status]}`}>{status}</span>;
};

const PayrollPeriodsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("all"); // 'all' veya şirket ID'si
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const {
    data: periods = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["payrollPeriods", selectedCompany],
    queryFn: () => {
      const params =
        selectedCompany !== "all" ? { company: selectedCompany } : {};
      return axiosInstance
        .get("/payroll/periods", { params })
        .then((res) => res.data);
    },
  });

  // Şirketleri (lokasyonları) çekmek için query
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locationsForSelection"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/locations/for-selection");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 dakika cache'le
  });

  const createPeriodMutation = useMutation({
    mutationFn: (newPeriod) =>
      axiosInstance.post("/payroll/periods", newPeriod),
    onSuccess: () => {
      toast.success("Yeni bordro dönemi başarıyla oluşturuldu.");
      queryClient.invalidateQueries(["payrollPeriods"]);
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Dönem oluşturulurken bir hata oluştu."
      );
    },
  });

  const onSubmit = (data) => {
    createPeriodMutation.mutate({
      year: parseInt(data.year),
      month: parseInt(data.month),
      company: data.company,
    });
  };

  const openModal = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    reset({ year: currentYear, month: currentMonth, company: "" });
    setIsModalOpen(true);
  };

  if (isLoading) return <Loader />;
  if (isError)
    return <div className="text-danger">Bordro dönemleri yüklenemedi.</div>;

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString("tr", { month: "long" }),
  }));

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <FaFolderOpen className="text-secondary text-2xl" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
            Bordro Dönemleri
          </h1>
        </div>
        <Button onClick={openModal}>
          <FaPlus className="mr-2" /> Yeni Dönem Oluştur
        </Button>
      </div>

      {/* Şirket Filtreleme Sekmeleri */}
      <div className="mb-6 border-b border-border flex items-center gap-2">
        <button
          onClick={() => setSelectedCompany("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedCompany === "all"
              ? "border-b-2 border-primary text-primary"
              : "text-text-light hover:text-text-main"
          }`}
        >
          Tümü
        </button>
        {locations.map((loc) => (
          <button
            key={loc._id}
            onClick={() => setSelectedCompany(loc._id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedCompany === loc._id
                ? "border-b-2 border-primary text-primary"
                : "text-text-light hover:text-text-main"
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {periods.map((period) => (
          <div
            key={period._id}
            className="bg-background-soft p-4 rounded-lg shadow border border-border cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate(`/payroll-periods/${period._id}`)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-text-main">
                {period.name}
              </h3>
              <PeriodStatusBadge status={period.status} />
            </div>
            <p className="text-sm text-primary font-semibold mt-1">
              {period.company?.name}
            </p>
            <p className="text-sm text-text-light mt-2">
              {period.payrollCount} Bordro
            </p>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Bordro Dönemi"
        variant="form"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              form="new-period-form"
              disabled={createPeriodMutation.isLoading}
            >
              {createPeriodMutation.isLoading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        }
      >
        <form
          id="new-period-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="label-form">
                Yıl
              </label>
              <select id="year" {...register("year")} className="input w-full">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="month" className="label-form">
                Ay
              </label>
              <select
                id="month"
                {...register("month")}
                className="input w-full"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="company" className="label-form">
              Şirket
            </label>
            <select
              id="company"
              {...register("company", {
                required: "Şirket seçimi zorunludur.",
              })}
              className={`input w-full ${
                errors.company ? "border-danger" : ""
              }`}
              disabled={locationsLoading}
            >
              <option value="">Şirket Seçiniz...</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
            {errors.company && (
              <p className="text-danger text-xs mt-1">
                {errors.company.message}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PayrollPeriodsPage;
