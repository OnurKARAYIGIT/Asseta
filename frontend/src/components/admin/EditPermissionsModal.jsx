import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import Button from "../shared/Button";

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

  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    setUserPermissions((prev) =>
      checked ? [...prev, value] : prev.filter((p) => p !== value)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user, userPermissions);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${user?.username} Yetkileri`}
      variant="form"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" form="permissions-form">
            Yetkileri Kaydet
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} id="permissions-form" className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {allPermissions.map((permission) => (
            <div key={permission.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={permission.key}
                value={permission.key}
                checked={userPermissions.includes(permission.key)}
                onChange={handlePermissionChange}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <label
                htmlFor={permission.key}
                className="text-sm text-text-main"
              >
                {permission.name}
              </label>
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
};

export default EditPermissionsModal;
