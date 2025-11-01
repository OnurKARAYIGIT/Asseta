import React, { useState, useEffect } from "react";
import Modal from "../shared/Modal.jsx";

import Button from "../shared/Button";

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [strength, setStrength] = useState({
    score: 0,
    label: "",
    color: "bg-gray-300",
  });

  // Şifre gücünü kontrol eden fonksiyon
  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length > 7) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = ["", "Zayıf", "Orta", "Güçlü", "Çok Güçlü"];
    const colors = [
      "bg-gray-300",
      "bg-danger",
      "bg-yellow-500",
      "bg-green-500",
      "bg-green-600",
    ];

    setStrength({ score, label: labels[score], color: colors[score] });
  };

  useEffect(() => {
    if (newPassword) checkPasswordStrength(newPassword);
    else setStrength({ score: 0, label: "", color: "bg-gray-300" });
  }, [newPassword]);

  const handleClose = () => {
    // Modal kapandığında state'leri sıfırla
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setStrength({ score: 0, label: "", color: "bg-gray-300" });
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    // onSubmit (useMutation'dan gelen mutate fonksiyonu) çağırılıyor.
    // Başarı/hata yönetimi SettingsPage içinde yapılıyor.
    onSubmit({ oldPassword, newPassword });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Şifre Değiştir"
      variant="form"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button
            type="submit"
            form="change-password-form"
            isLoading={isLoading}
          >
            Şifreyi Güncelle
          </Button>
        </div>
      }
    >
      <form
        id="change-password-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {error && (
          <div className="text-danger text-sm bg-danger/10 p-3 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text-main mb-1">
            Mevcut Şifre
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
          {newPassword && (
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-text-light">
                  Şifre Güvenliği
                </span>
                <span
                  className={`text-xs font-bold text-${strength.color.replace(
                    "bg-",
                    ""
                  )}`}
                >
                  {strength.label}
                </span>
              </div>
              <div className="w-full bg-background-color rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${strength.score * 25}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-main mb-1">
            Yeni Şifre
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-main mb-1">
            Yeni Şifre (Tekrar)
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
