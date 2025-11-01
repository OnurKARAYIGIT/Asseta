import React, { useState, useEffect } from "react";
import Modal from "../shared/Modal.jsx";

import Button from "../shared/Button";

const EditUserModal = ({ isOpen, onClose, user, onSave, currentUser }) => {
  const [formData, setFormData] = useState({
    email: "",
    role: "user",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        role: user.role || "user",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user, formData);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kullanıcı Bilgilerini Düzenle"
      variant="form"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" form="edit-user-form">
            Değişiklikleri Kaydet
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} id="edit-user-form" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-main mb-1">
            Personel Adı
          </label>
          {/* İsim artık düzenlenemez, sadece gösterilir */}
          <p className="w-full px-3 py-2 bg-light-gray/50 border border-border rounded-lg">
            {user?.personnel?.fullName || "İsim Bilgisi Yok"}
          </p>
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
            disabled={
              currentUser.role !== "developer" &&
              (user?.role === "developer" || user?._id === currentUser._id)
            }
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-light-gray/50"
            required
          >
            <option value="user">Kullanıcı</option>
            <option value="admin">Admin</option>
            {currentUser.role === "developer" && (
              <option value="developer">Developer</option>
            )}
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
