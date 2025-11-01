import React, { useState } from "react";
import Modal from "../shared/Modal.jsx";
import {
  FaCube,
  FaInfoCircle,
  FaHistory,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

const AssignmentDetailsModal = ({ isOpen, onClose, assignment, companies }) => {
  const [historySortDirection, setHistorySortDirection] = useState("desc");

  if (!assignment) return null;

  const formatHistoryChange = (change) => {
    const fieldTranslations = {
      status: "Durum",
      returnDate: "İade Tarihi",
      assignmentNotes: "Açıklama",
      personnelName: "Personel Adı",
      unit: "Birim",
      registeredSection: "Kayıtlı Bölüm",
      previousUser: "Eski Kullanıcı",
      formPath: "Zimmet Formu",
      company: "Çalıştığı Firma",
      assignmentDate: "Zimmet Tarihi",
      location: "Bulunduğu Yer",
      "item.brand": "Marka",
      "item.modelYear": "Model Yılı",
      "item.serialNumber": "Seri No",
      "item.networkInfo": "Mac/IP Adresi",
      "item.softwareInfo": "Kurulu Programlar",
    };

    const formatValue = (field, value) => {
      if (value == null || value === "")
        return <span className="change-value empty">Boş</span>;
      if (field === "company") {
        const company = companies.find((c) => c._id === value);
        return <span className="change-value">{company?.name || value}</span>;
      }
      if (field.includes("Date")) {
        return (
          <span className="change-value date">
            {new Date(value).toLocaleDateString("tr-TR")}
          </span>
        );
      }
      return <span className="change-value">{value}</span>;
    };

    const fieldName = fieldTranslations[change.field] || change.field;

    if (change.field === "formPath" && !change.from) {
      return (
        <li key={`${change.field}-${change.to}`} className="change-item">
          <strong className="change-field">{fieldName}:</strong>
          <span className="change-value new">Yeni form eklendi</span>
        </li>
      );
    }

    return (
      <li
        key={`${change.field}-${change.from}-${change.to}`}
        className="change-item"
      >
        <strong className="change-field">{fieldName}:</strong>
        <div className="change-values">
          {formatValue(change.field, change.from)}
          <span className="change-arrow">→</span>
          {formatValue(change.field, change.to)}
        </div>
      </li>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${assignment.item?.assetType || "Eşya"} (Demirbaş: ${
        assignment.item?.assetTag
      })`}
      size="large"
    >
      <div className="modal-detail-container">
        <div className="modal-section">
          <h4 className="modal-section-title">
            <FaCube /> Eşya Bilgileri
          </h4>
          <div className="modal-detail-grid">
            <strong>Varlık Cinsi:</strong>
            <span>{assignment.item.assetType}</span>
            <strong>Marka:</strong>
            <span>{assignment.item.brand}</span>
            <strong>Seri No:</strong>
            <span>{assignment.item.serialNumber || "-"}</span>
            <strong>Demirbaş No:</strong>
            <span>{assignment.item.assetTag}</span>
          </div>
        </div>

        <div className="modal-section">
          <h4 className="modal-section-title">
            <FaInfoCircle /> Zimmet Bilgileri
          </h4>
          <div className="modal-detail-grid">
            <strong>Durum:</strong>
            <span>{assignment.status}</span>
            <strong>Zimmet Tarihi:</strong>
            <span>
              {new Date(assignment.assignmentDate).toLocaleDateString()}
            </span>
            {assignment.returnDate && (
              <>
                <strong>İade Tarihi:</strong>
                <span>
                  {new Date(assignment.returnDate).toLocaleDateString()}
                </span>
              </>
            )}
            <strong>Çalıştığı Firma:</strong>
            <span>{assignment.company.name}</span>
          </div>
        </div>

        <div className="modal-section">
          <div className="history-log-header">
            <h4 className="modal-section-title">
              <FaHistory /> Zimmet Geçmişi
            </h4>
            <button
              type="button"
              className="link-button"
              onClick={() =>
                setHistorySortDirection(
                  historySortDirection === "asc" ? "desc" : "asc"
                )
              }
            >
              {historySortDirection === "asc" ? <FaSortUp /> : <FaSortDown />}{" "}
              Tarihe Göre Sırala
            </button>
          </div>
          <div className="history-log">
            {assignment.history && assignment.history.length > 0 ? (
              <ul>
                {[...assignment.history]
                  .sort((a, b) =>
                    historySortDirection === "asc"
                      ? new Date(a.timestamp) - new Date(b.timestamp)
                      : new Date(b.timestamp) - new Date(a.timestamp)
                  )
                  .map((h) => (
                    <div key={h._id || h.timestamp} className="history-item">
                      <div className="history-item-header">
                        <span className="history-user">{h.username}</span>
                        <span className="history-date">
                          {new Date(h.timestamp).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <ul className="history-changes-list">
                        {h.changes.map(formatHistoryChange)}
                      </ul>
                    </div>
                  ))}
              </ul>
            ) : (
              <p className="no-history">
                Bu zimmet için geçmiş kaydı bulunmuyor.
              </p>
            )}
          </div>
        </div>

        <div className="modal-section">
          <h4 className="modal-section-title">
            <FaInfoCircle /> Diğer Tüm Detaylar
          </h4>
          <div className="modal-detail-grid">
            <strong>Varlık Alt Kategori:</strong>
            <span>{assignment.item.assetSubType || "-"}</span>
            <strong>Sabit Kıymet Cinsi:</strong>
            <span>{assignment.item.fixedAssetType || "-"}</span>
            <strong>Model Yılı:</strong>
            <span>{assignment.item.modelYear || "-"}</span>
            <strong>Mac/IP Adresi:</strong>
            <span>{assignment.item.networkInfo || "-"}</span>
            <strong>Kurulu Programlar:</strong>
            <span>{assignment.item.softwareInfo || "-"}</span>
            <strong>Eşya Açıklaması:</strong>
            <span>{assignment.item.description || "-"}</span>
            <strong
              style={{
                gridColumn: "1 / -1",
                marginTop: "1rem",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "1rem",
              }}
            >
              Zimmet Detayları
            </strong>
            <strong>Kayıtlı Bölüm:</strong>
            <span>{assignment.registeredSection || "-"}</span>
            <strong>Eski Kullanıcı:</strong>
            <span>{assignment.previousUser || "-"}</span>
            <strong>Zimmet Notları:</strong>
            <span>{assignment.assignmentNotes || "-"}</span>
            <strong>Zimmet Formu:</strong>
            <span>
              {assignment.formPath ? (
                <a
                  href={`http://localhost:5001${assignment.formPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="details-link"
                >
                  Formu Görüntüle
                </a>
              ) : (
                "Yüklenmemiş"
              )}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignmentDetailsModal;
