import React from "react";
import Modal from "../Modal";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Evet, Onayla",
  confirmButtonVariant = "danger", // 'danger' veya 'primary' olabilir
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>{children}</div>
      <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{ backgroundColor: "var(--secondary-color)" }}
        >
          İptal
        </button>
        <button onClick={onConfirm} className={confirmButtonVariant}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
