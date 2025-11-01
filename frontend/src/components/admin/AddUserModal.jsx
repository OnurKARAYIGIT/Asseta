import React, { useState, useEffect } from "react";
import Modal from "../shared/Modal.jsx";
import Button from "../shared/Button";
import Select from "react-select";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";

const AddUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentUserRole,
  existingUsers,
}) => {
  const initialFormState = {
    personnelId: "",
    email: "",
    password: "",
    role: "user",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");

  // Henüz kullanıcı hesabı olmayan personelleri filtrelemek için
  const { data: allPersonnel = [] } = useQuery({
    queryKey: ["allPersonnelForUserCreation"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/personnel");
      return data;
    },
    enabled: isOpen, // Sadece modal açıkken çalıştır
  });

  // Sadece hesabı olan personellerin ID'lerini içeren bir Set oluştur (daha hızlı kontrol için)
  const existingUserPersonnelIds = new Set(
    existingUsers.map((u) => u.personnel?._id).filter(Boolean)
  );
  const personnelWithoutAccount = allPersonnel.filter(
    (p) => !existingUserPersonnelIds.has(p._id)
  );

  const personnelOptions = personnelWithoutAccount.map((p) => ({
    value: p._id,
    label: `${p.fullName} (${p.employeeId})`,
    email: p.email, // E-postayı otomatik doldurmak için
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePersonnelChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      personnelId: selectedOption.value,
      email: selectedOption.email || "", // Seçilen personelin e-postasını otomatik doldur
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const success = await onSubmit(formData);
    if (success) {
      setFormData(initialFormState);
      onClose();
    } else {
      setError("Kullanıcı oluşturulamadı. Lütfen bilgileri kontrol edin.");
    }
  };

  // Modal her açıldığında formu sıfırla
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setError("");
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yeni Kullanıcı Ekle"
      variant="form"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" form="add-user-form">
            Kullanıcıyı Ekle
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} id="add-user-form" className="space-y-4">
        {error && (
          <div className="text-danger text-sm bg-danger/10 p-3 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text-main mb-1">
            Personel Seçimi *
          </label>
          <Select
            options={personnelOptions}
            onChange={handlePersonnelChange}
            placeholder="Kullanıcı hesabı atanacak personeli seçin..."
            noOptionsMessage={() =>
              "Tüm personellerin kullanıcı hesabı var veya personel bulunamadı."
            }
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-main mb-1"
          >
            E-posta
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            readOnly // E-postanın personel kaydından gelmesi daha güvenli
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Şifre
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Rol
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          >
            <option value="user">Kullanıcı</option>
            <option value="admin">Admin</option>
            {currentUserRole === "developer" && (
              <option value="developer">Developer</option>
            )}
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
