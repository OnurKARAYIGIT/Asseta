import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom"; // Bu hala gerekli
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaBoxOpen, FaPlus } from "react-icons/fa";
import { useAuth } from "../components/AuthContext";
import Modal from "../components/Modal";
import ConfirmationModal from "../components/shared/ConfirmationModal"; // ConfirmationModal'ı import et
import ItemForm from "../components/ItemForm"; // Yeni form bileşenini import et
import { useSettings } from "../hooks/SettingsContext";
import { toast } from "react-toastify";
import "./AssignmentsPage.css"; // Tablo stilleri için
import * as XLSX from "xlsx";
// Yeni oluşturduğumuz bileşenleri import edelim
import ItemsToolbar from "../components/items/ItemsToolbar";
import ItemsTable from "../components/items/ItemsTable";
import ItemsPagination from "../components/items/ItemsPagination";
import ItemHistoryModal from "../components/items/ItemHistoryModal"; // Yeni history modal'ı import et

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
  // Filtreleme ve sayfalama için lokal state'ler
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Modal state'leri
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

  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' veya 'edit'
  const [currentItem, setCurrentItem] = useState(initialItemState);
  const [submitError, setSubmitError] = useState("");
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { settings } = useSettings();
  const itemsPerPage = settings.itemsPerPage || 15;
  const { userInfo } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Arama terimini gecikmeli olarak güncelle
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- React Query ile Veri Çekme ---
  const {
    data: itemsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "items",
      {
        currentPage,
        itemsPerPage,
        statusFilter,
        assetTypeFilter,
        debouncedSearchTerm,
      },
    ],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        assetType: assetTypeFilter,
        keyword: debouncedSearchTerm,
      };
      const { data } = await axiosInstance.get("/items", { params });
      return data;
    },
    keepPreviousData: true,
  });

  // React Query'den gelen verileri bileşenin kullanacağı değişkenlere ata
  const items = itemsData?.items || [];
  const totalItems = itemsData?.totalItems || 0;
  const totalPages = itemsData?.pages || 1;

  // --- React Query ile Veri Değiştirme (Mutations) ---
  const invalidateItemsQuery = () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
  };

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

  const itemMutation = useMutation({
    mutationFn: async ({ mode, data }) => {
      if (mode === "add") {
        return axiosInstance.post("/items", data);
      } else {
        return axiosInstance.put(`/items/${data._id}`, data);
      }
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Eşya başarıyla ${
          variables.mode === "add" ? "eklendi" : "güncellendi"
        }.`
      );
      invalidateItemsQuery();
      handleCloseModal();
    },
    onError: (err) => {
      setSubmitError(err.response?.data?.message || "Bir hata oluştu.");
    },
  });

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

    itemMutation.mutate({ mode: modalMode, data: currentItem });
  };

  const handleHistoryClick = async (item) => {
    setSelectedItemForHistory(item);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
  };

  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => axiosInstance.delete(`/items/${itemId}`),
    onSuccess: () => {
      toast.success("Eşya başarıyla silindi.");
      invalidateItemsQuery();
      setItemToDelete(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Eşya silinirken bir hata oluştu."
      );
      setItemToDelete(null);
    },
  });

  const confirmDeleteHandler = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete._id);
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
      {isLoading ? (
        <Loader />
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <ItemsToolbar
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            assetTypeFilter={assetTypeFilter}
            setAssetTypeFilter={setAssetTypeFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleExport={handleExport}
            assetTypesList={assetTypesList}
          />
          <div className="record-count-container">
            <span>
              Toplam <strong>{totalItems}</strong> kayıt bulundu.
            </span>
          </div>
          <ItemsTable
            items={items}
            userInfo={userInfo}
            handleOpenModal={handleOpenModal}
            handleDeleteClick={handleDeleteClick}
            handleHistoryClick={handleHistoryClick}
          />
          <ItemsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            items={items}
          />
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
      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeleteHandler}
        confirmText="Evet, Sil"
        confirmButtonVariant="danger"
        title="Eşyayı Silme Onayı"
      >
        <p>
          <strong>{itemToDelete?.name}</strong> (Demirbaş No:{" "}
          {itemToDelete?.assetTag}) eşyasını kalıcı olarak silmek istediğinizden
          emin misiniz? Bu işlem geri alınamaz.
        </p>
      </ConfirmationModal>

      <ItemHistoryModal
        isOpen={!!selectedItemForHistory}
        onClose={() => setSelectedItemForHistory(null)}
        item={selectedItemForHistory}
      />
    </div>
  );
};

export default ItemsPage;
