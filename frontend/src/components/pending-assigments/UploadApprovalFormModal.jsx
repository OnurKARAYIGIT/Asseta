import React, { useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import { FaFileUpload } from "react-icons/fa";

const UploadApprovalFormModal = ({
  isOpen,
  onClose,
  onUpload,
  personnelName,
}) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== "application/pdf") {
      setError("Lütfen sadece PDF formatında bir dosya seçin.");
      setFile(null);
    } else {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = () => {
    if (!file) {
      setError("Lütfen bir dosya seçin.");
      return;
    }
    onUpload(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${personnelName} için Zimmet Formu Yükle`}
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Lütfen personele ait tüm bekleyen zimmetler için imzalanmış zimmet
          teslim tutanağını (PDF) yükleyin.
        </p>
        <div>
          <label className="block w-full px-4 py-6 border-2 border-dashed border-border-color rounded-lg text-center cursor-pointer hover:border-primary">
            <FaFileUpload className="mx-auto h-10 w-10 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-text-secondary">
              {file ? file.name : "Dosya seçmek için tıklayın"}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="application/pdf"
            />
          </label>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!file}
          >
            Yükle ve Onayla
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadApprovalFormModal;
