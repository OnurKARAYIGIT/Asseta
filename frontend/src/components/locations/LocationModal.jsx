import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../shared/Modal";
import Button from "../shared/Button";

const LocationModal = ({ isOpen, onClose, onSubmit, location }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const isEditing = !!location;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        reset({
          name: location.name,
          address: location.address || "",
          contact: location.contact || "",
        });
      } else {
        reset({
          name: "",
          address: "",
          contact: "",
        });
      }
    }
  }, [isOpen, isEditing, location, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Konum Düzenle" : "Yeni Konum Ekle"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="submit"
            form="location-form"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Kaydediliyor..."
              : isEditing
              ? "Güncelle"
              : "Kaydet"}
          </Button>
        </div>
      }
    >
      <form
        id="location-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-light"
          >
            Konum Adı
          </label>
          <input
            id="name"
            type="text"
            {...register("name", { required: "Konum adı zorunludur." })}
            className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-danger">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-text-light"
          >
            Adres
          </label>
          <input
            id="address"
            type="text"
            {...register("address")}
            className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label
            htmlFor="contact"
            className="block text-sm font-medium text-text-light"
          >
            İletişim
          </label>
          <input
            id="contact"
            type="text"
            {...register("contact")}
            className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
      </form>
    </Modal>
  );
};

export default LocationModal;
