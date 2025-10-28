import React, { useState } from "react";
import Modal from "../Modal";
import {
  FaUserPlus,
  FaUser,
  FaKey,
  FaCode,
  FaUserShield,
} from "react-icons/fa";
import { MdEmail, MdPhone, MdWork } from "react-icons/md";
import { formatPhoneNumber } from "../../utils/formatters"; // Yeni yardımcı fonksiyonu import et

const AddUserModal = ({ isOpen, onClose, onSubmit, currentUserRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState("user");
  const [formError, setFormError] = useState("");

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/[^\d]/g, "");
    if (digitsOnly.length <= 10) {
      setPhone(digitsOnly);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const success = await onSubmit({
      username,
      password,
      email,
      phone,
      position,
      role,
    });
    if (success) {
      // Formu sıfırla ve modalı kapat
      setUsername("");
      setPassword("");
      setEmail("");
      setPhone("");
      setPosition("");
      setRole("user");
      onClose();
    } else {
      setFormError("Kullanıcı oluşturulamadı. Lütfen bilgileri kontrol edin.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Kullanıcı Ekle">
      <form className="modal-form" onSubmit={handleSubmit}>
        {formError && <p style={{ color: "red" }}>{formError}</p>}
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="add-username">Kullanıcı Adı</label>
            <div className="input-with-icon">
              <FaUser />
              <input
                id="add-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="add-email">E-posta Adresi</label>
            <div className="input-with-icon">
              <MdEmail />
              <input
                id="add-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="add-phone">Telefon Numarası</label>
            <div className="input-with-icon">
              <MdPhone />
              <input
                id="add-phone"
                type="tel"
                value={formatPhoneNumber(phone)}
                onChange={handlePhoneChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="add-position">Pozisyon</label>
            <div className="input-with-icon">
              <MdWork />
              <input
                id="add-position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="add-password">Şifre</label>
            <div className="input-with-icon">
              <FaKey />
              <input
                id="add-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="add-role">Rol</label>
            <div className="input-with-icon">
              <select
                id="add-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                {currentUserRole === "developer" && (
                  <option value="developer">Developer</option>
                )}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button type="submit" className="primary">
            <FaUserPlus /> Kullanıcı Oluştur
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
