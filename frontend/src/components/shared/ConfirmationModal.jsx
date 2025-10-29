import React from "react";
import Modal from "../Modal";
import Button from "./Button";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="confirmation"
      preventClose
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button variant={confirmButtonVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="text-text-main">{children}</div>
    </Modal>
  );
};

export default ConfirmationModal;
