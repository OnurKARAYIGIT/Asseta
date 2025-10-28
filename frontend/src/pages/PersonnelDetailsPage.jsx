import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaBoxOpen } from "react-icons/fa"; // Sadece bu ikon kullanılıyor
import { useAuth } from "../components/AuthContext";
import "./PersonnelDetailsPage.css";
import PersonnelDetailsHeader from "../components/personnel-details/PersonnelDetailsHeader";
import PersonnelInfoCard from "../components/personnel-details/PersonnelInfoCard";
import AssignmentCard from "../components/personnel-details/AssignmentCard";
import AssignmentDetailsModal from "../components/personnel-details/AssignmentDetailsModal";

const PersonnelDetailsPage = () => {
  const { personnelId } = useParams();
  const [activeTab, setActiveTab] = useState("active"); // 'active' veya 'past'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  // --- React Query ile Veri Çekme ---

  // 1. Ana Veri (Zimmetler ve Şirketler)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["personnelDetails", personnelId],
    queryFn: async () => {
      const [companiesRes, assignmentsRes] = await Promise.all([
        axiosInstance.get("/locations"),
        axiosInstance.get("/assignments/search", { params: { personnelId } }),
      ]);

      const assignmentData = assignmentsRes.data;
      if (!assignmentData || assignmentData.length === 0) {
        throw new Error("Bu personele ait zimmet kaydı bulunamadı.");
      }

      return {
        companies: companiesRes.data,
        personnelData: assignmentData[0],
      };
    },
    enabled: !!personnelId, // Sadece URL'de bir personnelId varken sorguyu çalıştır
  });

  // 2. Profil Bilgileri (Ana veri yüklendikten sonra çalışır)
  const personnelName = data?.personnelData?.personnelName;
  const { data: profileInfo } = useQuery({
    queryKey: ["userProfileByName", personnelName],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/users/by-name", {
        params: { name: personnelName },
      });
      return data;
    },
    enabled: !!personnelName, // Sadece personnelName mevcutsa bu sorguyu çalıştır
  });

  // React Query'den gelen verileri bileşenin kullanacağı değişkenlere ata
  const personnelData = data?.personnelData;
  const companies = data?.companies || [];

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

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <p className="error-message">{error.message}</p>;
  }

  if (!personnelData) {
    return <p>Personel verisi bulunamadı.</p>;
  }

  // Zimmetleri durumlarına göre ayır
  const activeAssignments = personnelData.assignments.filter(
    (a) => a.status === "Zimmetli" || a.status === "Arızalı"
  );

  const pastAssignments = personnelData.assignments.filter(
    (a) => a.status === "İade Edildi" || a.status === "Hurda"
  );

  const handleDetailsClick = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  // Formu olan zimmetleri ayır
  const activeAssignmentsWithForms = activeAssignments.filter(
    (a) => a.formPath
  );
  const pastAssignmentsWithForms = pastAssignments.filter((a) => a.formPath);

  const renderFormPreviews = (assignments) => {
    // formPath'e göre benzersiz zimmetleri al
    const uniqueAssignmentsByForm = [
      ...new Map(assignments.map((item) => [item.formPath, item])).values(),
    ];

    return (
      <div className="form-previews-section">
        <h3 className="section-subtitle">Ekli Zimmet Formları</h3>
        <div className="form-previews-grid">
          {uniqueAssignmentsByForm.map((assignment) => (
            <div key={assignment.formPath} className="form-preview-item">
              <a
                href={`http://localhost:5001${assignment.formPath}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Zimmet Formunu Görüntüle"
              >
                <img
                  src={`http://localhost:5001${assignment.formPath}`}
                  alt="Zimmet Formu Önizlemesi"
                />
              </a>
              <div className="form-preview-caption">Zimmet Formu</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <PersonnelDetailsHeader personnelData={personnelData} />

      <div className="personnel-details-layout">
        <PersonnelInfoCard profileInfo={profileInfo} />

        {/* Sağ sütunu oluşturacak olan ana kapsayıcı div */}
        <div className="assignments-container">
          <div className="tab-navigation no-print">
            <button
              className={`tab-button ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              Mevcut Zimmetler
              <span className="tab-badge">{activeAssignments.length}</span>
            </button>
            <button
              className={`tab-button ${activeTab === "past" ? "active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              Geçmiş Zimmetler
              <span className="tab-badge">{pastAssignments.length}</span>
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "active" && (
              <div className="assignments-section">
                {activeAssignments.length > 0 ? (
                  <div className="details-cards-container">
                    {activeAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment._id}
                        assignment={assignment}
                        onDetailsClick={handleDetailsClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-assignments-message">
                    <p>Personele ait mevcut zimmet bulunmamaktadır.</p>
                  </div>
                )}
                {activeAssignmentsWithForms.length > 0 &&
                  renderFormPreviews(activeAssignmentsWithForms)}
              </div>
            )}

            {activeTab === "past" && (
              <div className="assignments-section">
                {pastAssignments.length > 0 ? (
                  <div className="details-cards-container">
                    {pastAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment._id}
                        assignment={assignment}
                        isPast={true}
                        onDetailsClick={handleDetailsClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-assignments-message">
                    <p>Personele ait geçmiş zimmet kaydı bulunmamaktadır.</p>
                  </div>
                )}
                {pastAssignmentsWithForms.length > 0 &&
                  renderFormPreviews(pastAssignmentsWithForms)}
              </div>
            )}
          </div>
        </div>
      </div>

      {personnelData.assignments.length === 0 && (
        <div className="no-assignments-message">
          <FaBoxOpen />
          <p>Bu personele ait herhangi bir zimmet kaydı bulunmamaktadır.</p>
        </div>
      )}

      <AssignmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        companies={companies}
      />
    </div>
  );
};

export default PersonnelDetailsPage;
