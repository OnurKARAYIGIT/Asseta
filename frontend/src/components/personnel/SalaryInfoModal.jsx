import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import { FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

const SalaryInfoModal = ({ isOpen, onClose, onSubmit, personnel }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Bileşen ekleme formu için ayrı bir form yönetimi
  const {
    register: registerComponent,
    handleSubmit: handleComponentSubmit,
    reset: resetComponentForm,
    formState: { errors: componentErrors },
  } = useForm({
    defaultValues: { name: "", amount: "", type: "Kazanç" },
  });

  // Maaş bileşenlerini çekmek için query
  const { data: components = [] } = useQuery({
    queryKey: ["salaryComponents", personnel?._id],
    queryFn: () =>
      axiosInstance
        .get(`/personnel/${personnel._id}/components`)
        .then((res) => res.data),
    enabled: !!personnel?._id && isOpen, // Sadece modal açıkken ve personel varken çalış
  });

  // Bileşen silme mutasyonu
  const deleteComponentMutation = useMutation({
    mutationFn: (componentId) =>
      axiosInstance.delete(
        `/personnel/${personnel._id}/components/${componentId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["salaryComponents", personnel?._id]);
    },
  });

  // Yeni bileşen ekleme mutasyonu
  const addComponentMutation = useMutation({
    mutationFn: (newComponent) =>
      axiosInstance.post(
        `/personnel/${personnel._id}/components`,
        newComponent
      ),
    onSuccess: () => {
      toast.success("Bileşen başarıyla eklendi.");
      queryClient.invalidateQueries(["salaryComponents", personnel?._id]);
      resetComponentForm(); // Bileşen formunu sıfırla
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Bileşen eklenirken bir hata oluştu."
      );
    },
  });

  useEffect(() => {
    if (isOpen && personnel) {
      reset({
        grossSalary: personnel.salaryInfo?.grossSalary || 0,
        currency: personnel.salaryInfo?.currency || "TRY",
      });
    }
  }, [isOpen, personnel, reset]);

  const handleFormSubmit = (data) => {
    // Gelen veriyi sayıya çevir
    const payload = {
      ...data,
      grossSalary: parseFloat(data.grossSalary) || 0,
    };
    onSubmit(payload);
  };

  const earnings = components.filter((c) => c.type === "Kazanç");
  const deductions = components.filter((c) => c.type === "Kesinti");

  // Bileşen ekleme formunu gönderen fonksiyon
  const onComponentFormSubmit = (data) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount) || 0,
    };
    addComponentMutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${personnel?.fullName} - Maaş Bilgileri`}
      size="lg"
    >
      {/* 
        Tüm modal içeriğini tek bir form içine alıyoruz. 
        Ana "Kaydet" butonu sadece brüt maaşı günceller.
      */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="grossSalary" className="block text-sm font-medium">
              Brüt Maaş
            </label>
            <input
              id="grossSalary"
              type="number"
              step="0.01"
              {...register("grossSalary", {
                required: "Brüt maaş zorunludur.",
                valueAsNumber: true,
                min: { value: 0, message: "Maaş negatif olamaz." },
              })}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
            {errors.grossSalary && (
              <p className="text-danger text-xs mt-1">
                {errors.grossSalary.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium">
              Para Birimi
            </label>
            <select
              id="currency"
              {...register("currency")}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            >
              <option value="TRY">TRY (Türk Lirası)</option>
              <option value="USD">USD (Amerikan Doları)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
        </div>

        {/* Maaş Bileşenleri */}
        <div className="border-t border-border pt-4 mt-4">
          <h4 className="text-md font-semibold mb-2">Ek Kazanç & Kesintiler</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kazançlar */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-success">Kazançlar</h5>
              {earnings.length > 0 ? (
                earnings.map((c) => (
                  <div
                    key={c._id}
                    className="flex justify-between items-center bg-background-soft p-2 rounded"
                  >
                    <span>{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {c.amount.toLocaleString("tr-TR")}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteComponentMutation.mutate(c._id)}
                        className="text-danger/70 hover:text-danger"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-light p-2">Ek kazanç yok.</p>
              )}
            </div>
            {/* Kesintiler */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-danger">Kesintiler</h5>
              {deductions.length > 0 ? (
                deductions.map((c) => (
                  <div
                    key={c._id}
                    className="flex justify-between items-center bg-background-soft p-2 rounded"
                  >
                    <span>{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {c.amount.toLocaleString("tr-TR")}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteComponentMutation.mutate(c._id)}
                        className="text-danger/70 hover:text-danger"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-light p-2">Kesinti yok.</p>
              )}
            </div>
          </div>
        </div>
        {/* Yeni Bileşen Ekleme Formu */}
        <div
          onSubmit={handleComponentSubmit(onComponentFormSubmit)}
          className="border-t border-border pt-4 mt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label
                htmlFor="componentName" // Bu form artık kendi başına bir form değil, bir div.
                className="block text-sm font-medium"
              >
                Bileşen Adı
              </label>
              <input
                id="componentName"
                {...registerComponent("name", { required: true })}
                className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                placeholder="Yol Yardımı, Yemek Kartı..."
              />
            </div>
            <div>
              <label
                htmlFor="componentAmount"
                className="block text-sm font-medium"
              >
                Tutar
              </label>
              <input
                id="componentAmount"
                type="number"
                step="0.01"
                {...registerComponent("amount", {
                  required: true,
                  valueAsNumber: true,
                })}
                className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                id="componentType"
                {...registerComponent("type")} // Bu select'in stili eksikti.
                className="input w-full"
              >
                <option value="Kazanç">Kazanç</option>
                <option value="Kesinti">Kesinti</option>
              </select>
              <Button
                type="button" // Formu göndermemesi için 'button' tipinde olmalı
                onClick={handleComponentSubmit(onComponentFormSubmit)} // onClick ile tetiklenmeli
                variant="success"
                size="sm"
                className="h-10"
                disabled={addComponentMutation.isLoading}
                title="Yeni bileşen ekle"
              >
                <FaPlus />
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="button" // Bu da artık 'button' tipinde
            variant="primary"
            disabled={isSubmitting}
            onClick={handleSubmit(handleFormSubmit)} // Ana formu onClick ile gönder
          >
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SalaryInfoModal;
