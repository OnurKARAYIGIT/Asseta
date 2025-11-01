import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import "./AssignmentsPage.css"; // Pagination stilleri için gerekli
import { toast } from "react-toastify";
import { useAuth } from "../components/AuthContext";
import { usePendingCount } from "../contexts/PendingCountContext";
import PendingAssignmentsHeader from "../components/pending-assigments/PendingAssignmentsHeader";
import PersonnelAssignmentAccordion from "../components/pending-assigments/PersonnelAssignmentAccordion";
import PendingAssignmentsPagination from "../components/pending-assigments/PendingAssignmentsPagination";
import ApproveAssignmentModal from "../components/pending-assigments/ApproveAssignmentModal";
import ConfirmationModal from "../components/shared/ConfirmationModal"; // Reddetme için ConfirmationModal kullanacağız

const PendingAssignmentsPage = () => {
  const [selectedUserForApproval, setSelectedUserForApproval] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [userToReject, setUserToReject] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  // Sayfalama için state'ler
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { refetchPendingCount } = usePendingCount();
  const { userInfo } = useAuth();
  const queryClient = useQueryClient();

  // --- React Query ile Veri Çekme ---
  const {
    data: pendingData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["pendingAssignments", { currentPage, itemsPerPage }],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/assignments/pending-grouped", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
        },
      });
      return data;
    },
    keepPreviousData: true,
  });

  // React Query'den gelen verileri bileşenin kullanacağı değişkenlere ata
  const personnelGroups = pendingData?.assignments || [];
  const totalPages = pendingData?.pages || 1;

  // --- React Query ile Veri Değiştirme (Mutations) ---
  const invalidatePendingAssignments = () => {
    queryClient.invalidateQueries({ queryKey: ["pendingAssignments"] });
    refetchPendingCount();
  };

  const approveMutation = useMutation({
    mutationFn: async ({ formFile, assignments }) => {
      const fileFormData = new FormData();
      fileFormData.append("form", formFile);

      const { data: uploadData } = await axiosInstance.post(
        "/upload",
        fileFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const approvalPromises = assignments.map((assignment) =>
        axiosInstance.put(`/assignments/${assignment._id}`, {
          status: "Zimmetli",
          formPath: uploadData.filePath,
        })
      );

      return Promise.all(approvalPromises);
    },
    onSuccess: () => {
      toast.success("Zimmet başarıyla onaylandı.");
      invalidatePendingAssignments();
      setSelectedUserForApproval(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          "Onaylama işlemi sırasında bir hata oluştu."
      );
    },
    onSettled: () => {
      setIsApproving(false);
    },
  });

  const handleApprove = async (formFile) => {
    if (!selectedUserForApproval || !formFile) {
      toast.error("Lütfen imzalı zimmet formunu yükleyin.");
      return;
    }

    setIsApproving(true);
    approveMutation.mutate({
      formFile,
      assignments: selectedUserForApproval.assignments,
    });
  };

  const handleReject = (personnelName, assignments) => {
    setUserToReject({ personnelName, assignments });
  };

  const rejectMutation = useMutation({
    mutationFn: (assignments) => {
      const rejectionPromises = assignments.map((assignment) =>
        axiosInstance.delete(`/assignments/${assignment._id}`)
      );
      return Promise.all(rejectionPromises);
    },
    onSuccess: () => {
      toast.success("Zimmet talebi başarıyla reddedildi ve silindi.");
      invalidatePendingAssignments();
      setUserToReject(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          `Reddetme işlemi sırasında bir hata oluştu.`
      );
      setUserToReject(null);
    },
  });

  const confirmRejectHandler = async () => {
    if (!userToReject) return;
    rejectMutation.mutate(userToReject.assignments);
  };

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <PendingAssignmentsHeader />
      {isLoading ? (
        <Loader />
      ) : error ? (
        <p className="text-red-500">{error.message}</p>
      ) : (
        <div className="space-y-4">
          {personnelGroups.map((group) => (
            <PersonnelAssignmentAccordion
              key={group.personnelName}
              group={group}
              isExpanded={expandedUser === group.personnelName}
              toggleExpansion={setExpandedUser}
              onReject={handleReject}
              onApprove={setSelectedUserForApproval} // Sadece modalı açmak için
            />
          ))}
        </div>
      )}

      <PendingAssignmentsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

      <ApproveAssignmentModal
        isOpen={!!selectedUserForApproval}
        onClose={() => setSelectedUserForApproval(null)}
        selectedUserForApproval={selectedUserForApproval}
        onApprove={handleApprove}
        isApproving={isApproving}
      />

      <ConfirmationModal
        isOpen={!!userToReject}
        onClose={() => setUserToReject(null)}
        onConfirm={confirmRejectHandler}
        confirmText="Evet, Reddet ve Sil"
        confirmButtonVariant="danger"
        title="Zimmet Talebini Reddet"
      >
        <p>
          <strong>{userToReject?.personnelName}</strong> personeline ait{" "}
          <strong>{userToReject?.assignments.length} adet</strong> zimmet
          talebini reddetmek istediğinizden emin misiniz? Bu işlem, ilgili tüm
          zimmet kayıtlarını kalıcı olarak silecektir.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default PendingAssignmentsPage;
