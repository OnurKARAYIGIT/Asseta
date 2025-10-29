import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import PersonnelDetailsHeader from "../components/personnel-details/PersonnelDetailsHeader";
import PersonnelInfoCard from "../components/personnel-details/PersonnelInfoCard";
import AssignmentCard from "../components/personnel-details/AssignmentCard";
import AssignmentDetailsModal from "../components/personnel-details/AssignmentDetailsModal";

const PersonnelDetailsPage = () => {
  const { personnelId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // --- React Query ile Veri Çekme ---
  const {
    data: personnelData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["personnelDetails", personnelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/assignments/search", {
        params: { personnelId, exact: "true" },
      });

      if (!data || data.length === 0) {
        throw new Error("Bu personele ait zimmet kaydı bulunamadı.");
      }
      return data[0]; // Backend'den gelen ilk ve tek sonucu al
    },
    enabled: !!personnelId,
  });

  // Esc tuşu ile modalı kapatma
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isModalOpen]);

  const handleDetailsClick = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <p className="text-danger p-8">{error.message}</p>;
  }

  if (!personnelData) {
    return <p className="p-8">Personel verisi bulunamadı.</p>;
  }

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <PersonnelDetailsHeader personnel={personnelData} />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PersonnelInfoCard personnel={personnelData} />
        </div>
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold text-text-main mb-4">
            Zimmetli Eşyalar ({personnelData.assignments.length})
          </h3>
          <div className="space-y-4">
            {personnelData.assignments.length > 0 ? (
              personnelData.assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment._id}
                  assignment={assignment}
                  onDetailsClick={handleDetailsClick}
                />
              ))
            ) : (
              <p className="text-text-light">
                Bu personele ait aktif zimmet bulunmamaktadır.
              </p>
            )}
          </div>
        </div>
      </div>
      <AssignmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        companies={[]} // Bu sayfada şirket listesi çekilmediği için boş dizi
      />
    </div>
  );
};

export default PersonnelDetailsPage;
