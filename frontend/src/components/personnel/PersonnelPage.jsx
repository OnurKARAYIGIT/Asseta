import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaUsers } from "react-icons/fa";
import { toast } from "react-toastify";

import PersonnelFormModal from "../components/personnel/PersonnelFormModal.jsx";
import PersonnelToolbar from "../components/personnel/PersonnelToolbar.jsx";
import PersonnelTable from "../components/personnel/PersonnelTable.jsx";
import PersonnelPagination from "../components/personnel/PersonnelPagination.jsx";

const PersonnelPage = () => {
  // State'ler
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentItem, setCurrentItem] = useState(null);

  const queryClient = useQueryClient();

  // Arama terimini gecikmeli olarak güncelle (performans için)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- React Query ile Veri Çekme ---
  const {
    data: personnelData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["personnelList", { currentPage, debouncedSearchTerm }],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: 15, // Şimdilik sabit, daha sonra ayarlardan alınabilir
        keyword: debouncedSearchTerm,
      };
      const { data } = await axiosInstance.get("/personnel/list", { params });
      return data;
    },
    keepPreviousData: true,
  });

  // React Query'den gelen verileri değişkenlere ata
  const personnel = personnelData?.personnel || [];
  const totalPages = personnelData?.pages || 1;
  const totalPersonnel = personnelData?.total || 0;

  // --- React Query ile Veri Değiştirme (Mutations) ---
  const savePersonnelMutation = useMutation({
    mutationFn: (personnelData) => {
      if (modalMode === "edit") {
        // _id'yi payload'dan ayırıp URL'e ekliyoruz
        const { _id, ...data } = personnelData;
        return axiosInstance.put(`/personnel/${_id}`, data);
      } else {
        return axiosInstance.post("/personnel", personnelData);
      }
    },
    onSuccess: () => {
      toast.success(
        `Personel başarıyla ${
          modalMode === "edit" ? "güncellendi" : "kaydedildi"
        }.`
      );
      queryClient.invalidateQueries({ queryKey: ["personnelList"] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "İşlem sırasında bir hata oluştu."
      );
    },
  });

  // Modal açma/kapama fonksiyonları
  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSubmit = (formData) => {
    savePersonnelMutation.mutate(formData);
  };

  if (isLoading) return <Loader />;
  if (isError) return <p className="text-red-500">{error.message}</p>;

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <FaUsers className="text-secondary text-2xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          Personel Yönetimi
        </h1>
      </div>

      <PersonnelToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddNew={() => handleOpenModal("add")}
      />

      <PersonnelTable
        personnel={personnel}
        onEdit={(item) => handleOpenModal("edit", item)}
      />

      <PersonnelPagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

      <PersonnelFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        mode={modalMode}
        currentItem={currentItem}
      />
    </div>
  );
};

export default PersonnelPage;
