import React, { useState } from "react";
import Modal from "../Modal";
import Button from "../shared/Button";

const ResetPasswordModal = ({ isOpen, onClose, user, onReset }) => {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!newPassword) {
      setError("Yeni şifre alanı boş bırakılamaz.");
      return;
    }
    const success = await onReset(user, newPassword);
    if (success) {
      setNewPassword("");
      onClose();
    } else {
      setError("Şifre sıfırlanırken bir hata oluştu.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`"${user?.username}" için Şifre Sıfırla`}
      variant="form"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" form="reset-password-form">
            Şifreyi Sıfırla
          </Button>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit}
        id="reset-password-form"
        className="space-y-4"
      >
        {error && (
          <div className="text-danger text-sm bg-danger/10 p-3 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Yeni Şifre
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default ResetPasswordModal;
