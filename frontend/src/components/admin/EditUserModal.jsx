import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import { FaSave, FaUser } from "react-icons/fa";
import { MdEmail, MdPhone, MdWork } from "react-icons/md";
import { formatPhoneNumber } from "../../utils/formatters"; // Yeni yardımcı fonksiyonu import et

const EditUserModal = ({ isOpen, onClose, user, onSave, currentUser }) => {
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    if (user) {
      setEditedData({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        position: user.position || "",
        role: user.role || "user",
      });
    }
  }, [user]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/[^\d]/g, "");
    if (digitsOnly.length <= 10) {
      handleFieldChange({ target: { name: "phone", value: digitsOnly } });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user, editedData);
  };

  if (!isOpen || !user) return null;

  const isSelf = user._id === currentUser._id;
  const isRequesterDeveloper = currentUser.role === "developer";
  const canChangeRole = isRequesterDeveloper ? true : !isSelf;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`'${user.username}' Kullanıcısını Düzenle`}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="edit-username">Kullanıcı Adı</label>
            <div className="input-with-icon">
              <FaUser />
              <input
                id="edit-username"
                type="text"
                name="username"
                value={editedData.username || ""}
                onChange={handleFieldChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="edit-email">E-posta</label>
            <div className="input-with-icon">
              <MdEmail />
              <input
                id="edit-email"
                type="email"
                name="email"
                value={editedData.email || ""}
                onChange={handleFieldChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="edit-phone">Telefon</label>
            <div className="input-with-icon">
              <MdPhone />
              <input
                id="edit-phone"
                type="tel"
                name="phone"
                value={formatPhoneNumber(editedData.phone || "")}
                onChange={handlePhoneChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="edit-position">Pozisyon</label>
            <div className="input-with-icon">
              <MdWork />
              <input
                id="edit-position"
                type="text"
                name="position"
                value={editedData.position || ""}
                onChange={handleFieldChange}
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label htmlFor="edit-role">Rol</label>
            <div className="input-with-icon">
              <select
                id="edit-role"
                name="role"
                value={editedData.role || "user"}
                onChange={handleFieldChange}
                disabled={!canChangeRole}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                {currentUser.role === "developer" && (
                  <option value="developer">Developer</option>
                )}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose}>
            İptal
          </button>
          <button type="submit" className="primary">
            <FaSave /> Kaydet
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
