import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import AssignmentEditForm from "../components/assignments/AssignmentEditForm";

const AssignmentEditPage = () => {
  const { id: assignmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [updateError, setUpdateError] = useState("");

  // --- React Query ile Veri Çekme ---
  const {
    data: assignment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/assignments/${assignmentId}`);
      return data;
    },
    enabled: !!assignmentId,
    onSuccess: (data) => {
      // Veri başarıyla çekildiğinde form state'lerini doldur
      setStatus(data.status);
      setAssignmentNotes(data.assignmentNotes || "");
      if (data.returnDate) {
        setReturnDate(data.returnDate.substring(0, 10));
      }
    },
  });

  // --- React Query ile Veri Güncelleme ---
  const updateMutation = useMutation({
    mutationFn: (updatedData) =>
      axiosInstance.put(`/assignments/${assignmentId}`, updatedData),
    onSuccess: () => {
      // Başarılı güncelleme sonrası ilgili sorguları geçersiz kıl
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      toast.success("Zimmet başarıyla güncellendi.");
      navigate("/zimmetler");
    },
    onError: (err) => {
      setUpdateError(
        err.response?.data?.message || "Güncelleme sırasında bir hata oluştu."
      );
    },
  });

  const submitHandler = async (e) => {
    e.preventDefault();
    setUpdateError("");
    updateMutation.mutate({ status, returnDate, assignmentNotes });
  };

  return (
    <div className="page-container">
      <h1>Zimmet Detayı ve Güncelleme</h1>
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p style={{ color: "red" }}>{error.message}</p>
      ) : (
        assignment && (
          <AssignmentEditForm
            assignment={assignment}
            status={status}
            setStatus={setStatus}
            returnDate={returnDate}
            setReturnDate={setReturnDate}
            assignmentNotes={assignmentNotes}
            setAssignmentNotes={setAssignmentNotes}
            onSubmit={submitHandler}
            updateError={updateError}
          />
        )
      )}
    </div>
  );
};

export default AssignmentEditPage;
