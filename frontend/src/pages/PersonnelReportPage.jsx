import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaFileAlt } from "react-icons/fa"; // Sadece sayfanın kendi kullandığı ikonlar kaldı
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import PersonnelSearchToolbar from "../components/personnel-report/PersonnelSearchToolbar";
import PersonnelChoices from "../components/personnel-report/PersonnelChoices";
import PersonnelSummaryCard from "../components/personnel-report/PersonnelSummaryCard";
import PersonnelReportDetailModal from "../components/personnel-report/PersonnelReportDetailModal";
import ConfirmationModal from "../components/shared/ConfirmationModal";
import { toast } from "react-toastify";

const PersonnelReportPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(""); // Sorguyu tetiklemek için
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  const { userInfo } = useAuth();
  const reportRef = useRef(); // Yazdırılacak alanı referans almak için
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // --- React Query ile Veri Çekme ---
  const {
    data: searchData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["personnelSearch", submittedSearchTerm],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/assignments/search", {
        params: { personnelName: submittedSearchTerm }, // Düzeltildi: Backend'in beklediği parametre 'personnelName'
      });
      return data;
    },
    enabled: !!submittedSearchTerm, // Sadece bir arama terimi gönderildiğinde çalıştır
  });

  // URL'den gelen arama terimini dinle
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get("keyword");
    if (keyword) {
      // URL'den gelen keyword ile state'leri güncelle ve aramayı tetikle
      setSearchTerm(keyword);
      setSubmittedSearchTerm(keyword);
    }
  }, [location.search]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSubmittedSearchTerm(searchTerm);
  };

  // Kullanıcı listeden bir personel seçtiğinde çalışır.
  const handlePersonnelSelect = (personnelGroup) => {
    // Seçilen personelin adıyla yeni bir arama tetikle
    setSearchTerm(personnelGroup.personnelName);
    setSubmittedSearchTerm(personnelGroup.personnelName);
  };

  // --- Veriyi Render İçinde Türetme ---
  const personnelChoices =
    searchData && searchData.length > 1 ? searchData : [];
  const singleResult =
    searchData && searchData.length === 1 ? searchData[0] : null;
  const results = singleResult ? singleResult.assignments : [];
  const searchedPersonnel = singleResult
    ? singleResult.personnelName
    : submittedSearchTerm;
  const selectedPersonnelId = singleResult ? singleResult.personnelId : null;
  const noResultsFound =
    !isLoading &&
    submittedSearchTerm &&
    (!searchData || searchData.length === 0);

  const handleCardClick = () => {
    if (selectedPersonnelId) {
      // personnelId yerine personnelName'i URL'de kullanmak daha tutarlı olabilir.
      // Backend'in personnelId ile de arama yapabildiğini varsayıyoruz.
      // Eğer `personnelId` bir obje ise, `selectedPersonnelId._id` kullanmak gerekebilir.
      navigate(`/personnel/${selectedPersonnelId}/details`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = (assignment) => {
    setAssignmentToDelete(assignment);
    setIsModalOpen(false); // Detay modalını kapat
  };

  const deleteMutation = useMutation({
    mutationFn: (assignmentId) =>
      axiosInstance.delete(`/assignments/${assignmentId}`),
    onSuccess: () => {
      // Başarılı silme sonrası state'i manuel olarak güncellemek,
      // tüm arama sorgusunu geçersiz kılmaktan daha performanslı olabilir.
      queryClient.invalidateQueries(["personnelSearch", submittedSearchTerm]);
      setAssignmentToDelete(null);
      toast.success("Zimmet kaydı başarıyla silindi.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Silme işlemi başarısız oldu."
      );
      setAssignmentToDelete(null);
    },
  });

  const confirmDeleteHandler = () => {
    if (assignmentToDelete) {
      deleteMutation.mutate(assignmentToDelete._id);
    }
  };

  const handleDetailsClick = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape" && isModalOpen) setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isModalOpen]);

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <FaFileAlt className="text-secondary text-2xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          Personel Zimmet Raporu
        </h1>
      </div>
      <PersonnelSearchToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        loading={isLoading}
        showPrintButton={results.length > 0}
        handlePrint={handlePrint}
      />
      {isError && <p className="error-message no-print">{error.message}</p>}
      <PersonnelChoices
        choices={personnelChoices}
        onSelect={handlePersonnelSelect}
      />

      {results.length > 0 && (
        <div ref={reportRef}>
          <PersonnelSummaryCard
            results={results}
            searchedPersonnel={searchedPersonnel}
            onClick={handleCardClick}
          />
        </div>
      )}

      {noResultsFound && (
        <p>"{submittedSearchTerm}" adına kayıtlı zimmet bulunamadı.</p>
      )}

      <PersonnelReportDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        onUpdateNavigate={(id) => navigate(`/assignment/${id}/edit`)}
        onDelete={handleDelete}
        userInfo={userInfo}
      />

      <ConfirmationModal
        isOpen={!!assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        onConfirm={confirmDeleteHandler}
        title="Zimmet Kaydını Silme Onayı"
      >
        <p>
          Bu zimmet kaydını kalıcı olarak silmek istediğinizden emin misiniz? Bu
          işlem geri alınamaz.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default PersonnelReportPage;
