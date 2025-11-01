import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../shared/Modal";
import Button from "../shared/Button";

const LocationModal = ({ isOpen, onClose, onSave, location }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const isEditing = !!location;

  useEffect(() => {
    if (isEditing) {
      reset({ name: location.name });
    } else {
      reset({ name: "" });
    }
  }, [isEditing, location, reset]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Konumu Düzenle" : "Yeni Konum Ekle"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-secondary"
          >
            Konum Adı
          </label>
          <input
            type="text"
            id="name"
            {...register("name", { required: "Konum adı zorunludur." })}
            className="mt-1 block w-full px-3 py-2 bg-input-background border border-border-color rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Örn: Merkez Ofis - 3. Kat"
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LocationModal;
