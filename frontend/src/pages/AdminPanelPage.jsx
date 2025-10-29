import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import "./AdminPanelPage.css"; // Yeni CSS dosyasını import et
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../components/AuthContext";
import UserCard from "../components/admin/UserCard";
import AdminToolbar from "../components/admin/AdminToolbar";
import AddUserModal from "../components/admin/AddUserModal";
import EditUserModal from "../components/admin/EditUserModal";
import EditPermissionsModal from "../components/admin/EditPermissionsModal";
import ResetPasswordModal from "../components/admin/ResetPasswordModal";
import ConfirmationModal from "../components/shared/ConfirmationModal"; // ConfirmationModal'ı import et

const allPermissions = [
  { key: "zimmetler", name: "Zimmetler" },
  { key: "personnel-report", name: "Personel Raporu" },
  { key: "item-report", name: "Eşya Raporu" },
  { key: "locations", name: "Konumlar" },
  { key: "items", name: "Eşyalar" },
  { key: "audit-logs", name: "Denetim Kayıtları" },
  { key: "admin", name: "Admin Paneli" },
];

const AdminPanelPage = () => {
  // Modal state'leri
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- React Query ile Veri Çekme ---
  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/users");
      return data;
    },
    refetchInterval: 30000, // 30 saniyede bir veriyi arka planda tazele
  });

  // --- React Query ile Veri Değiştirme (Mutations) ---

  // Kullanıcı listesini geçersiz kılıp yeniden çekilmesini sağlayan yardımcı fonksiyon
  const invalidateUsersQuery = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  // Kullanıcı Ekleme
  const createUserMutation = useMutation({
    mutationFn: (newUserData) =>
      axiosInstance.post("/users/register", newUserData),
    onSuccess: () => {
      invalidateUsersQuery();
      toast.success("Yeni kullanıcı başarıyla oluşturuldu.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Kullanıcı oluşturulamadı.");
    },
  });

  // Kullanıcı Silme
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => axiosInstance.delete(`/users/${userId}`),
    onSuccess: () => {
      invalidateUsersQuery();
      toast.success("Kullanıcı başarıyla silindi.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Kullanıcı silinirken bir hata oluştu."
      );
    },
  });

  // Kullanıcı Güncelleme
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updatedData }) =>
      axiosInstance.put(`/users/${userId}`, updatedData),
    onSuccess: () => {
      invalidateUsersQuery();
      toast.success("Kullanıcı bilgileri güncellendi.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          "Kullanıcı güncellenirken bir hata oluştu."
      );
    },
  });

  // Şifre Sıfırlama
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }) =>
      axiosInstance.put(`/users/${userId}/reset-password`, { newPassword }),
  });

  // Yetki Güncelleme
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }) =>
      axiosInstance.put(`/users/${userId}`, { permissions }),
    onSuccess: () => {
      invalidateUsersQuery();
      toast.success("Yetkiler başarıyla güncellendi.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          "Yetkiler güncellenirken bir hata oluştu."
      );
    },
  });

  // --- Olay Yöneticileri (Event Handlers) ---

  const confirmDeleteHandler = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete._id, {
        onSuccess: () => setUserToDelete(null),
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleSave = async (userToUpdate, updatedData) => {
    updateUserMutation.mutate(
      { userId: userToUpdate._id, updatedData },
      { onSuccess: () => setEditingUser(null) }
    );
  };

  const resetPasswordHandler = async (user, newPassword) => {
    try {
      await resetPasswordMutation.mutateAsync({
        userId: user._id,
        newPassword,
      });

      if (userInfo._id === user._id) {
        toast.info(
          "Şifreniz başarıyla güncellendi. Lütfen yeni şifrenizle tekrar giriş yapın."
        );
        logout();
        navigate("/login");
      } else {
        toast.success(
          `"${user.username}" kullanıcısının şifresi başarıyla sıfırlandı.`
        );
      }
      return true; // Başarılı olursa modal'a true döndür
    } catch (error) {
      toast.error("Şifre sıfırlanırken bir hata oluştu.");
      return false; // Başarısız olursa false döndür
    }
  };

  const openPermissionModal = (user) => {
    setSelectedUser(user);
    setIsPermissionModalOpen(true);
  };

  const savePermissionsHandler = async (user, newPermissions) => {
    updatePermissionsMutation.mutate(
      { userId: user._id, permissions: newPermissions },
      {
        onSuccess: () => {
          setIsPermissionModalOpen(false);
          setSelectedUser(null);
        },
      }
    );
  };

  const createUserHandler = async (newUserData) => {
    try {
      await createUserMutation.mutateAsync(newUserData);
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="admin-panel-page dark">
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p style={{ color: "red" }}>{error.message}</p>
      ) : (
        <div className="admin-panel-container">
          <AdminToolbar onAddNewUser={() => setIsAddUserModalOpen(true)} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users
              .slice() // State'i doğrudan değiştirmemek için kopyasını oluştur
              .sort((a, b) => {
                const roleOrder = { developer: 1, admin: 2, user: 3 };
                return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
              })
              .map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  currentUser={userInfo}
                  onEdit={handleEdit}
                  onEditPermissions={openPermissionModal}
                  onResetPassword={setUserToResetPassword}
                  onDelete={setUserToDelete}
                />
              ))}
          </div>
        </div>
      )}
      {/* MODALLAR */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSave={handleSave}
        currentUser={userInfo}
      />
      <EditPermissionsModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        user={selectedUser}
        onSave={savePermissionsHandler}
        allPermissions={allPermissions}
      />
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={createUserHandler}
        currentUserRole={userInfo.role}
      />
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteHandler}
        confirmText="Evet, Sil"
        confirmButtonVariant="danger"
        title="Kullanıcı Silme Onayı"
      >
        <p>
          <strong>{userToDelete?.username}</strong> kullanıcısını kalıcı olarak
          silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
      </ConfirmationModal>
      <ResetPasswordModal
        isOpen={!!userToResetPassword}
        onClose={() => setUserToResetPassword(null)}
        user={userToResetPassword}
        onReset={resetPasswordHandler}
      />
    </div>
  );
};

export default AdminPanelPage;
