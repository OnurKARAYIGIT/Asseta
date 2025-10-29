import React, { useState } from "react";
import Modal from "../Modal";
import Button from "../shared/Button";

const AddUserModal = ({ isOpen, onClose, onSubmit, currentUserRole }) => {
  const initialFormState = {
    username: "",
    email: "",
    password: "",
    role: "user",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          <label
            htmlFor="username"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Kullanıcı Adı
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
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
