import React, { useState, useEffect } from "react";
import Modal from "../Modal";

const ResetPasswordModal = ({ isOpen, onClose, user, onReset }) => {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setError("");
    }
  }, [isOpen]);

  const handleReset = async () => {
    setError("");
    if (!newPassword) {
      setError("Yeni şifre alanı boş bırakılamaz.");
      return;
    }
    const success = await onReset(user, newPassword);
    if (success) {
      onClose();
    } else {
      setError("Şifre sıfırlanırken bir hata oluştu.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`'${user?.username}' Şifresini Sıfırla`}
    >
      <div className="modal-form">
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className="form-group">
          <label htmlFor="newPassword">Yeni Şifre</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Yeni şifreyi girin"
          />
        </div>
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ backgroundColor: "var(--secondary-color)" }}
          >
            İptal
          </button>
          <button onClick={handleReset}>Şifreyi Sıfırla</button>
        </div>
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;
