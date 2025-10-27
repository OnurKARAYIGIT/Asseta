import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  FaUserShield,
  FaSave,
  FaEdit,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaClock,
  FaHistory,
  FaUserTag,
} from "react-icons/fa";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

import "./ProfilePage.css"; // Yeni CSS dosyasını import et

const ProfilePage = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Profil verileri state'leri
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }

    try {
      const { data } = await axiosInstance.put("/users/profile/password", {
        oldPassword,
        newPassword,
      });

      // Şifre başarıyla güncellendiğinde kullanıcıyı bilgilendir ve çıkış yap.
      toast.info(
        "Şifreniz başarıyla güncellendi. Değişikliklerin geçerli olması için lütfen tekrar giriş yapın."
      );
      logout();
      navigate("/login");
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Şifre güncellenirken bir hata oluştu."
      );
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await axiosInstance.get("/users/profile");
        setProfileData(data);
      } catch (err) {
        setError("Profil bilgileri getirilemedi.");
      } finally {
        setLoading(false);
      }
    };

    if (userInfo && userInfo.token) {
      fetchUserProfile();
    }
  }, [userInfo?.token]);

  const handleRowClick = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  return (
    <div className="page-container">
      <h1>
        <FaUserShield style={{ color: "var(--secondary-color)" }} />{" "}
        {profileData?.username}
      </h1>
      {loading ? (
        <Loader />
      ) : (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div className="profile-card profile-info-card">
              <h2>Kullanıcı Bilgileri</h2>
              <div className="profile-detail-item">
                <FaEnvelope style={{ color: "#007bff" }} />
                <span>{profileData?.email}</span>
              </div>
              <div className="profile-detail-item">
                <FaPhone style={{ color: "#28a745" }} />
                <span>{profileData?.phone}</span>
              </div>
              <div className="profile-detail-item">
                <FaBriefcase style={{ color: "#6f42c1" }} />
                <span>{profileData?.position}</span>
              </div>
              <div className="profile-detail-item">
                <FaUserTag style={{ color: "var(--primary-color)" }} />
                <span>Rol: {profileData?.role}</span>
              </div>
              <div className="profile-detail-item">
                <FaClock style={{ color: "var(--secondary-color)" }} />
                <span>
                  Son Giriş:{" "}
                  {profileData?.lastLogin
                    ? new Date(profileData.lastLogin).toLocaleString("tr-TR")
                    : "Bilinmiyor"}
                </span>
              </div>
              {profileData?.actions && profileData.actions.length > 0 && (
                <div className="profile-detail-item">
                  <FaHistory style={{ color: "var(--danger-color)" }} />
                  <span>
                    Son İşlem:{" "}
                    {profileData.actions[0].action.replace(/_/g, " ")} (
                    {new Date(profileData.actions[0].createdAt).toLocaleString(
                      "tr-TR"
                    )}
                    )
                  </span>
                </div>
              )}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <button onClick={() => setIsPasswordModalOpen(true)}>
                Şifre Değiştir
              </button>
            </div>
          </div>
          <div style={{ flex: 2, minWidth: "400px" }}>
            <div className="profile-card profile-assignments-card">
              <h2>Zimmetlerim ({profileData?.assignments?.length || 0})</h2>
              {profileData?.assignments &&
              profileData.assignments.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Eşya</th>
                        <th>Marka</th>
                        <th>Seri No</th>
                        <th>Tarih</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileData.assignments.map((assignment) => (
                        <tr
                          key={assignment._id}
                          onClick={() => handleRowClick(assignment)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{assignment.item?.name || "Bilinmeyen Eşya"}</td>
                          <td>{assignment.item?.brand || "-"}</td>
                          <td>{assignment.item?.serialNumber || "-"}</td>
                          <td>
                            {new Date(
                              assignment.assignmentDate
                            ).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              className={`summary-status-badge ${
                                assignment.status === "Zimmetli"
                                  ? "status-zimmetli"
                                  : assignment.status === "Arızalı"
                                  ? "status-arizali"
                                  : "status-iade"
                              }`}
                            >
                              {assignment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Üzerinize kayıtlı zimmet bulunmamaktadır.</p>
              )}
            </div>
          </div>
          <div style={{ flex: 2, minWidth: "400px" }}>
            <div className="profile-card profile-history-card">
              <h2>İşlem Geçmişim ({profileData?.actions?.length || 0})</h2>
              {profileData?.actions && profileData.actions.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>İşlem</th>
                        <th>Detay</th>
                        <th>Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileData.actions.map((action) => (
                        <tr key={action._id}>
                          <td>{action.action.replace(/_/g, " ")}</td>
                          <td>{action.details}</td>
                          <td>
                            {new Date(action.createdAt).toLocaleString("tr-TR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Herhangi bir işlem geçmişiniz bulunmamaktadır.</p>
              )}
            </div>
          </div>
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Zimmet Detayı"
      >
        {selectedAssignment && (
          <div>
            <div className="detail-grid">
              <strong>Çalıştığı Firma:</strong>
              <span>{selectedAssignment.company?.name || "Belirtilmemiş"}</span>
              <strong>Varlık Alt Kategori:</strong>
              <span>{selectedAssignment.item?.assetSubType || "-"}</span>
              <strong>Varlık Cinsi:</strong>
              <span>{selectedAssignment.item?.assetType || "-"}</span>
              <strong>Kayıtlı Bölüm:</strong>
              <span>{selectedAssignment.registeredSection}</span>
              <strong>Demirbaş No:</strong>
              <span>{selectedAssignment.item?.assetTag || "-"}</span>
              <strong>Bulunduğu Birim:</strong>
              <span>{selectedAssignment.unit}</span>
              <strong>Bulunduğu Yer:</strong>
              <span>{selectedAssignment.location}</span>
              <strong>Kullanıcı Adı:</strong>
              <span>{selectedAssignment.personnelName}</span>
              <strong>Sabit Kıymet Cinsi:</strong>
              <span>{selectedAssignment.item?.fixedAssetType || "-"}</span>
              <strong>Marka:</strong>
              <span>{selectedAssignment.item?.brand || "-"}</span>
              <strong>Özellik:</strong>
              <span>{selectedAssignment.item?.description || "-"}</span>
              <strong>Model Yılı:</strong>
              <span>{selectedAssignment.item?.modelYear || "-"}</span>
              <strong>Seri No:</strong>
              <span>{selectedAssignment.item?.serialNumber || "-"}</span>
              <strong>Mac/IP Adresi:</strong>
              <span>{selectedAssignment.item?.networkInfo || "-"}</span>
              <strong>Kurulu Programlar:</strong>
              <span>{selectedAssignment.item?.softwareInfo || "-"}</span>
              <strong>Eski Kullanıcı:</strong>
              <span>{selectedAssignment.previousUser}</span>
              <strong>Açıklama:</strong>
              <span>{selectedAssignment.assignmentNotes}</span>
              <strong>Zimmet Tarihi:</strong>
              <span>
                {new Date(
                  selectedAssignment.assignmentDate
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="modal-actions">
              <button
                onClick={() =>
                  navigate(`/assignment/${selectedAssignment._id}/edit`)
                }
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FaEdit /> Güncelle
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* Şifre Değiştirme Modalı */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Şifre Değiştir"
      >
        <form onSubmit={submitHandler} className="modal-form">
          {error && <p style={{ color: "red" }}>{error}</p>}
          {message && <p style={{ color: "green" }}>{message}</p>}
          <div className="form-group">
            <label>Mevcut Şifre</label>
            <input
              type="password"
              placeholder="Mevcut şifrenizi girin"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Yeni Şifre</label>
            <input
              type="password"
              placeholder="Yeni şifrenizi belirleyin"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              placeholder="Yeni şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              style={{ backgroundColor: "var(--secondary-color)" }}
            >
              İptal
            </button>
            <button
              type="submit"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FaSave /> Şifreyi Güncelle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
