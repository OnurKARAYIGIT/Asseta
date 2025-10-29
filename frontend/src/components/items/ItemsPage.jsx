import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom"; // Bu hala gerekli
import axiosInstance from "../../api/axiosInstance";
import Loader from "../Loader";
import { FaBoxOpen, FaPlus, FaFileExcel } from "react-icons/fa";
import { useAuth } from "../AuthContext";
import Modal from "../Modal";
import ConfirmationModal from "../shared/ConfirmationModal"; // ConfirmationModal'ı import et
import ItemForm from "../ItemForm"; // Yeni form bileşenini import et
import { useSettings } from "../../hooks/SettingsContext";
import { useItemMutations } from "../../hooks/useItemMutations"; // Yeni hook'u import et
import { toast } from "react-toastify";
// Yeni oluşturduğumuz bileşenleri import edelim
import ItemsToolbar from "./ItemsToolbar";
import ItemsTable from "./ItemsTable";
import ItemsPagination from "./ItemsPagination";
import ItemHistoryModal from "./ItemHistoryModal"; // Yeni history modal'ı import et
import { validateItemData } from "../../utils/itemValidator"; // Doğrulama fonksiyonunu import et
import Button from "../shared/Button";

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
  const { userInfo, hasPermission } = useAuth();

  // Arama terimini gecikmeli olarak güncelle
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentItem(initialItemState);
  }, [initialItemState]);

  // --- Custom Hook ile Mutation Yönetimi ---
  const { saveItem, deleteItem } = useItemMutations({
    onSuccessCallback: handleCloseModal, // Başarılı olunca modal'ı kapat
  });
  const location = useLocation();

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
  const totalItems = itemsData?.total || 0;
  const totalPages = itemsData?.pages || 1;

  // URL'deki filtre parametrelerini okuyup state'i güncelle
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusFromUrl = params.get("status") || "";
    const assetTypeFromUrl = params.get("assetType") || "";

    // URL'den gelen filtreleri doğrudan state'e ata.
    // Bu, useItems hook'unun yeni filtrelerle veri çekmesini tetikleyecektir.
    setStatusFilter(statusFromUrl);
    setAssetTypeFilter(assetTypeFromUrl); // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await saveItem({ mode: modalMode, data: currentItem });
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const handleHistoryClick = async (item) => {
    setSelectedItemForHistory(item);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
  };

  const confirmDeleteHandler = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete._id, { onSuccess: () => setItemToDelete(null) });
    }
  };

  const handleExport = async () => {
    try {
      // Sayfalama olmadan tüm eşyaları çek
      const params = {
        keyword: debouncedSearchTerm,
        status: statusFilter,
        assetType: assetTypeFilter,
        // Backend'e tüm veriyi çekmesi için bir işaret gönderebiliriz,
        // örneğin 'export=true' veya 'limit=all'
        limit: "all", // Backend'de bu parametreyi kontrol etmelisiniz
      };

      // Backend'den Excel dosyasını doğrudan indirme isteği
      const response = await axiosInstance.get("/items/export", {
        params,
        responseType: "blob", // Yanıtın bir blob (ikili veri) olarak gelmesini sağlar
      });

      // Dosyayı indirmek için bir URL oluştur
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Backend'den gelen Content-Disposition başlığından dosya adını alabiliriz
      // veya varsayılan bir ad kullanabiliriz.
      link.setAttribute("download", "Esya_Listesi.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Eşya listesi başarıyla dışa aktarıldı.");
    } catch (err) {
      toast.error("Veriler dışa aktarılırken bir hata oluştu.");
      console.error("Excel export error:", err);
    }
  };

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      {isLoading ? (
        <Loader />
      ) : error ? (
        <p className="text-red-500">{error.message}</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <FaBoxOpen className="text-secondary text-2xl" />
              <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
                Eşya Yönetimi
              </h1>
            </div>
            {hasPermission("items") && (
              <Button
                onClick={() => handleOpenModal("add")}
                className="w-full sm:w-auto"
              >
                <FaPlus className="mr-2" />
                Yeni Eşya Ekle
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden">
            <ItemsToolbar
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              assetTypeFilter={assetTypeFilter}
              setAssetTypeFilter={setAssetTypeFilter}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              assetTypesList={assetTypesList}
            />
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="text-sm text-text-light whitespace-nowrap">
                Toplam <strong>{totalItems}</strong> kayıt
              </div>
              <Button
                variant="excel"
                onClick={handleExport}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <FaFileExcel /> Excel'e Aktar
              </Button>
            </div>
          </div>
          <ItemsTable
            items={items}
            handleOpenModal={handleOpenModal}
            handleDeleteClick={handleDeleteClick}
            handleHistoryClick={handleHistoryClick}
          />
          <ItemsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === "add" ? "Yeni Eşya Ekle" : "Eşyayı Düzenle"}
        size="xlarge"
        variant="form"
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
