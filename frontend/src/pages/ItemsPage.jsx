import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import Button from "../components/shared/Button";
import ConfirmationModal from "../components/shared/ConfirmationModal";
import ItemFormModal from "../components/items/ItemFormModal";
import ItemHistoryModal from "../components/items/ItemHistoryModal"; // YENİ
import { FaBoxOpen, FaPlus, FaEdit, FaTrash, FaHistory } from "react-icons/fa";

const ItemsPage = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // YENİ
  const [modalMode, setModalMode] = useState("add");
  const [currentItem, setCurrentItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const queryClient = useQueryClient();

  // Veri Çekme
  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/items");
      return data;
    },
  });

  // Veri Değiştirme (Mutations)
  const invalidateItemsQuery = () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
  };

  const saveMutation = useMutation({
    mutationFn: (itemData) => {
      if (modalMode === "edit") {
        return axiosInstance.put(`/items/${itemData._id}`, itemData);
      } else {
        return axiosInstance.post("/items", itemData);
      }
    },
    onSuccess: () => {
      invalidateItemsQuery();
      toast.success(
        `Eşya başarıyla ${
          modalMode === "edit" ? "güncellendi" : "oluşturuldu"
        }.`
      );
      setIsFormModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "İşlem sırasında bir hata oluştu."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId) => axiosInstance.delete(`/items/${itemId}`),
    onSuccess: () => {
      invalidateItemsQuery();
      toast.warn("Eşya başarıyla silindi.");
      setItemToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Silme işlemi başarısız.");
    },
  });

  // Olay Yöneticileri
  const handleOpenFormModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setIsFormModalOpen(true);
  };

  // YENİ: Geçmiş modalını açan fonksiyon
  const handleOpenHistoryModal = (item) => {
    setCurrentItem(item);
    setIsHistoryModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete._id);
    }
  };

  if (isLoading) return <Loader />;
  if (isError) return <p className="text-danger">{error.message}</p>;

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <FaBoxOpen className="text-secondary text-2xl" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
            Eşya Envanteri
          </h1>
        </div>
        <Button onClick={() => handleOpenFormModal("add")} variant="primary">
          <FaPlus className="mr-2" /> Yeni Eşya Ekle
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-card-background-light rounded-lg">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                Eşya Adı
              </th>
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                Demirbaş No
              </th>
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                Durum
              </th>
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-b border-gray-700">
                <td className="p-4 text-text-main font-medium">{item.name}</td>
                <td className="p-4 text-text-main font-mono">
                  {item.assetTag}
                </td>
                <td className="p-4 text-text-main">{item.status}</td>
                <td className="p-4 flex items-center gap-2">
                  <Button
                    onClick={() => handleOpenHistoryModal(item)}
                    variant="icon"
                    size="sm"
                    title="Zimmet Geçmişi"
                  >
                    <FaHistory />
                  </Button>
                  <Button
                    onClick={() => handleOpenFormModal("edit", item)}
                    variant="icon"
                    size="sm"
                    title="Düzenle"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    onClick={() => setItemToDelete(item)}
                    variant="icon-danger"
                    size="sm"
                    title="Sil"
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ItemFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={(data) => saveMutation.mutate(data)}
        mode={modalMode}
        currentItem={currentItem}
      />

      <ItemHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        item={currentItem}
      />

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eşyayı Sil"
        confirmText="Evet, Sil"
        confirmButtonVariant="danger"
      >
        <p>
          <strong>{itemToDelete?.name}</strong> adlı eşyayı silmek
          istediğinizden emin misiniz?
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default ItemsPage;
