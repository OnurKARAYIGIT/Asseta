import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { tr } from "date-fns/locale";

const OfferModal = ({ isOpen, onClose, onSubmit, application }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        offeredSalary: "",
        currency: "TRY",
        startDate: new Date(),
        notes: "",
      });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      applicationId: application?._id,
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="İş Teklifi Yap" size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="offeredSalary"
              className="block text-sm font-medium"
            >
              Teklif Edilen Maaş (Brüt)
            </label>
            <input
              id="offeredSalary"
              type="number"
              step="0.01"
              {...register("offeredSalary", {
                required: "Maaş teklifi zorunludur.",
                valueAsNumber: true,
              })}
              className="input mt-1 w-full"
            />
            {errors.offeredSalary && (
              <p className="text-danger text-xs mt-1">
                {errors.offeredSalary.message}
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
              className="input mt-1 w-full"
            >
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium">
            İşe Başlangıç Tarihi
          </label>
          <Controller
            name="startDate"
            control={control}
            rules={{ required: "Başlangıç tarihi zorunludur." }}
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}
                dateFormat="d MMMM yyyy"
                locale={tr}
                className="input mt-1 w-full"
              />
            )}
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Teklif Notları
          </label>
          <textarea
            id="notes"
            {...register("notes")}
            rows="3"
            className="input mt-1 w-full"
            placeholder="Yan haklar, özel koşullar vb."
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Gönderiliyor..." : "Teklifi Gönder"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OfferModal;
