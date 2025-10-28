import React from "react";
import Modal from "../Modal";
import { FaEdit } from "react-icons/fa";

import "../../pages/AssignmentsPage.css"; // Detay grid stilleri için gerekli
const ProfileAssignmentDetailModal = ({
  isOpen,
  onClose,
  assignment,
  onUpdateNavigate,
}) => {
  if (!assignment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Zimmet Detayı">
      <div>
        <div className="detail-grid">
          <strong>Çalıştığı Firma:</strong>
          <span>{assignment.company?.name || "Belirtilmemiş"}</span>
          <strong>Varlık Alt Kategori:</strong>
          <span>{assignment.item?.assetSubType || "-"}</span>
          <strong>Varlık Cinsi:</strong>
          <span>{assignment.item?.assetType || "-"}</span>
          <strong>Kayıtlı Bölüm:</strong>
          <span>{assignment.registeredSection}</span>
          <strong>Demirbaş No:</strong>
          <span>{assignment.item?.assetTag || "-"}</span>
          <strong>Bulunduğu Birim:</strong>
          <span>{assignment.unit}</span>
          <strong>Bulunduğu Yer:</strong>
          <span>{assignment.location}</span>
          <strong>Kullanıcı Adı:</strong>
          <span>{assignment.personnelName}</span>
          <strong>Sabit Kıymet Cinsi:</strong>
          <span>{assignment.item?.fixedAssetType || "-"}</span>
          <strong>Marka:</strong>
          <span>{assignment.item?.brand || "-"}</span>
          <strong>Özellik:</strong>
          <span>{assignment.item?.description || "-"}</span>
          <strong>Model Yılı:</strong>
          <span>{assignment.item?.modelYear || "-"}</span>
          <strong>Seri No:</strong>
          <span>{assignment.item?.serialNumber || "-"}</span>
          <strong>Mac/IP Adresi:</strong>
          <span>{assignment.item?.networkInfo || "-"}</span>
          <strong>Kurulu Programlar:</strong>
          <span>{assignment.item?.softwareInfo || "-"}</span>
          <strong>Eski Kullanıcı:</strong>
          <span>{assignment.previousUser}</span>
          <strong>Açıklama:</strong>
          <span>{assignment.assignmentNotes}</span>
          <strong>Zimmet Tarihi:</strong>
          <span>
            {new Date(assignment.assignmentDate).toLocaleDateString()}
          </span>
        </div>
        <div className="modal-actions">
          <button
            onClick={() => onUpdateNavigate(assignment._id)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <FaEdit /> Güncelle
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileAssignmentDetailModal;
