import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import { FaBriefcase, FaPlus } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

import Loader from "../components/Loader";
import Button from "../components/shared/Button";
import ConfirmationModal from "../components/shared/ConfirmationModal";
import JobOpeningCard from "../components/recruitment/JobOpeningCard";
import JobOpeningModal from "../components/recruitment/JobOpeningModal";

const JobOpeningsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation(); // YENİ: URL bilgilerini almak için

  // YENİ: URL'den 'status' parametresini al
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = searchParams.get("status");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentItem, setCurrentItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Veri Çekme
  const {
    data: jobOpenings = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["jobOpenings"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/job-openings");
      return data;
    },
  });

  // Veri Değiştirme (Mutations)
  const saveMutation = useMutation({
    mutationFn: (jobData) => {
      if (modalMode === "edit") {
        const { _id, ...data } = jobData;
        return axiosInstance.put(`/job-openings/${_id}`, data);
      } else {
        return axiosInstance.post("/job-openings", jobData);
      }
    },
    onSuccess: () => {
      toast.success(
        `İş ilanı başarıyla ${
          modalMode === "edit" ? "güncellendi" : "oluşturuldu"
        }.`
      );
      queryClient.invalidateQueries({ queryKey: ["jobOpenings"] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "İşlem sırasında bir hata oluştu."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (jobId) => axiosInstance.delete(`/job-openings/${jobId}`),
    onSuccess: () => {
      toast.warn("İş ilanı başarıyla silindi.");
      queryClient.invalidateQueries({ queryKey: ["jobOpenings"] });
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

  const handleViewDetails = (job) => {
    // TODO: İlan detay sayfasına yönlendirme yapılacak.
    // navigate(`/recruitment/job-openings/${job._id}`);
    toast.info(`${job.title} ilanının detayları yakında görüntülenebilecek.`);
  };

  // YENİ: Gelen verilere göre filtreleme yap
  const filteredJobOpenings = React.useMemo(() => {
    if (!statusFilter) return jobOpenings;
    return jobOpenings.filter((job) => job.status === statusFilter);
  }, [jobOpenings, statusFilter]);

  if (isLoading) return <Loader />;
  if (isError) return <p className="text-danger">{error.message}</p>;

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <FaBriefcase className="text-secondary text-2xl" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
            İş İlanları
          </h1>
        </div>
        <Button onClick={() => handleOpenModal("add")} variant="primary">
          <FaPlus className="mr-2" /> Yeni İlan Oluştur
        </Button>
      </div>

      {filteredJobOpenings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobOpenings.map((job) => (
            <JobOpeningCard
              key={job._id}
              job={job}
              onEdit={() => handleOpenModal("edit", job)}
              onDelete={() => setItemToDelete(job)}
              onView={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-light py-8">
          Henüz oluşturulmuş bir iş ilanı bulunmuyor.
        </p>
      )}

      <JobOpeningModal
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
        title="İlan Silme Onayı"
        confirmText="Evet, Sil"
        confirmButtonVariant="danger"
      >
        <p>
          <strong>{itemToDelete?.title}</strong> başlıklı iş ilanını kalıcı
          olarak silmek istediğinizden emin misiniz?
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default JobOpeningsPage;
