import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import Button from "../components/shared/Button";
import ApplicationsTable from "../components/recruitment/ApplicationsTable";
import { FaArrowLeft, FaBuilding, FaBriefcase } from "react-icons/fa";

// TODO: Bu modal daha sonra oluşturulacak
// import ApplicationStatusModal from "../components/recruitment/ApplicationStatusModal";

const JobOpeningDetailPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // İş ilanı detaylarını çek
  const {
    data: jobOpening,
    isLoading: isLoadingOpening,
    isError: isErrorOpening,
  } = useQuery({
    queryKey: ["jobOpening", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/job-openings/${id}`);
      return data;
    },
  });

  // İlana ait başvuruları çek
  const { data: applications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ["applications", { jobOpeningId: id }],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/applications?jobOpening=${id}`
      );
      return data;
    },
    enabled: !!id, // Sadece id varsa bu sorguyu çalıştır
  });

  const handleUpdateStatus = (application) => {
    // setSelectedApplication(application);
    // setStatusModalOpen(true);
    toast.info("Durum güncelleme özelliği yakında eklenecektir.");
  };

  const handleViewCandidateDetails = (candidate) => {
    // TODO: Aday detayları için bir modal veya sayfa açılabilir.
    toast.info(`${candidate.fullName} adayının detayları görüntülenecek.`);
  };

  if (isLoadingOpening) return <Loader />;
  if (isErrorOpening)
    return (
      <div className="text-center text-danger">
        İş ilanı yüklenirken bir hata oluştu.
      </div>
    );

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <Link
        to="/job-openings"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <FaArrowLeft />
        Tüm İş İlanlarına Geri Dön
      </Link>

      {/* İlan Başlık Bilgileri */}
      <div className="mb-8 p-6 bg-card-background-light rounded-lg">
        <h1 className="text-3xl font-bold text-text-main mb-2">
          {jobOpening.title}
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-text-light">
          <span className="flex items-center gap-2">
            <FaBriefcase /> {jobOpening.department}
          </span>
          <span className="flex items-center gap-2">
            <FaBuilding /> {jobOpening.company?.name}
          </span>
        </div>
        <div className="mt-4 prose prose-invert max-w-none text-text-main">
          <h3 className="text-text-secondary">İş Tanımı</h3>
          <p>{jobOpening.description}</p>
          <h3 className="text-text-secondary">Gereksinimler</h3>
          <p>{jobOpening.requirements}</p>
        </div>
      </div>

      {/* Başvurular Bölümü */}
      <div>
        <h2 className="text-2xl font-bold text-text-main mb-4">Başvurular</h2>
        {isLoadingApps ? (
          <Loader />
        ) : (
          <ApplicationsTable
            applications={applications}
            onUpdateStatus={handleUpdateStatus}
            onViewDetails={handleViewCandidateDetails}
          />
        )}
      </div>
    </div>
  );
};

export default JobOpeningDetailPage;
