import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Select from "react-select";

const JobOpeningModal = ({ isOpen, onClose, onSubmit, mode, currentItem }) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  const isEditMode = mode === "edit";

  // Şirketleri (Lokasyonları) select box için çek
  const { data: companyOptions, isLoading: companiesLoading } = useQuery({
    queryKey: ["locationsForSelection"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/locations/for-selection");
      return data.map((c) => ({ value: c._id, label: c.name }));
    },
    staleTime: 1000 * 60 * 5, // 5 dakika cache'le
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && currentItem) {
        const defaultCompany = companyOptions?.find(
          (opt) => opt.value === currentItem.company?._id
        );
        reset({
          ...currentItem,
          company: defaultCompany,
        });
      } else {
        reset({
          title: "",
          department: "",
          company: null,
          description: "",
          requirements: "",
          status: "Açık",
        });
      }
    }
  }, [isOpen, isEditMode, currentItem, reset, companyOptions]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      company: data.company?.value, // Sadece ID'yi gönder
    };
    if (isEditMode) {
      payload._id = currentItem._id;
    }
    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "İş İlanını Düzenle" : "Yeni İş İlanı Oluştur"}
      size="2xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              Pozisyon Adı
            </label>
            <input
              id="title"
              {...register("title", { required: "Pozisyon adı zorunludur" })}
              className="input mt-1 w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
            {errors.title && (
              <p className="text-danger text-xs mt-1">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium">
              Departman
            </label>
            <input
              id="department"
              {...register("department", { required: "Departman zorunludur" })}
              className="input mt-1 w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
            {errors.department && (
              <p className="text-danger text-xs mt-1">
                {errors.department.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium">
              Şirket / Konum
            </label>
            <Controller
              name="company"
              control={control}
              rules={{ required: "Şirket seçimi zorunludur" }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={companyOptions}
                  isLoading={companiesLoading}
                  className="mt-1"
                  classNamePrefix="react-select" // Bu, react-select'in iç elemanlarını stilize etmek için kullanılır
                />
              )}
            />
            {errors.company && (
              <p className="text-danger text-xs mt-1">
                {errors.company.message}
              </p>
            )}
          </div>
          {isEditMode && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium">
                Durum
              </label>
              <select
                id="status"
                {...register("status")}
                className="input mt-1 w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              >
                <option value="Açık">Açık</option>
                <option value="Dolduruldu">Dolduruldu</option>
                <option value="İptal Edildi">İptal Edildi</option>
              </select>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            İş Tanımı
          </label>
          <textarea
            id="description"
            {...register("description", { required: "İş tanımı zorunludur" })}
            className="input mt-1 min-h-[100px] w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            rows="4"
          ></textarea>
          {errors.description && (
            <p className="text-danger text-xs mt-1">
              {errors.description.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="requirements" className="block text-sm font-medium">
            Gereksinimler
          </label>
          <textarea
            id="requirements"
            {...register("requirements")}
            className="input mt-1 min-h-[100px] w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            rows="4"
          ></textarea>
        </div>
        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Kaydediliyor..."
              : isEditMode
              ? "Güncelle"
              : "Oluştur"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default JobOpeningModal;
