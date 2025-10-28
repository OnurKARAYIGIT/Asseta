import React, { useState, useEffect } from "react";
import Modal from "../Modal";

const EditPermissionsModal = ({
  isOpen,
  onClose,
  user,
  onSave,
  allPermissions,
}) => {
  const [userPermissions, setUserPermissions] = useState([]);

  useEffect(() => {
    if (user) {
      setUserPermissions(user.permissions || []);
    }
  }, [user]);

  const handlePermissionChange = (permissionKey) => {
    setUserPermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((p) => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleSave = () => {
    onSave(user, userPermissions);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`'${user?.username}' Yetkileri`}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {allPermissions.map((perm) => (
          <label
            key={perm.key}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              checked={userPermissions.includes(perm.key)}
              onChange={() => handlePermissionChange(perm.key)}
              style={{ width: "auto" }}
            />
            {perm.name}
          </label>
        ))}
      </div>
      <div className="modal-actions">
        <button onClick={handleSave}>Kaydet</button>
        <button
          onClick={onClose}
          style={{ backgroundColor: "var(--secondary-color)" }}
        >
          İptal
        </button>
      </div>
    </Modal>
  );
};

export default EditPermissionsModal;
