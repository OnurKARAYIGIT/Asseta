import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

import Loader from "../Loader";
import PendingAssignmentsHeader from "./PendingAssignmentsHeader";
import PendingAssignmentsToolbar from "./PendingAssignmentsToolbar";
import PendingAssignmentCard from "./PendingAssignmentCard";
import Pagination from "../shared/Pagination"; // Bu yol zaten doğru
import ConfirmationModal from "../shared/ConfirmationModal"; // Bu yol zaten doğru
import { usePendingCount } from "../../contexts/PendingCountContext";

const PendingAssignmentsPage = () => {
  const queryClient = useQueryClient();
  const { refetchPendingCount } = usePendingCount();

  // State'ler
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState(new Set());
  const [actionToConfirm, setActionToConfirm] = useState(null); // { action: 'approve' | 'reject', ids: [...] }

  // Veri Çekme - Sayfalama mantığı eklendi
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pending-assignments", currentPage], // queryKey artık currentPage'e bağlı
    queryFn: async () => {
      const { data } = await axiosInstance.get("/assignments/pending-grouped", {
        params: { page: currentPage, limit: 10 }, // API'ye sayfa ve limit gönder
      });
      return data;
    },
    keepPreviousData: true, // Sayfa geçişlerinde eski veriyi koru
  });

  // Backend'den gelen veri yapısına göre düzenleme
  const groupedAssignments = data?.assignments || [];
  const totalPages = data?.pages || 1;
  const totalItems = data?.total || 0;

  // Veri Değiştirme (Mutations)
  const invalidateAndRefetch = () => {
    // Seçimleri temizle ve mevcut sayfayı yeniden yükle
    setSelectedPersonnelIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["pending-assignments"] });
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
    refetchPendingCount();
  };

  const approveMutation = useMutation({
    mutationFn: (assignmentIds) =>
      axiosInstance.put("/assignments/approve-multiple", { assignmentIds }),
    onSuccess: () => {
      toast.success("Seçilen zimmetler başarıyla onaylandı.");
      invalidateAndRefetch();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Onaylama işlemi başarısız."),
  });

  const rejectMutation = useMutation({
    mutationFn: (assignmentIds) =>
      axiosInstance.post("/assignments/reject-multiple", { assignmentIds }),
    onSuccess: () => {
      toast.warn("Seçilen zimmetler reddedildi.");
      invalidateAndRefetch();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Reddetme işlemi başarısız."),
  });

  // Olay Yöneticileri (Event Handlers)
  const handleSelectionChange = (personnelId, isSelected) => {
    setSelectedPersonnelIds((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(personnelId);
      } else {
        newSet.delete(personnelId);
      }
      return newSet;
    });
  };

  const getAssignmentIdsFromSelection = () => {
    return groupedAssignments
      .filter((group) => selectedPersonnelIds.has(group._id))
      .flatMap((group) => group.assignments.map((a) => a._id));
  };

  const handleApproveSelected = () => {
    const idsToApprove = getAssignmentIdsFromSelection();
    if (idsToApprove.length > 0) {
      setActionToConfirm({
        action: "approve",
        ids: idsToApprove,
        type: "seçilen",
      });
    }
  };

  const handleRejectSelected = () => {
    const idsToReject = getAssignmentIdsFromSelection();
    if (idsToReject.length > 0) {
      setActionToConfirm({
        action: "reject",
        ids: idsToReject,
        type: "seçilen",
      });
    }
  };

  const handleConfirmAction = () => {
    if (!actionToConfirm) return;
    const { action, ids } = actionToConfirm;
    if (action === "approve") {
      approveMutation.mutate(ids);
    } else if (action === "reject") {
      rejectMutation.mutate(ids);
    }
    setActionToConfirm(null);
    setSelectedPersonnelIds(new Set()); // İşlem sonrası seçimi temizle
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-red-500">Hata: {error.message}</p>;
  }

  return (
    <div className="p-6 sm:p-8">
      <PendingAssignmentsHeader totalItems={totalItems} />
      {groupedAssignments.length > 0 ? (
        <>
          <PendingAssignmentsToolbar
            onApproveSelected={handleApproveSelected}
            onRejectSelected={handleRejectSelected}
            selectedCount={selectedPersonnelIds.size}
          />
          <div className="space-y-4">
            {groupedAssignments.map((group) => (
              <PendingAssignmentCard
                key={group.personnel?._id || group._id}
                group={group}
                onApprove={(ids) =>
                  setActionToConfirm({ action: "approve", ids, type: "tümü" })
                }
                onReject={(ids) =>
                  setActionToConfirm({ action: "reject", ids, type: "tümü" })
                }
                isSelected={selectedPersonnelIds.has(group._id)}
                onSelectionChange={handleSelectionChange}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-6"
          />
        </>
      ) : (
        <p className="text-center text-text-secondary mt-10">
          Onay bekleyen zimmet bulunmamaktadır.
        </p>
      )}

      <ConfirmationModal
        isOpen={!!actionToConfirm}
        onClose={() => setActionToConfirm(null)}
        onConfirm={handleConfirmAction}
        title={`Zimmetleri ${
          actionToConfirm?.action === "approve" ? "Onaylama" : "Reddetme"
        } Onayı`}
        confirmText={`Evet, ${
          actionToConfirm?.action === "approve" ? "Onayla" : "Reddet"
        }`}
        confirmButtonVariant={
          actionToConfirm?.action === "approve" ? "success" : "danger"
        }
      >
        <p>
          {actionToConfirm?.ids.length} adet zimmeti{" "}
          {actionToConfirm?.action === "approve" ? "onaylamak" : "reddetmek"}{" "}
          istediğinizden emin misiniz?
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default PendingAssignmentsPage;
