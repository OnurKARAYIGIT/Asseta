import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { tr } from "date-fns/locale";

// react-select'in modal üzerinde doğru görüntülenmesi için stil objesi
const selectMenuStyles = {
  menu: (provided) => ({ ...provided, zIndex: 9999 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const InterviewModal = ({ isOpen, onClose, onSubmit, application }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Personel listesini mülakatçı olarak seçmek için çek
  const { data: personnelOptions, isLoading: personnelLoading } = useQuery({
    queryKey: ["personnelForSelection"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/personnel/for-selection");
      return data.map((p) => ({ value: p._id, label: p.fullName }));
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        interviewType: "İK Mülakatı",
        scheduledDate: new Date(),
        interviewers: [],
      });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      application: application?._id,
      interviewers: data.interviewers.map((interviewer) => interviewer.value), // Sadece ID'leri gönder
    };
    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mülakat Planla"
      size="2xl" // Modalı daha geniş hale getirelim
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Sol Sütun */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="interviewType"
                className="block text-sm font-medium"
              >
                Mülakat Türü
              </label>
              <select
                id="interviewType"
                {...register("interviewType", {
                  required: "Bu alan zorunludur.",
                })}
                className="input mt-1 w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              >
                <option value="İK Mülakatı">İK Mülakatı</option>
                <option value="Teknik Mülakat">Teknik Mülakat</option>
                <option value="Yönetici Mülakatı">Yönetici Mülakatı</option>
                <option value="Grup Mülakatı">Grup Mülakatı</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="interviewers"
                className="block text-sm font-medium"
              >
                Mülakatçılar
              </label>
              <Controller
                name="interviewers"
                control={control}
                rules={{ required: "En az bir mülakatçı seçmelisiniz." }}
                render={({ field }) => (
                  <Select
                    {...field}
                    isMulti
                    options={personnelOptions}
                    isLoading={personnelLoading}
                    className="mt-1"
                    classNamePrefix="react-select"
                    placeholder="Mülakat yapacak kişileri seçin..."
                    menuPortalTarget={document.body} // Menüyü modal dışına render et
                    styles={selectMenuStyles} // z-index'i ayarla
                  />
                )}
              />
              {errors.interviewers && (
                <p className="text-danger text-xs mt-1">
                  {errors.interviewers.message}
                </p>
              )}
            </div>
          </div>

          {/* Sağ Sütun */}
          <div className="w-full flex flex-col">
            <label
              htmlFor="scheduledDate"
              className="block text-sm font-medium"
            >
              Mülakat Tarihi ve Saati
            </label>
            {/* Tarih ve Saat seçimi için Controller */}
            <Controller
              name="scheduledDate"
              control={control}
              rules={{ required: "Tarih ve saat seçimi zorunludur." }}
              render={({ field }) => (
                <DatePicker
                  selected={field.value}
                  onChange={(date) => field.onChange(date)}
                  inline // Takvimi her zaman açık göster
                  locale={tr}
                  className="input w-full" // Bu sınıf artık doğrudan etkili değil ama tutarlılık için kalabilir
                  calendarClassName="w-full border-none" // Takvimin tam genişlikte olmasını ve kenarlıksız olmasını sağla
                  wrapperClassName="w-full mt-1" // DatePicker sarmalayıcısını tam genişlik yap
                />
              )}
            />
            {/* Saat Seçimi için ayrı bir Controller */}
            <Controller
              name="scheduledDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  selected={field.value}
                  onChange={(date) => field.onChange(date)}
                  showTimeSelect
                  showTimeSelectOnly // Sadece saat listesini göster
                  timeIntervals={15}
                  timeCaption="Saat"
                  dateFormat="HH:mm"
                  className="input w-full mt-2 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                />
              )}
            />
            {errors.scheduledDate && (
              <p className="text-danger text-xs mt-1">
                {errors.scheduledDate.message}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Planlanıyor..." : "Planla"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InterviewModal;
