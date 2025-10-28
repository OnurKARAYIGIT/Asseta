import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import { FaSave, FaTrash, FaSortUp, FaSortDown } from "react-icons/fa";

const AssignmentDetailModal = ({
  isOpen,
  onClose,
  assignment,
  companies,
  onUpdate,
  onDelete,
  userInfo,
}) => {
  const [formData, setFormData] = useState({});
  const [formFile, setFormFile] = useState(null);
  const [historySortDirection, setHistorySortDirection] = useState("desc");

  // assignment prop'u değiştiğinde formu yeniden doldur
  useEffect(() => {
    if (assignment) {
      setFormData({
        personnelName: assignment.personnelName || "",
        unit: assignment.unit || "",
        location: assignment.location || "",
        registeredSection: assignment.registeredSection || "",
        previousUser: assignment.previousUser || "",
        assignmentNotes: assignment.assignmentNotes || "",
        status: assignment.status || "Beklemede",
        company: assignment.company?._id || "",
        assignmentDate: assignment.assignmentDate
          ? new Date(assignment.assignmentDate).toISOString().split("T")[0]
          : "",
        returnDate: assignment.returnDate
          ? new Date(assignment.returnDate).toISOString().split("T")[0]
          : "",
        // Eşya bilgileri
        "item.assetSubType": assignment.item?.assetSubType || "",
        "item.fixedAssetType": assignment.item?.fixedAssetType || "",
        "item.brand": assignment.item?.brand || "",
        "item.description": assignment.item?.description || "",
        "item.modelYear": assignment.item?.modelYear || "",
        "item.serialNumber": assignment.item?.serialNumber || "",
        "item.networkInfo": assignment.item?.networkInfo || "",
        "item.softwareInfo": assignment.item?.softwareInfo || "",
      });
      setFormFile(null); // Modal her açıldığında dosya seçimini sıfırla
    }
  }, [assignment]);

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setFormFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData, formFile);
  };

  const formatHistoryChange = (change) => {
    const fieldTranslations = {
      status: "Durum",
      returnDate: "İade Tarihi",
      assignmentNotes: "Açıklama",
      personnelName: "Kullanıcı Adı",
      unit: "Birim",
      location: "Konum",
      registeredSection: "Kayıtlı Bölüm",
      previousUser: "Eski Kullanıcı",
      formPath: "Zimmet Formu",
      company: "Çalıştığı Firma",
      assignmentDate: "Zimmet Tarihi",
      "item.brand": "Marka",
      "item.modelYear": "Model Yılı",
      "item.serialNumber": "Seri No",
      "item.fixedAssetType": "Sabit Kıymet Cinsi",
      "item.assetSubType": "Varlık Alt Kategori",
      "item.networkInfo": "Mac/IP Adresi",
      "item.softwareInfo": "Kurulu Programlar",
    };

    const formatValue = (field, value) => {
      if (value === null || value === undefined || value === "")
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
        <li key={change.field} className="change-item">
          <strong className="change-field">{fieldName}:</strong>
          <span className="change-value new">Yeni form eklendi</span>
        </li>
      );
    }

    return (
      <li key={change.field} className="change-item">
        <strong className="change-field">{fieldName}:</strong>
        <div className="change-values">
          {formatValue(change.field, change.from)}
          <span className="change-arrow">→</span>
          {formatValue(change.field, change.to)}
        </div>
      </li>
    );
  };

  if (!assignment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${assignment.item?.name || "Eşya"} (Demirbaş: ${
        assignment.item?.assetTag
      }) - Zimmet Detayı`}
    >
      <form onSubmit={handleSubmit}>
        <div className="detail-grid">
          <strong>Çalıştığı Firma:</strong>
          <select
            name="company"
            value={formData.company || ""}
            onChange={handleFormChange}
          >
            <option value="">Firma Seçin...</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <strong>Zimmet Tarihi:</strong>
          <input
            type="date"
            name="assignmentDate"
            value={formData.assignmentDate || ""}
            max={new Date().toISOString().split("T")[0]}
            onChange={handleFormChange}
          />
          <strong
            style={{
              gridColumn: "1 / -1",
              marginTop: "1rem",
              borderTop: "1px solid var(--border-color)",
              paddingTop: "1rem",
            }}
          >
            Eşya Bilgileri (Bu Eşyaya Ait Tüm Zimmetleri Etkiler)
          </strong>
          <strong>Marka:</strong>
          <input
            type="text"
            name="item.brand"
            value={formData["item.brand"] || ""}
            onChange={handleFormChange}
          />
          <strong>Model Yılı:</strong>
          <input
            type="text"
            name="item.modelYear"
            value={formData["item.modelYear"] || ""}
            onChange={handleFormChange}
          />
          <strong>Seri No:</strong>
          <input
            type="text"
            name="item.serialNumber"
            value={formData["item.serialNumber"] || ""}
            onChange={handleFormChange}
          />
          <strong>Sabit Kıymet Cinsi:</strong>
          <input
            type="text"
            name="item.fixedAssetType"
            value={formData["item.fixedAssetType"] || ""}
            onChange={handleFormChange}
          />
          <strong>Varlık Alt Kategori:</strong>
          <input
            type="text"
            name="item.assetSubType"
            value={formData["item.assetSubType"] || ""}
            onChange={handleFormChange}
          />
          <strong>Mac/IP Adresi:</strong>
          <input
            type="text"
            name="item.networkInfo"
            value={formData["item.networkInfo"] || ""}
            onChange={handleFormChange}
          />
          <strong style={{ alignSelf: "start" }}>Kurulu Programlar:</strong>
          <textarea
            name="item.softwareInfo"
            value={formData["item.softwareInfo"] || ""}
            onChange={handleFormChange}
            rows="3"
          />
          <strong>Kullanıcı Adı:</strong>
          <input
            type="text"
            name="personnelName"
            value={formData.personnelName || ""}
            onChange={handleFormChange}
          />
          <strong>Bulunduğu Birim:</strong>
          <input
            type="text"
            name="unit"
            value={formData.unit || ""}
            onChange={handleFormChange}
          />
          <strong>Bulunduğu Yer:</strong>
          <input
            type="text"
            name="location"
            value={formData.location || ""}
            onChange={handleFormChange}
          />
          <strong>Kayıtlı Bölüm:</strong>
          <input
            type="text"
            name="registeredSection"
            value={formData.registeredSection || ""}
            onChange={handleFormChange}
          />
          <strong>Eski Kullanıcı:</strong>
          <input
            type="text"
            name="previousUser"
            value={formData.previousUser || ""}
            onChange={handleFormChange}
          />
          <strong>Durum:</strong>
          <select
            name="status"
            value={formData.status}
            onChange={handleFormChange}
          >
            <option value="Beklemede">Beklemede</option>
            <option value="Zimmetli">Zimmetli</option>
            <option value="İade Edildi">İade Edildi</option>
            <option value="Arızalı">Arızalı</option>
            <option value="Hurda">Hurda</option>
          </select>

          {formData.status === "İade Edildi" && (
            <>
              <strong>İade Tarihi:</strong>
              <input
                type="date"
                name="returnDate"
                value={formData.returnDate || ""}
                max={new Date().toISOString().split("T")[0]}
                onChange={handleFormChange}
              />
            </>
          )}
          <strong style={{ alignSelf: "start" }}>Açıklama:</strong>
          <textarea
            name="assignmentNotes"
            value={formData.assignmentNotes || ""}
            onChange={handleFormChange}
            rows="3"
          />
          <strong>Zimmet Formu:</strong>
          <span>
            {assignment.formPath ? (
              <a
                href={`http://localhost:5001${assignment.formPath}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Formu Görüntüle
              </a>
            ) : (
              "Yüklenmemiş"
            )}
          </span>
          <div className="history-log-header">
            <strong>Zimmet Geçmişi:</strong>
            <button
              type="button"
              className="link-button"
              onClick={() =>
                setHistorySortDirection(
                  historySortDirection === "asc" ? "desc" : "asc"
                )
              }
            >
              Tarihe Göre Sırala{" "}
              {historySortDirection === "asc" ? <FaSortUp /> : <FaSortDown />}
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
                    <div key={h._id} className="history-item">
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
              <span>Geçmiş kaydı bulunmuyor.</span>
            )}
          </div>
        </div>
        <div className="modal-actions">
          {(userInfo.role === "admin" || userInfo.role === "developer") && (
            <button
              type="submit"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FaSave /> Değişiklikleri Kaydet
            </button>
          )}
          {(userInfo.role === "admin" || userInfo.role === "developer") && (
            <button
              type="button"
              onClick={onDelete}
              style={{
                backgroundColor: "var(--danger-color)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FaTrash /> Sil
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default AssignmentDetailModal;
