import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { FaUserShield } from "react-icons/fa";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import ProfileInfoCard from "../components/profile/ProfileInfoCard";
import ProfileAssignmentsTable from "../components/profile/ProfileAssignmentsTable";
import ProfileActionsTable from "../components/profile/ProfileActionsTable";
import ChangePasswordModal from "../components/profile/ChangePasswordModal";
import ProfileAssignmentDetailModal from "../components/profile/ProfileAssignmentDetailModal";

import "./ProfilePage.css"; // Yeni CSS dosyasını import et
import "./AssignmentsPage.css"; // Tablo stilleri için gerekli

const ProfilePage = () => {
  // Modal state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  // --- React Query ile Veri Çekme ---
  const {
    data: profileData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/users/profile");
      return data;
    },
    enabled: !!userInfo?.token, // Sadece kullanıcı giriş yapmışsa sorguyu çalıştır
  });

  // --- React Query ile Veri Değiştirme (Mutations) ---
  const passwordMutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }) =>
      axiosInstance.put("/users/profile/password", {
        oldPassword,
        newPassword,
      }),
    onSuccess: () => {
      toast.info(
        "Şifreniz başarıyla güncellendi. Lütfen yeni şifrenizle tekrar giriş yapın."
      );
      logout();
      navigate("/login");
    },
  });

  const submitHandler = async (oldPassword, newPassword) => {
    try {
      await passwordMutation.mutateAsync({ oldPassword, newPassword });
      return true; // Başarılı olursa modal'a true döndür
    } catch (err) {
      // Hata mesajı ChangePasswordModal içinde yönetiliyor,
      // ama yine de modal'a işlemin başarısız olduğunu bildirmeliyiz.
      return false; // Başarısız olursa false döndür
    }
  };

  const handleRowClick = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  return (
    <div className="page-container">
      <h1>
        <FaUserShield style={{ color: "var(--secondary-color)" }} />{" "}
        {profileData?.personnel?.fullName}
      </h1>
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p style={{ color: "red" }}>{error.message}</p>
      ) : (
        <div className="profile-grid">
          {" "}
          {/* Inline flex stillerini kaldırıp CSS sınıfını kullanıyoruz */}
          {/* Bileşenler artık doğrudan grid elemanları olacak */}
          <ProfileInfoCard
            profileData={profileData}
            onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
          />
          {/* No need for extra divs here, the components themselves have the card classes */}
          <ProfileAssignmentsTable
            assignments={profileData?.assignments}
            onRowClick={handleRowClick}
          />
          <ProfileActionsTable actions={profileData?.actions} />
        </div>
      )}
      <ProfileAssignmentDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        onUpdateNavigate={(id) => navigate(`/assignment/${id}/edit`)}
      />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={submitHandler}
      />
    </div>
  );
};

export default ProfilePage;
