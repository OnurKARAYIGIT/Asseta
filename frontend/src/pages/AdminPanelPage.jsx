import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance"; // Oluşturduğumuz instance'ı import ediyoruz
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import {
  FaUsersCog,
  FaTrash,
  FaEdit,
  FaSave,
  FaUserPlus,
  FaKey,
  FaUser,
  FaCode,
  FaUserShield,
} from "react-icons/fa";
import { MdEmail, MdPhone, MdWork } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../components/AuthContext";
import ActionDropdown from "../components/ActionDropdown";
import "./AdminPanelPage.css";

const allPermissions = [
  { key: "zimmetler", name: "Zimmetler" },
  { key: "personnel-report", name: "Personel Raporu" },
  { key: "locations", name: "Konumlar" },
  { key: "items", name: "Eşyalar" },
  { key: "audit-logs", name: "Denetim Kayıtları" },
  { key: "admin", name: "Admin Paneli" },
];

const AdminPanelPage = () => {
  const [users, setUsers] = useState([]);
  const [groupedUsers, setGroupedUsers] = useState({
    developers: [],
    admins: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Yeni kullanıcı formu state'leri
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState("user");
  const [formError, setFormError] = useState("");

  // Yetki modal'ı state'leri
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Aksiyon modalları için state'ler
  const [userToDelete, setUserToDelete] = useState(null); // Silme onayı için
  const [userToResetPassword, setUserToResetPassword] = useState(null); // Şifre sıfırlama için
  const [lastActionDetail, setLastActionDetail] = useState(null); // Son işlem detayı için
  const [newPassword, setNewPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");

  const [userPermissions, setUserPermissions] = useState([]);

  // Düzenleme modu state'leri (Artık sadece modal için kullanılacak)
  const [editingUser, setEditingUser] = useState(null);
  const [editedData, setEditedData] = useState({});

  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  // Telefon numarası formatlama ve işleme yardımcı fonksiyonları
  const formatPhoneNumber = (value) => {
    if (!value) return "";
    const phoneNumber = value.replace(/[^\d]/g, "");
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 2) return phoneNumber;
    if (phoneNumberLength < 5) {
      return `${phoneNumber.slice(0, 1)} (${phoneNumber.slice(1)}`;
    }
    if (phoneNumberLength < 8) {
      return `${phoneNumber.slice(0, 1)} (${phoneNumber.slice(
        1,
        4
      )}) ${phoneNumber.slice(4)}`;
    }
    return `${phoneNumber.slice(0, 1)} (${phoneNumber.slice(
      1,
      4
    )}) ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(
      7,
      9
    )} ${phoneNumber.slice(9, 11)}`;
  };

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/users");
      setUsers(data);

      // Kullanıcıları rollerine göre grupla
      const developers = data.filter((u) => u.role === "developer");
      const admins = data.filter((u) => u.role === "admin");
      const users = data.filter((u) => u.role === "user");
      setGroupedUsers({ developers, admins, users });
    } catch (err) {
      setError("Kullanıcılar getirilemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    const intervalId = setInterval(() => {
      fetchUsers();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchUsers]);

  const confirmDeleteHandler = async () => {
    if (!userToDelete) return;
    try {
      await axiosInstance.delete(`/users/${userToDelete._id}`);
      fetchUsers();
      setUserToDelete(null);
    } catch (err) {
      setError("Kullanıcı silinirken bir hata oluştu.");
      setUserToDelete(null);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditedData({
      username: user.username,
      email: user.email,
      phone: user.phone,
      position: user.position,
      role: user.role,
    });
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditedData({});
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const { data: updatedUser } = await axiosInstance.put(
        `/users/${editingUser._id}`,
        editedData
      );
      setUsers(
        users.map((user) =>
          user._id === editingUser._id ? { ...user, ...updatedUser } : user
        )
      );
      setEditingUser(null);
      setEditedData({});
    } catch (err) {
      setError("Kullanıcı güncellenirken bir hata oluştu.");
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/[^\d]/g, "");
      if (digitsOnly.length <= 11) {
        setEditedData({ ...editedData, phone: digitsOnly });
      }
    } else {
      setEditedData({ ...editedData, [name]: value });
    }
  };

  const resetPasswordHandler = async (id, username) => {
    setResetPasswordError("");
    if (!newPassword) {
      setResetPasswordError("Yeni şifre alanı boş bırakılamaz.");
      return;
    }
    try {
      await axiosInstance.put(`/users/${id}/reset-password`, {
        newPassword,
      });

      if (userInfo._id === id) {
        toast.info(
          "Şifreniz başarıyla güncellendi. Lütfen yeni şifrenizle tekrar giriş yapın."
        );
        logout();
        navigate("/login");
      } else {
        toast.success(
          `"${username}" kullanıcısının şifresi başarıyla sıfırlandı.`
        );
        setUserToResetPassword(null);
        setNewPassword("");
      }
    } catch (err) {
      setResetPasswordError("Şifre sıfırlanırken bir hata oluştu.");
    }
  };

  const openPermissionModal = (user) => {
    setSelectedUser(user);
    setUserPermissions(user.permissions || []);
    setIsPermissionModalOpen(true);
  };

  const handlePermissionChange = (permissionKey) => {
    setUserPermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((p) => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const savePermissionsHandler = async () => {
    if (!selectedUser) return;
    try {
      await axiosInstance.put(`/users/${selectedUser._id}`, {
        permissions: userPermissions,
      });

      setUsers(
        users.map((user) =>
          user._id === selectedUser._id
            ? { ...user, permissions: userPermissions }
            : user
        )
      );

      setIsPermissionModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError("Yetkiler güncellenirken bir hata oluştu.");
    }
  };

  const createUserHandler = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await axiosInstance.post("/users/register", {
        username,
        password,
        email,
        phone,
        position,
        role,
      });
      setUsername("");
      setPassword("");
      setEmail("");
      setPhone("");
      setPosition("");
      setRole("user");
      fetchUsers();
      setIsAddUserModalOpen(false);
    } catch (err) {
      setFormError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Kullanıcı oluşturulamadı."
      );
    }
  };

  const getActionPermissions = (targetUser) => {
    const isSelf = targetUser._id === userInfo._id;
    const isRequesterDeveloper = userInfo.role === "developer";
    const isTargetDeveloper = targetUser.role === "developer";

    return {
      // Developer herkesin rolünü değiştirebilir, diğerleri kendilerinin rolünü değiştiremez.
      canChangeRole: isRequesterDeveloper ? true : !isSelf,
      // Developer herkesin yetkisini düzenleyebilir.
      canEditPermissions: isRequesterDeveloper || targetUser.role === "user",
      canResetPassword: isRequesterDeveloper || !isTargetDeveloper,
      canDelete: !isSelf && !isTargetDeveloper,
      canEdit: isRequesterDeveloper || !isTargetDeveloper,
    };
  };

  const RoleDisplay = ({ role }) => {
    const roleInfo = {
      developer: { icon: <FaCode />, className: "role-badge-developer" },
      admin: { icon: <FaUserShield />, className: "role-badge-admin" },
      user: { icon: <FaUser />, className: "role-badge-user" },
    };

    const { icon, className } = roleInfo[role] || roleInfo.user;

    return (
      <div className={`role-badge ${className}`}>
        {icon}
        <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
      </div>
    );
  };

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Bilinmiyor";
    const date = new Date(dateString);
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="page-container">
      <h1>
        <FaUsersCog style={{ color: "var(--secondary-color)" }} /> Admin Paneli
      </h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <div className="admin-panel-header">
            <h2>Kullanıcı Yönetimi</h2>
            <button onClick={() => setIsAddUserModalOpen(true)}>
              <FaUserPlus /> Yeni Kullanıcı Ekle
            </button>
          </div>
          <div className="user-cards-grid">
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
                  getActionPermissions={getActionPermissions}
                  RoleDisplay={RoleDisplay}
                  isOnline={isOnline}
                  formatRelativeTime={formatRelativeTime}
                  handleEdit={handleEdit}
                  openPermissionModal={openPermissionModal}
                  setUserToResetPassword={setUserToResetPassword}
                  setUserToDelete={setUserToDelete}
                />
              ))}
          </div>
        </>
      )}
      {/* Düzenleme Modalı */}
      <Modal
        isOpen={!!editingUser}
        onClose={handleCancel}
        title={`'${editingUser?.username}' Kullanıcısını Düzenle`}
      >
        {editingUser &&
          (() => {
            const permissions = getActionPermissions(editingUser);
            return (
              <form
                className="modal-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="edit-username">Kullanıcı Adı</label>
                    <div className="input-with-icon">
                      <FaUser />
                      <input
                        id="edit-username"
                        type="text"
                        name="username"
                        value={editedData.username || ""}
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">E-posta</label>
                    <div className="input-with-icon">
                      <MdEmail />
                      <input
                        id="edit-email"
                        type="email"
                        name="email"
                        value={editedData.email || ""}
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-phone">Telefon</label>
                    <div className="input-with-icon">
                      <MdPhone />
                      <input
                        id="edit-phone"
                        type="tel"
                        name="phone"
                        value={formatPhoneNumber(editedData.phone || "")}
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-position">Pozisyon</label>
                    <div className="input-with-icon">
                      <MdWork />
                      <input
                        id="edit-position"
                        type="text"
                        name="position"
                        value={editedData.position || ""}
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="edit-role">Rol</label>
                    <div className="input-with-icon">
                      <select
                        id="edit-role"
                        name="role"
                        value={editedData.role || "user"}
                        onChange={handleFieldChange}
                        disabled={!permissions.canChangeRole}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        {userInfo.role === "developer" && (
                          <option value="developer">Developer</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
                <div
                  className="modal-actions"
                  style={{ justifyContent: "flex-end" }}
                >
                  <button type="button" onClick={handleCancel}>
                    İptal
                  </button>
                  <button type="submit" className="primary">
                    <FaSave /> Kaydet
                  </button>
                </div>
              </form>
            );
          })()}
      </Modal>
      {/* Diğer Modallar (Permission, AddUser, Delete, ResetPassword, LastAction) */}
      <Modal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        title={`'${selectedUser?.username}' Yetkileri`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {allPermissions.map((perm) => (
            <label
              key={perm.key}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                checked={userPermissions.includes(perm.key)}
                onChange={() => handlePermissionChange(perm.key)}
                style={{ width: "auto" }}
              />
              {perm.name}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={savePermissionsHandler}>Kaydet</button>
          <button
            onClick={() => setIsPermissionModalOpen(false)}
            style={{ backgroundColor: "var(--secondary-color)" }}
          >
            İptal
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Yeni Kullanıcı Ekle"
      >
        <form className="modal-form" onSubmit={createUserHandler}>
          {formError && <p style={{ color: "red" }}>{formError}</p>}
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="add-username">Kullanıcı Adı</label>
              <div className="input-with-icon">
                <FaUser />
                <input
                  id="add-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="add-email">E-posta Adresi</label>
              <div className="input-with-icon">
                <MdEmail />
                <input
                  id="add-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="add-phone">Telefon Numarası</label>
              <div className="input-with-icon">
                <MdPhone />
                <input
                  id="add-phone"
                  type="tel"
                  value={formatPhoneNumber(phone)}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^\d]/g, "");
                    if (digitsOnly.length <= 11) {
                      setPhone(digitsOnly);
                    }
                  }}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="add-position">Pozisyon</label>
              <div className="input-with-icon">
                <MdWork />
                <input
                  id="add-position"
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="add-password">Şifre</label>
              <div className="input-with-icon">
                <FaKey />
                <input
                  id="add-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="add-role">Rol</label>
              <div className="input-with-icon">
                <select
                  id="add-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {userInfo.role === "developer" && (
                    <option value="developer">Developer</option>
                  )}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="primary">
              <FaUserPlus /> Kullanıcı Oluştur
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Kullanıcıyı Sil"
      >
        <p>
          <strong>{userToDelete?.username}</strong> kullanıcısını kalıcı olarak
          silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            onClick={() => setUserToDelete(null)}
            style={{ backgroundColor: "var(--secondary-color)" }}
          >
            İptal
          </button>
          <button
            onClick={confirmDeleteHandler}
            style={{ backgroundColor: "var(--danger-color)" }}
          >
            Evet, Sil
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={!!userToResetPassword}
        onClose={() => setUserToResetPassword(null)}
        title={`'${userToResetPassword?.username}' Şifresini Sıfırla`}
      >
        <div className="modal-form">
          {resetPasswordError && (
            <p style={{ color: "red" }}>{resetPasswordError}</p>
          )}
          <div className="form-group">
            <label htmlFor="newPassword">Yeni Şifre</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni şifreyi girin"
            />
          </div>
          <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
            <button
              onClick={() => setUserToResetPassword(null)}
              style={{ backgroundColor: "var(--secondary-color)" }}
            >
              İptal
            </button>
            <button
              onClick={() =>
                resetPasswordHandler(
                  userToResetPassword._id,
                  userToResetPassword.username
                )
              }
            >
              Şifreyi Sıfırla
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={!!lastActionDetail}
        onClose={() => setLastActionDetail(null)}
        title="Son İşlem Detayı"
      >
        {lastActionDetail && (
          <div>
            <div className="detail-grid">
              <strong>İşlem Türü:</strong>
              <span>{lastActionDetail.action.replace(/_/g, " ")}</span>

              <strong>Tarih:</strong>
              <span>{formatRelativeTime(lastActionDetail.createdAt)}</span>

              <strong>Detay:</strong>
              <span style={{ whiteSpace: "pre-wrap" }}>
                {lastActionDetail.details}
              </span>
            </div>
            <div
              className="modal-actions"
              style={{ justifyContent: "flex-end" }}
            >
              <button onClick={() => setLastActionDetail(null)}>Kapat</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const UserCard = ({
  user,
  getActionPermissions,
  RoleDisplay,
  handleEdit,
  openPermissionModal,
  setUserToResetPassword,
  setUserToDelete,
  isOnline,
  formatRelativeTime,
}) => {
  const permissions = getActionPermissions(user);

  return (
    <div className={`user-card role-${user.role}`}>
      <div className="user-card-header">
        <div className="user-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <span className="user-name">{user.username}</span>
          <RoleDisplay role={user.role} />
        </div>
        <div className="user-actions">
          <ActionDropdown
            actions={[
              {
                label: "Düzenle",
                icon: <FaEdit />,
                onClick: () => handleEdit(user),
                disabled: !permissions.canEdit,
              },
              {
                label: "Yetkileri Düzenle",
                icon: <FaUserShield />,
                onClick: () => openPermissionModal(user),
                disabled: !permissions.canEditPermissions,
              },
              {
                label: "Şifre Sıfırla",
                icon: <FaKey />,
                onClick: () => setUserToResetPassword(user),
                disabled: !permissions.canResetPassword,
              },
              {
                label: "Sil",
                icon: <FaTrash />,
                onClick: () => setUserToDelete(user),
                disabled: !permissions.canDelete,
              },
            ]}
          />
        </div>
      </div>
      <div className="user-card-body">
        <div className="user-detail-item">
          <MdEmail /> <span>{user.email}</span>
        </div>
        <div className="user-detail-item">
          <MdPhone /> <span>{user.phone}</span>
        </div>
        <div className="user-detail-item">
          <MdWork /> <span>{user.position}</span>
        </div>
      </div>
      <div className="user-card-footer">
        {isOnline(user.lastSeen) ? (
          <div className="status-badge online">
            <div className="dot"></div>
            <span>Online</span>
          </div>
        ) : (
          <div className="status-badge offline">
            <div className="dot"></div>
            <span>Son görülme: {formatRelativeTime(user.lastSeen)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanelPage;
