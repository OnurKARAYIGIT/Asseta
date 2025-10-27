import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaBoxOpen, FaPlus, FaEdit, FaTrash, FaSave } from "react-icons/fa";
import {
  FaFileExcel,
  FaCheckCircle,
  FaTrashAlt,
  FaTimesCircle,
  FaHistory,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";
import { useAuth } from "../components/AuthContext";
import Modal from "../components/Modal";
import ItemForm from "../components/ItemForm"; // Yeni form bileşenini import et
import { useSettings } from "../hooks/SettingsContext";
import { useItems } from "../hooks/useItems"; // Oluşturduğumuz hook'u import et
import { toast } from "react-toastify";
import "./AssignmentsPage.css"; // Tablo stilleri için
import * as XLSX from "xlsx";

const assetTypesList = [
  "Masaüstü Bilgisayar",
  "Laptop",
  "Tablet",
  "Monitör",
  "Bilgisayar Bileşenleri",
  "Yazıcı ve Fotokopi Makinası",
  "Network Ürünleri",
  "UPS Güç Kaynakları",
  "Taşınabilir Depolama Üniteleri",
  "Kayıt Cihazları",
  "Görüntüleme Cihazları",
  "Projeksiyon Cihazları",
  "E-İmza Cihazları",
  "El Terminal Cihazları",
  "PDKS Sistem Cihazları",
  "Ses Sistem Cihazları",
  "TV Üniteleri",
  "Sabit ve Telsiz Telefonlar",
  "Cep Telefonları",
  "Klimalar",
  "Isıtıcılar ve Radyatörler",
  "Ölçü Aletleri",
  "Güvenlik Kontrol Cihazları",
  "Büro Malzemeleri",
  "Elektrikli El Aletleri",
];

const ItemsPage = () => {
  const {
    items,
    loading,
    error,
    currentPage,
    setCurrentPage,
    totalItems,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    statusFilter,
    setStatusFilter,
    assetTypeFilter,
    setAssetTypeFilter,
    searchTerm,
    setSearchTerm,
    refetchItems,
  } = useItems();

  const initialItemState = {
    name: "",
    assetType: "",
    assetSubType: "",
    brand: "",
    fixedAssetType: "",
    assetTag: "",
    modelYear: "",
    serialNumber: "",
    networkInfo: "",
    softwareInfo: "",
    description: "",
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' veya 'edit'
  const [currentItem, setCurrentItem] = useState(initialItemState);
  const [submitError, setSubmitError] = useState("");
  // Eşya Geçmişi Modalı için state'ler
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { settings } = useSettings();
  const { userInfo } = useAuth();
  const location = useLocation();

  // URL'deki filtre parametrelerini okuyup state'i güncelle
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusFromUrl = params.get("status") || "";
    const assetTypeFromUrl = params.get("assetType") || "";

    // URL'den gelen filtreleri doğrudan state'e ata.
    // Bu, useItems hook'unun yeni filtrelerle veri çekmesini tetikleyecektir.
    setStatusFilter(statusFromUrl);
    setAssetTypeFilter(assetTypeFromUrl);
  }, [location.search, setStatusFilter, setAssetTypeFilter]);

  const handleFormChange = (e) => {
    setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSubmitError("");
    if (mode === "add") {
      setCurrentItem(initialItemState);
    } else {
      setCurrentItem({ ...item });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(initialItemState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const validationError = await validateItemData(
      currentItem,
      modalMode === "edit" ? currentItem._id : null
    );

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    try {
      if (modalMode === "add") {
        await axiosInstance.post("/items", currentItem);
        toast.success("Eşya başarıyla eklendi.");
      } else {
        await axiosInstance.put(`/items/${currentItem._id}`, currentItem);
        toast.success("Eşya başarıyla güncellendi.");
      }
      refetchItems();
      handleCloseModal();
    } catch (err) {
      setSubmitError(
        err.response && err.response.data.message
          ? err.response.data.message
          : err.message
      );
    }
  };

  const handleHistoryClick = async (item) => {
    setSelectedItemForHistory(item);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      // Backend'e sadece bu eşyanın demirbaş numarasına göre tüm zimmetleri getirmesi için istek at
      const { data } = await axiosInstance.get("/assignments", {
        params: {
          assetTag: item.assetTag, // Backend'in bu parametreyi işlemesi gerekiyor
          limit: 1000, // Tüm geçmişi al
          status: "all", // Beklemedekiler dahil tüm durumları getir
        },
      });
      setHistoryData(data.assignments);
    } catch (err) {
      toast.error("Eşya geçmişi getirilirken bir hata oluştu.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
  };

  const confirmDeleteHandler = async () => {
    if (!itemToDelete) return;
    try {
      await axiosInstance.delete(`/items/${itemToDelete._id}`);
      refetchItems(); // Silme sonrası listeyi yeniden çek
      setItemToDelete(null);
      toast.success("Eşya başarıyla silindi.");
    } catch (err) {
      toast.error(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Eşya silinirken bir hata oluştu."
      );
      setItemToDelete(null);
    }
  };

  const handleExport = async () => {
    try {
      // Sayfalama olmadan tüm eşyaları çek
      const { data } = await axiosInstance.get("/items", {
        params: { limit: 100000, keyword: searchTerm }, // Yüksek bir limit
      });

      const dataToExport = data.items.map((item) => ({
        "Eşya Adı": item.name,
        "Varlık Cinsi": item.assetType,
        "Varlık Alt Kategori": item.assetSubType,
        "Sabit Kıymet Cinsi": item.fixedAssetType,
        "Marka / Model": item.brand,
        "Demirbaş No": item.assetTag,
        "Model Yılı": item.modelYear,
        "Seri Numarası": item.serialNumber,
        "Ağ Bilgileri (MAC/IP)": item.networkInfo,
        "Yazılım Bilgileri": item.softwareInfo,
        "Açıklama / Özellik": item.description,
        "Oluşturulma Tarihi": new Date(item.createdAt).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0056B3" } },
      };
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = headerStyle;
      }
      ws["!freeze"] = { y: 1 }; // Başlık satırını dondur

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Eşyalar");
      XLSX.writeFile(wb, "Esya_Listesi.xlsx");
    } catch (err) {
      toast.error("Veriler dışa aktarılırken bir hata oluştu.");
      console.error("Excel export error:", err);
    }
  };

  // Form verilerini doğrulamak için yardımcı fonksiyon
  const validateItemData = async (data, itemId = null) => {
    const { name, assetType, modelYear, assetTag, serialNumber } = data;

    if (!name.trim() || !assetType.trim()) {
      return "Eşya Adı ve Varlık Cinsi alanları zorunludur.";
    }

    if (modelYear && !/^\d{4}$/.test(modelYear)) {
      return "Model Yılı 4 haneli bir sayı olmalıdır (örn: 2023).";
    }

    // Demirbaş No ve Seri No benzersizlik kontrolü
    if (assetTag) {
      const { data: uniqueData } = await axiosInstance.post(
        "/items/check-unique",
        { field: "assetTag", value: assetTag, itemId }
      );
      if (!uniqueData.isUnique) {
        return "Bu Demirbaş Numarası zaten başka bir eşya için kayıtlı.";
      }
    }

    if (serialNumber) {
      const { data: uniqueData } = await axiosInstance.post(
        "/items/check-unique",
        { field: "serialNumber", value: serialNumber, itemId }
      );
      if (!uniqueData.isUnique) {
        return "Bu Seri Numarası zaten başka bir eşya için kayıtlı.";
      }
    }
    return null; // Hata yok
  };

  // Sayfalama için gösterilecek sayfa aralığını hesaplayan fonksiyon
  const getPaginationRange = () => {
    const maxVisibleButtons = 5;
    if (totalPages <= maxVisibleButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisibleButtons / 2)
    );
    let endPage = startPage + maxVisibleButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisibleButtons + 1;
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <FaBoxOpen style={{ color: "var(--secondary-color)" }} /> Eşya
          Yönetimi
        </h1>
        {userInfo &&
          (userInfo.role === "admin" || userInfo.role === "developer") && (
            <button onClick={() => handleOpenModal("add")}>
              <FaPlus style={{ marginRight: "0.5rem" }} />
              Yeni Eşya Ekle
            </button>
          )}
      </div>
      {loading ? (
        <Loader />
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <div className="filter-toolbar no-print">
            <div className="toolbar-group">
              <div className="tab-buttons">
                <button
                  className={statusFilter === "" ? "active" : ""}
                  onClick={() => setStatusFilter("")}
                >
                  Tümü
                </button>
                <button
                  className={statusFilter === "assigned" ? "active" : ""}
                  onClick={() => setStatusFilter("assigned")}
                >
                  Zimmetli
                </button>
                <button
                  className={statusFilter === "arizali" ? "active" : ""}
                  onClick={() => setStatusFilter("arizali")}
                >
                  Arızalı
                </button>
                <button
                  className={statusFilter === "beklemede" ? "active" : ""}
                  onClick={() => setStatusFilter("beklemede")}
                >
                  Beklemede
                </button>
                <button
                  className={statusFilter === "unassigned" ? "active" : ""}
                  onClick={() => setStatusFilter("unassigned")}
                >
                  Boşta
                </button>
                <button
                  className={statusFilter === "hurda" ? "active" : ""}
                  onClick={() => setStatusFilter("hurda")}
                >
                  Hurda
                </button>
              </div>
            </div>
            <div className="toolbar-group">
              <select
                value={assetTypeFilter}
                onChange={(e) => setAssetTypeFilter(e.target.value)}
              >
                <option value="">Tüm Varlık Cinsleri</option>
                {assetTypesList.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="toolbar-group">
              <input
                type="text"
                placeholder="Eşya ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: "250px" }}
              />
            </div>
            <button
              onClick={handleExport}
              style={{ backgroundColor: "#1D6F42" }}
            >
              <FaFileExcel style={{ marginRight: "0.5rem" }} /> Excel'e Aktar
            </button>
          </div>
          <div className="record-count-container">
            <span>
              Toplam <strong>{totalItems}</strong> kayıt bulundu.
            </span>
          </div>
          <div className="table-container">
            <h2>Mevcut Eşyalar</h2>
            <table>
              <thead>
                <tr>
                  <th>Eşya Adı</th>
                  <th>Varlık Cinsi</th>
                  <th>Durum</th>
                  <th>Marka</th>
                  <th>Demirbaş No</th>
                  <th>Seri No</th>
                  <th>Açıklama</th>
                  {(userInfo?.role === "admin" ||
                    userInfo?.role === "developer") && <th>İşlemler</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.assetType}</td>
                    <td>
                      <div>
                        {(() => {
                          switch (item.assignmentStatus) {
                            case "Zimmetli":
                              return (
                                <span className="status-badge status-zimmetli">
                                  <FaCheckCircle /> Zimmetli
                                </span>
                              );
                            case "Arızalı":
                              return (
                                <span className="status-badge status-arizali">
                                  <FaExclamationTriangle /> Arızalı
                                </span>
                              );
                            case "Beklemede":
                              return (
                                <span className="status-badge status-beklemede">
                                  <FaClock /> Beklemede
                                </span>
                              );
                            case "Hurda":
                              return (
                                <span className="status-badge status-hurda">
                                  <FaTrashAlt /> Hurda
                                </span>
                              );
                            default: // Boşta
                              return (
                                <span className="status-badge status-unassigned">
                                  <FaTimesCircle /> Boşta
                                </span>
                              );
                          }
                        })()}
                      </div>
                    </td>
                    <td>{item.brand || "-"}</td>
                    <td>{item.assetTag || "-"}</td>
                    <td>{item.serialNumber || "-"}</td>
                    <td>{item.description || "-"}</td>
                    {userInfo &&
                      (userInfo.role === "admin" ||
                        userInfo.role === "developer") && (
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              title="Düzenle"
                              onClick={() => handleOpenModal("edit", item)}
                              style={{ padding: "8px 12px" }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              title="Sil"
                              onClick={() => handleDeleteClick(item)}
                              style={{
                                backgroundColor: "var(--danger-color)",
                                padding: "8px 12px",
                              }}
                            >
                              <FaTrash />
                            </button>
                            <button
                              title="Geçmişi Görüntüle"
                              onClick={() => handleHistoryClick(item)}
                              style={{
                                padding: "8px 12px",
                                color: "var(--secondary-color)",
                              }}
                            >
                              <FaHistory />
                            </button>
                          </div>
                        </td>
                      )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination no-print">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &laquo; Geri
              </button>
              {getPaginationRange().map((number) => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={currentPage === number ? "active" : ""}
                >
                  {number}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || items.length === 0}
              >
                İleri &raquo;
              </button>
            </div>
          )}
        </>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === "add" ? "Yeni Eşya Ekle" : "Eşyayı Düzenle"}
      >
        <ItemForm
          formData={currentItem}
          onFormChange={handleFormChange}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
          assetTypesList={assetTypesList}
          submitError={submitError}
          mode={modalMode}
        />
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Eşyayı Sil"
      >
        <p>
          <strong>{itemToDelete?.name}</strong> (Demirbaş No:{" "}
          {itemToDelete?.assetTag}) eşyasını kalıcı olarak silmek istediğinizden
          emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            onClick={() => setItemToDelete(null)}
            style={{ backgroundColor: "var(--secondary-color)" }}
          >
            İptal
          </button>
          <button
            onClick={confirmDeleteHandler}
            style={{ backgroundColor: "var(--danger-color)" }}
          >
            Evet, Sil
          </button>
        </div>
      </Modal>

      {/* Eşya Geçmişi Modalı */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`${selectedItemForHistory?.name || "Eşya"} - Zimmet Geçmişi`}
        size="large"
      >
        {historyLoading ? (
          <Loader />
        ) : (
          <div className="table-container" style={{ maxHeight: "60vh" }}>
            <table className="summary-item-history-table">
              <thead>
                <tr>
                  <th>Personel</th>
                  <th>Durum</th>
                  <th>Zimmet Tarihi</th>
                  <th>İade Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {historyData.length > 0 ? (
                  historyData
                    .sort(
                      (a, b) =>
                        new Date(b.assignmentDate) - new Date(a.assignmentDate)
                    )
                    .map((assign) => (
                      <tr key={assign._id}>
                        <td>{assign.personnelName}</td>
                        <td>{assign.status}</td>
                        <td>
                          {new Date(assign.assignmentDate).toLocaleDateString()}
                        </td>
                        <td>
                          {assign.returnDate
                            ? new Date(assign.returnDate).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      Bu eşyaya ait zimmet geçmişi bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ItemsPage;
