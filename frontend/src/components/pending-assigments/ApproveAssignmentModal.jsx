import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import Loader from "../Loader";
import { FaUpload, FaCheck } from "react-icons/fa";

const ApproveAssignmentModal = ({
  isOpen,
  onClose,
  selectedUserForApproval,
  onApprove,
  isApproving,
}) => {
  const [formFile, setFormFile] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFormFile(null); // Modal kapandığında dosyayı sıfırla
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    setFormFile(e.target.files[0]);
  };

  const handleApproveClick = () => {
    onApprove(formFile);
  };

  if (!selectedUserForApproval) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Zimmeti Onayla">
      <div>
        <p>
          <strong>{selectedUserForApproval.personnelName}</strong> personeline
          ait <strong>{selectedUserForApproval.assignments.length} adet</strong>{" "}
          zimmeti onaylamak için lütfen imzalı zimmet formunu yükleyin.
        </p>
        <div className="form-file-upload" style={{ margin: "1.5rem 0" }}>
          <input
            type="file"
            id="approval-form-file"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <label htmlFor="approval-form-file" className="file-upload-label">
            <FaUpload /> Form Seç
          </label>
          {formFile && <span>{formFile.name}</span>}
        </div>
        <div className="modal-actions">
          <button
            onClick={handleApproveClick}
            disabled={!formFile || isApproving}
          >
            {isApproving ? (
              <Loader size="sm" />
            ) : (
              <>
                {" "}
                <FaCheck /> Onayla ve Zimmetle{" "}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ApproveAssignmentModal;
