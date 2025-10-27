import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import {
  FaEdit,
  FaCube,
  FaUser,
  FaBoxOpen,
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaSortUp,
  FaCalendarAlt,
  FaInfoCircle,
  FaHistory,
  FaSortDown,
} from "react-icons/fa";
import Modal from "../components/Modal";
import { useAuth } from "../components/AuthContext";
import "./PersonnelDetailsPage.css";

const PersonnelDetailsPage = () => {
  const { personnelId } = useParams();
  const [personnelData, setPersonnelData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileInfo, setProfileInfo] = useState(null); // Personel profil bilgileri için
  const [activeTab, setActiveTab] = useState("active"); // 'active' veya 'past'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Zimmet Detayı");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [historySortDirection, setHistorySortDirection] = useState("desc");

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPersonnelAssignments = async () => {
      if (!personnelId) {
        setError("Personel ID bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Veri çekme işlemlerini paralel olarak başlat
        const [companiesRes, assignmentsRes] = await Promise.all([
          axiosInstance.get("/locations"),
          axiosInstance.get("/assignments/search", { params: { personnelId } }),
        ]);

        setCompanies(companiesRes.data);
        const assignmentData = assignmentsRes.data;

        if (assignmentData && assignmentData.length > 0) {
          const personnelGroup = assignmentData[0];
          setPersonnelData(personnelGroup);

          // Profil bilgilerini çekmek için ikinci bir paralel istek (opsiyonel)
          axiosInstance
            .get("/users/by-name", {
              params: { name: personnelGroup.personnelName },
            })
            .then((profileRes) => {
              setProfileInfo(profileRes.data);
            })
            .catch((profileErr) => {
              console.warn("Profil bilgileri getirilemedi:", profileErr);
            });
        } else {
          setError("Bu personele ait zimmet kaydı bulunamadı.");
        }
      } catch (err) {
        setError("Veriler getirilirken bir hata oluştu.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonnelAssignments();
  }, [personnelId]);

  // Esc tuşu ile modalı kapatma
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isModalOpen]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!personnelData) {
    return <p>Personel verisi bulunamadı.</p>;
  }

  // Zimmetleri durumlarına göre ayır
  const activeAssignments = personnelData.assignments.filter(
    (a) => a.status === "Zimmetli" || a.status === "Arızalı"
  );

  const pastAssignments = personnelData.assignments.filter(
    (a) => a.status === "İade Edildi" || a.status === "Hurda"
  );

  const handleDetailsClick = (assignment) => {
    setSelectedAssignment(assignment);
    setModalTitle(
      `${assignment.item?.assetType || "Eşya"} (Demirbaş: ${
        assignment.item?.assetTag
      })`
    );
    setIsModalOpen(true);
  };

  // Geçmiş kayıtlarını kullanıcı dostu bir formata çeviren fonksiyon
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
      // Diğer item alanları eklenebilir
    };

    const formatValue = (field, value) => {
      // eslint-disable-next-line eqeqeq
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

  // Formu olan zimmetleri ayır
  const activeAssignmentsWithForms = activeAssignments.filter(
    (a) => a.formPath
  );
  const pastAssignmentsWithForms = pastAssignments.filter((a) => a.formPath);

  const renderFormPreviews = (assignments) => {
    // formPath'e göre benzersiz zimmetleri al
    const uniqueAssignmentsByForm = [
      ...new Map(assignments.map((item) => [item.formPath, item])).values(),
    ];

    return (
      <div className="form-previews-section">
        <h3 className="section-subtitle">Ekli Zimmet Formları</h3>
        <div className="form-previews-grid">
          {uniqueAssignmentsByForm.map((assignment) => (
            <div key={assignment.formPath} className="form-preview-item">
              <a
                href={`http://localhost:5001${assignment.formPath}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Zimmet Formunu Görüntüle"
              >
                <img
                  src={`http://localhost:5001${assignment.formPath}`}
                  alt="Zimmet Formu Önizlemesi"
                />
              </a>
              <div className="form-preview-caption">Zimmet Formu</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Tekrarlayan kart yapısını bir bileşene dönüştürelim
  const AssignmentCard = ({ assignment, isPast = false }) => (
    <div className={`assignment-detail-card ${isPast ? "past" : ""}`}>
      <div className="detail-card-header">
        <h3>{assignment.item.assetType}</h3>
        {!isPast && (
          <span
            className={`status-badge status-${assignment.status
              .toLowerCase()
              .replace(" ", "-")}`}
          >
            {assignment.status}
          </span>
        )}
      </div>
      <div className="detail-card-body">
        <div className="detail-row">
          <span className="detail-label">Marka:</span>
          <span className="detail-value">{assignment.item.brand}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Seri No:</span>
          <span className="detail-value">
            {assignment.item.serialNumber || "-"}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Demirbaş No:</span>
          <span className="detail-value">{assignment.item.assetTag}</span>
        </div>
      </div>
      <div className="detail-card-footer">
        <button
          className="details-link"
          onClick={() => handleDetailsClick(assignment)}
        >
          Tüm Detayları Gör
        </button>
        <span className={isPast ? "return-date" : ""}>
          {isPast ? "İade Tarihi: " : "Zimmet Tarihi: "}{" "}
          {new Date(
            isPast ? assignment.returnDate : assignment.assignmentDate
          ).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="personnel-details-header">
        <div className="header-info">
          <FaUser className="header-icon" />
          <div>
            <h1>{personnelData.personnelName}</h1>
            <p>
              <FaBoxOpen /> {personnelData.assignments.length} adet zimmetli
              ürün bulunuyor.
            </p>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Geri Dön
        </button>
      </div>

      {/* Profil Bilgileri Kartı */}
      <div className="profile-details-card no-print">
        <div className="profile-detail-item">
          <FaEnvelope />
          <span>{profileInfo?.email || "E-posta Bilgisi Yok"}</span>
        </div>
        <div className="profile-detail-item">
          <FaPhone />
          <span>{profileInfo?.phone || "Telefon Bilgisi Yok"}</span>
        </div>
        <div className="profile-detail-item">
          <FaBriefcase />
          <span>{profileInfo?.position || "Pozisyon Bilgisi Yok"}</span>
        </div>
      </div>

      <div className="tab-navigation no-print">
        <button
          className={`tab-button ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Mevcut Zimmetler
          <span className="tab-badge">{activeAssignments.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === "past" ? "active" : ""}`}
          onClick={() => setActiveTab("past")}
        >
          Geçmiş Zimmetler
          <span className="tab-badge">{pastAssignments.length}</span>
        </button>
      </div>

      <div className="tab-content">
        {/* Mevcut Zimmetler Sekmesi */}
        {activeTab === "active" && (
          <div className="assignments-section">
            {activeAssignments.length > 0 ? (
              <div className="details-cards-container">
                {activeAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment._id}
                    assignment={assignment}
                  />
                ))}
              </div>
            ) : (
              <div className="no-assignments-message">
                <p>Personele ait mevcut zimmet bulunmamaktadır.</p>
              </div>
            )}
            {/* Aktif zimmetler için form önizlemeleri */}
            {activeAssignmentsWithForms.length > 0 &&
              renderFormPreviews(activeAssignmentsWithForms)}
          </div>
        )}

        {/* Geçmiş Zimmetler Sekmesi */}
        {activeTab === "past" && (
          <div className="assignments-section">
            {pastAssignments.length > 0 ? (
              <div className="details-cards-container">
                {pastAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment._id}
                    assignment={assignment}
                    isPast={true}
                  />
                ))}
              </div>
            ) : (
              <div className="no-assignments-message">
                <p>Personele ait geçmiş zimmet kaydı bulunmamaktadır.</p>
              </div>
            )}
            {/* Geçmiş zimmetler için form önizlemeleri */}
            {pastAssignmentsWithForms.length > 0 &&
              renderFormPreviews(pastAssignmentsWithForms)}
          </div>
        )}
      </div>

      {personnelData.assignments.length === 0 && (
        <div className="no-assignments-message">
          <FaBoxOpen />
          <p>Bu personele ait herhangi bir zimmet kaydı bulunmamaktadır.</p>
        </div>
      )}

      {/* Detay Modalı */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        size="large"
      >
        {selectedAssignment && (
          <div>
            <div className="modal-detail-container">
              {/* Eşya Bilgileri */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <FaCube /> Eşya Bilgileri
                </h4>
                <div className="modal-detail-grid">
                  <strong>Varlık Cinsi:</strong>
                  <span>{selectedAssignment.item.assetType}</span>
                  <strong>Marka:</strong>
                  <span>{selectedAssignment.item.brand}</span>
                  <strong>Seri No:</strong>
                  <span>{selectedAssignment.item.serialNumber || "-"}</span>
                  <strong>Demirbaş No:</strong>
                  <span>{selectedAssignment.item.assetTag}</span>
                </div>
              </div>

              {/* Zimmet Bilgileri */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <FaInfoCircle /> Zimmet Bilgileri
                </h4>
                <div className="modal-detail-grid">
                  <strong>Durum:</strong>
                  <span>{selectedAssignment.status}</span>
                  <strong>Zimmet Tarihi:</strong>
                  <span>
                    {new Date(
                      selectedAssignment.assignmentDate
                    ).toLocaleDateString()}
                  </span>
                  {selectedAssignment.returnDate && (
                    <>
                      <strong>İade Tarihi:</strong>
                      <span>
                        {new Date(
                          selectedAssignment.returnDate
                        ).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  <strong>Çalıştığı Firma:</strong>
                  <span>{selectedAssignment.company.name}</span>
                </div>
              </div>

              {/* Zimmet Geçmişi */}
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
                    {historySortDirection === "asc" ? (
                      <FaSortUp />
                    ) : (
                      <FaSortDown />
                    )}
                    Tarihe Göre Sırala
                  </button>
                </div>
                <div className="history-log">
                  {selectedAssignment.history &&
                  selectedAssignment.history.length > 0 ? (
                    <ul>
                      {[...selectedAssignment.history] // Create a shallow copy before sorting
                        .sort((a, b) =>
                          historySortDirection === "asc"
                            ? new Date(a.timestamp) - new Date(b.timestamp)
                            : new Date(b.timestamp) - new Date(a.timestamp)
                        )
                        .map((h) => (
                          <div
                            key={h._id || h.timestamp}
                            className="history-item"
                          >
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

              {/* Tüm Detaylar Bölümü */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <FaInfoCircle /> Diğer Tüm Detaylar
                </h4>
                <div className="modal-detail-grid">
                  <strong>Varlık Alt Kategori:</strong>
                  <span>{selectedAssignment.item.assetSubType || "-"}</span>
                  <strong>Sabit Kıymet Cinsi:</strong>
                  <span>{selectedAssignment.item.fixedAssetType || "-"}</span>
                  <strong>Model Yılı:</strong>
                  <span>{selectedAssignment.item.modelYear || "-"}</span>
                  <strong>Mac/IP Adresi:</strong>
                  <span>{selectedAssignment.item.networkInfo || "-"}</span>
                  <strong>Kurulu Programlar:</strong>
                  <span>{selectedAssignment.item.softwareInfo || "-"}</span>
                  <strong>Eşya Açıklaması:</strong>
                  <span>{selectedAssignment.item.description || "-"}</span>
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
                  <span>{selectedAssignment.registeredSection || "-"}</span>
                  <strong>Eski Kullanıcı:</strong>
                  <span>{selectedAssignment.previousUser || "-"}</span>
                  <strong>Zimmet Notları:</strong>
                  <span>{selectedAssignment.assignmentNotes || "-"}</span>
                  <strong>Zimmet Formu:</strong>
                  <span>
                    {selectedAssignment.formPath ? (
                      <a
                        href={`http://localhost:5001${selectedAssignment.formPath}`}
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PersonnelDetailsPage;
