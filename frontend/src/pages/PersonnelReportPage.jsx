import React, { useState, useRef, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import "./AssignmentsPage.css"; // Mevcut tablo stillerini kullanıyoruz
import "./PersonnelReportPage.css";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import {
  FaFileAlt,
  FaPrint,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUser,
  FaBoxOpen,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const PersonnelReportPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searchedPersonnel, setSearchedPersonnel] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState(null); // Raporlanan personelin ID'sini tut
  const [personnelChoices, setPersonnelChoices] = useState([]); // Birden fazla personel bulunduğunda seçim için
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const { userInfo } = useAuth();
  const reportRef = useRef(); // Yazdırılacak alanı referans almak için
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) {
      setError("Lütfen bir personel adı girin.");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    setPersonnelChoices([]); // Her yeni aramada seçimleri temizle

    try {
      const { data: personnelGroups } = await axiosInstance.get(
        "/assignments/search",
        {
          params: { personnelName: searchTerm },
        }
      );

      // Backend artık gruplanmış veri döndürüyor.
      // personnelGroups = [{ personnelId, personnelName, assignments: [...] }, ...]
      if (!personnelGroups || personnelGroups.length === 0) {
        setSearchedPersonnel(searchTerm); // Sonuç yoksa, aranan terimi göster.
        setResults([]);
      } else {
        if (personnelGroups.length > 1) {
          // Birden fazla personel bulundu, kullanıcıya seçtir.
          setPersonnelChoices(personnelGroups); // Backend'den gelen tüm personel gruplarını state'e ata
        } else {
          // Sadece bir personel bulundu, raporu direkt göster.
          const singlePersonnelGroup = personnelGroups[0];
          setResults(singlePersonnelGroup.assignments);
          setSearchedPersonnel(singlePersonnelGroup.personnelName);
          setSelectedPersonnelId(singlePersonnelGroup.personnelId); // Personel ID'sini sakla
        }
      }
    } catch (err) {
      setError("Arama sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı listeden bir personel seçtiğinde çalışır.
  const handlePersonnelSelect = (personnelGroup) => {
    setPersonnelChoices([]); // Seçim listesini gizle
    // API'den zaten gelen veriyi doğrudan kullan, yeni bir istek yapma.
    setResults(personnelGroup.assignments);
    setSearchedPersonnel(personnelGroup.personnelName);
    setSelectedPersonnelId(personnelGroup.personnelId); // Seçilen personelin ID'sini sakla
  };

  const handleCardClick = () => {
    if (selectedPersonnelId) {
      navigate(`/personnel/${selectedPersonnelId}/details`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRowClick = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

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

  const deleteHandler = async (id) => {
    if (
      window.confirm("Bu zimmet kaydını silmek istediğinizden emin misiniz?")
    ) {
      try {
        await axiosInstance.delete(`/assignments/${id}`);
        setIsModalOpen(false);
        // Arama sonuçlarını yeniden filtreleyerek güncelle
        setResults(results.filter((r) => r._id !== id));
      } catch (err) {
        // Hata yönetimi eklenebilir
        console.error("Silme işlemi sırasında bir hata oluştu.");
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header no-print">
        <h1>
          <FaFileAlt style={{ color: "var(--secondary-color)" }} /> Personel
          Zimmet Raporu
        </h1>
      </div>
      <div className="filter-toolbar no-print">
        <form onSubmit={handleSearch} className="search-form">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Personel adı veya soyadını yazarak arama yapın..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Aranıyor..." : "Ara"}
          </button>
        </form>
        {results.length > 0 && (
          <button onClick={handlePrint} className="print-button no-print">
            <FaPrint /> Yazdır
          </button>
        )}
      </div>
      {error && <p className="error-message no-print">{error}</p>}

      {/* Birden fazla personel bulunduğunda seçim ekranı */}
      {personnelChoices.length > 0 && (
        <div className="personnel-choices-container no-print">
          <h4>Arama Kriterinize Uyan Birden Fazla Personel Bulundu</h4>
          <p>Lütfen raporunu görüntülemek istediğiniz personeli seçin:</p>
          <div className="personnel-choices-list">
            {personnelChoices.map((p) => (
              <button
                key={p.personnelId || p.personnelName} // Benzersiz bir anahtar kullan
                onClick={() => handlePersonnelSelect(p)}
                className="choice-button"
              >
                <span className="choice-name">{p.personnelName}</span>
                <span className="choice-badge">
                  {p.assignments.length} zimmet
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div ref={reportRef}>
          <div
            className="report-summary-card no-print"
            onClick={handleCardClick}
            style={{ cursor: "pointer" }}
            title="Bu personele ait tüm zimmetleri görmek için tıklayın"
          >
            <div className="card-avatar-section">
              <FaUser />
            </div>
            <div className="card-details-section">
              <div className="card-main-info">
                <h2>{searchedPersonnel}</h2>
                <p>Personel Zimmet Özeti</p>
              </div>
              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-value">{results.length}</span>
                  <span className="stat-label">Toplam Zimmet</span>
                </div>
                <div className="stat-item locations">
                  <span className="stat-label">Bulunduğu Konumlar</span>
                  <div className="location-tags">
                    {[...new Set(results.map((r) => r.company.name))].map(
                      (loc) => (
                        <span key={loc} className="location-tag">
                          {loc}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && searchedPersonnel && results.length === 0 && (
        <p>"{searchedPersonnel}" adına kayıtlı zimmet bulunamadı.</p>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Zimmet Detayı"
      >
        {selectedAssignment && (
          <div>
            <div className="detail-grid">
              <strong>Çalıştığı Firma:</strong>
              <span>{selectedAssignment.company.name}</span>
              <strong>Varlık Alt Kategori:</strong>
              <span>{selectedAssignment.item.assetSubType}</span>
              <strong>Varlık Cinsi:</strong>
              <span>{selectedAssignment.item.assetType}</span>
              <strong>Kayıtlı Bölüm:</strong>
              <span>{selectedAssignment.registeredSection}</span>
              <strong>Demirbaş No:</strong>
              <span>{selectedAssignment.item.assetTag}</span>
              <strong>Bulunduğu Birim:</strong>
              <span>{selectedAssignment.unit}</span>
              <strong>Bulunduğu Yer:</strong>
              <span>{selectedAssignment.location}</span>
              <strong>Kullanıcı Adı:</strong>
              <span>{selectedAssignment.personnelName}</span>
              <strong>Sabit Kıymet Cinsi:</strong>
              <span>{selectedAssignment.item.fixedAssetType}</span>
              <strong>Marka:</strong>
              <span>{selectedAssignment.item.brand}</span>
              <strong>Özellik:</strong>
              <span>{selectedAssignment.item.description}</span>
              <strong>Model Yılı:</strong>
              <span>{selectedAssignment.item.modelYear}</span>
              <strong>Seri No:</strong>
              <span>{selectedAssignment.item.serialNumber}</span>
              <strong>Mac/IP Adresi:</strong>
              <span>{selectedAssignment.item.networkInfo}</span>
              <strong>Kurulu Programlar:</strong>
              <span>{selectedAssignment.item.softwareInfo}</span>
              <strong>Eski Kullanıcı:</strong>
              <span>{selectedAssignment.previousUser}</span>
              <strong>Açıklama:</strong>
              <span>{selectedAssignment.assignmentNotes}</span>
              <strong>Zimmet Tarihi:</strong>
              <span>
                {new Date(
                  selectedAssignment.assignmentDate
                ).toLocaleDateString()}
              </span>
              <strong>Zimmet Formu:</strong>
              <span>
                {selectedAssignment.formPath ? (
                  <a
                    href={`http://localhost:5001${selectedAssignment.formPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Formu Görüntüle
                  </a>
                ) : (
                  "Yüklenmemiş"
                )}
              </span>
              <strong>Son Güncelleme:</strong>
              <span>
                {new Date(
                  selectedAssignment.assignmentDate
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="modal-actions">
              <button
                onClick={() =>
                  navigate(`/assignment/${selectedAssignment._id}/edit`)
                }
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FaEdit /> Güncelle
              </button>
              {(userInfo.role === "admin" || userInfo.role === "developer") && (
                <button
                  onClick={() => deleteHandler(selectedAssignment._id)}
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PersonnelReportPage;
