import React, { useState } from "react";
import Modal from "../Modal";
import { FaSave } from "react-icons/fa";

const ChangePasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }

    const success = await onSubmit(oldPassword, newPassword);
    if (success) {
      // Başarılı olursa modal'ı kapat
      onClose();
    } else {
      setError(
        "Şifre güncellenirken bir hata oluştu. Lütfen mevcut şifrenizi kontrol edin."
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Şifre Değiştir">
      <form onSubmit={handleSubmit} className="modal-form">
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className="form-group">
          <label>Mevcut Şifre</label>
          <input
            type="password"
            placeholder="Mevcut şifrenizi girin"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Yeni Şifre</label>
          <input
            type="password"
            placeholder="Yeni şifrenizi belirleyin"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Yeni Şifre (Tekrar)</label>
          <input
            type="password"
            placeholder="Yeni şifrenizi tekrar girin"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: "var(--secondary-color)" }}
          >
            İptal
          </button>
          <button
            type="submit"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <FaSave /> Şifreyi Güncelle
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
