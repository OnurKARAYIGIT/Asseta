import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import Button from "../components/shared/Button";
import ConfirmationModal from "../components/shared/ConfirmationModal";
import CandidateModal from "../components/recruitment/CandidateModal";
import { FaUsers, FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const CandidatesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentItem, setCurrentItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const queryClient = useQueryClient();

  // Veri Çekme
  const {
    data: candidates = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/candidates");
      return data;
    },
  });

  // Veri Değiştirme (Mutations)
  const invalidateCandidatesQuery = () => {
    queryClient.invalidateQueries({ queryKey: ["candidates"] });
  };

  const saveMutation = useMutation({
    mutationFn: (candidateData) => {
      if (modalMode === "edit") {
        return axiosInstance.put(
          `/candidates/${candidateData._id}`,
          candidateData
        );
      } else {
        return axiosInstance.post("/candidates", candidateData);
      }
    },
    onSuccess: () => {
      invalidateCandidatesQuery();
      toast.success(
        `Aday başarıyla ${
          modalMode === "edit" ? "güncellendi" : "oluşturuldu"
        }.`
      );
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "İşlem sırasında bir hata oluştu."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (candidateId) =>
      axiosInstance.delete(`/candidates/${candidateId}`),
    onSuccess: () => {
      invalidateCandidatesQuery();
      toast.warn("Aday başarıyla silindi.");
      setItemToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Silme işlemi başarısız.");
    },
  });

  // Olay Yöneticileri
  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setIsModalOpen(true);
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
          <FaUsers className="text-secondary text-2xl" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
            Aday Havuzu
          </h1>
        </div>
        <Button onClick={() => handleOpenModal("add")} variant="primary">
          <FaPlus className="mr-2" /> Yeni Aday Ekle
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-card-background-light rounded-lg">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                Ad Soyad
              </th>
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                E-posta
              </th>
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                Kaynak
              </th>
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                Telefon No
              </th>
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                Başvurduğu Pozisyonlar
              </th>
              <th className="p-4 text-left text-sm font-semibold text-text-light">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate._id} className="border-b border-gray-700">
                <td className="p-4 text-text-main font-medium">
                  {candidate.fullName}
                </td>
                <td className="p-4 text-text-main">{candidate.email}</td>
                <td className="p-4 text-text-main">{candidate.source}</td>
                <td className="p-4 text-text-main">{candidate.phone || "-"}</td>
                <td className="p-4 text-text-main">
                  {candidate.applications &&
                  candidate.applications.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {candidate.applications.map((app) => (
                        <span key={app._id} className="badge-info text-xs">
                          {app.jobOpening?.title || "Silinmiş İlan"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-text-light">Başvuru Yok</span>
                  )}
                </td>
                <td className="p-4 flex items-center gap-2">
                  <Button
                    onClick={() => handleOpenModal("edit", candidate)}
                    variant="icon"
                    size="sm"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    onClick={() => setItemToDelete(candidate)}
                    variant="icon-danger"
                    size="sm"
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => saveMutation.mutate(data)}
        mode={modalMode}
        currentItem={currentItem}
      />

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Adayı Sil"
        confirmText="Evet, Sil"
        confirmButtonVariant="danger"
      >
        <p>
          <strong>{itemToDelete?.fullName}</strong> adlı adayı silmek
          istediğinizden emin misiniz?
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default CandidatesPage;
