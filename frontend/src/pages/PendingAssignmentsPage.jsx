import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import {
  FaClock,
  FaCheck,
  FaTimes,
  FaUpload,
  FaFileDownload,
  FaTrash,
  FaChevronDown,
} from "react-icons/fa";
import "./PendingAssignmentsPage.css";
import Modal from "../components/Modal";
import { toast } from "react-toastify";
import { useAuth } from "../components/AuthContext";
import { usePendingCount } from "../contexts/PendingCountContext";
import { usePagination } from "../hooks/usePagination";

const PendingAssignmentsPage = () => {
  const [personnelGroups, setPersonnelGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserForApproval, setSelectedUserForApproval] = useState(null);
  const [formFile, setFormFile] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [userToReject, setUserToReject] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  // Sayfalama için state'ler
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const { currentPage, setCurrentPage, paginationRange } = usePagination({
    totalPages,
  });

  const { refetchPendingCount } = usePendingCount();
  const { userInfo } = useAuth();

  const fetchPendingAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/assignments/pending-grouped", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
        },
      });
      // Backend'den gelen gruplanmış veriyi doğrudan state'e atıyoruz.
      setPersonnelGroups(data.assignments || []); // `data.assignments` artık gruplanmış bir dizi
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError("Bekleyen zimmetler getirilemedi.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchPendingAssignments();
  }, [fetchPendingAssignments]);

  const handleApprove = async () => {
    if (!selectedUserForApproval || !formFile) {
      toast.error("Lütfen imzalı zimmet formunu yükleyin.");
      return;
    }

    setIsApproving(true);

    const fileFormData = new FormData();
    fileFormData.append("form", formFile);

    try {
      // 1. Dosyayı yükle
      const { data: uploadData } = await axiosInstance.post(
        "/upload",
        fileFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // 2. Seçili kullanıcıya ait tüm bekleyen zimmetleri güncelle
      const approvalPromises = selectedUserForApproval.assignments.map(
        (assignment) =>
          axiosInstance.put(`/assignments/${assignment._id}`, {
            status: "Zimmetli",
            formPath: uploadData.filePath,
          })
      );

      await Promise.all(approvalPromises);

      toast.success("Zimmet başarıyla onaylandı.");
      setSelectedUserForApproval(null);
      setFormFile(null);
      // Tüm listeyi yeniden çekmek yerine, onaylanan grubu state'ten çıkar
      setPersonnelGroups((prev) =>
        prev.filter(
          (group) =>
            group.personnelName !== selectedUserForApproval.personnelName
        )
      );
      refetchPendingCount(); // Rozeti güncelle
    } catch (err) {
      toast.error("Onaylama işlemi sırasında bir hata oluştu.");
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = (personnelName, assignments) => {
    setUserToReject({ personnelName, assignments });
  };

  const confirmRejectHandler = async () => {
    if (!userToReject) return;
    try {
      // Seçili kullanıcıya ait tüm bekleyen zimmetleri sil
      const rejectionPromises = userToReject.assignments.map((assignment) =>
        axiosInstance.delete(`/assignments/${assignment._id}`)
      );

      await Promise.all(rejectionPromises);

      toast.success("Zimmet talebi başarıyla reddedildi ve silindi.");
      setUserToReject(null);
      // Tüm listeyi yeniden çekmek yerine, reddedilen grubu state'ten çıkar
      setPersonnelGroups((prev) =>
        prev.filter(
          (group) => group.personnelName !== userToReject.personnelName
        )
      );
      refetchPendingCount(); // Rozeti güncelle
    } catch (err) {
      toast.error(`Reddetme işlemi sırasında bir hata oluştu: ${err.message}`);
      console.error(err);
    }
  };

  const toggleUserExpansion = (personnelName) => {
    if (expandedUser === personnelName) {
      setExpandedUser(null);
    } else {
      setExpandedUser(personnelName);
    }
  };

  return (
    <div className="page-container">
      <h1>
        <FaClock style={{ color: "var(--secondary-color)" }} /> İmza Bekleyen
        Zimmetler
      </h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div className="accordion-container">
          {personnelGroups.map((group) => {
            const isExpanded = expandedUser === group.personnelName;
            return (
              <div key={group.personnelName} className="accordion-item">
                <div
                  className="accordion-header"
                  onClick={() => toggleUserExpansion(group.personnelName)}
                >
                  <div className="accordion-title">
                    <strong>{group.personnelName}</strong>
                    <span className="badge">
                      {group.assignments.length} Bekleyen Eşya
                    </span>
                  </div>
                  <FaChevronDown
                    className={`expand-icon ${isExpanded ? "expanded" : ""}`}
                  />
                </div>
                {isExpanded && (
                  <div className="accordion-content">
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Eşya Adı</th>
                            <th>Demirbaş No</th>
                            <th>Seri No</th>
                            <th>Oluşturulma Tarihi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.assignments.map(
                            (assignment) =>
                              assignment.item && (
                                <tr key={assignment._id}>
                                  <td>{assignment.item?.name || "N/A"}</td>
                                  <td>{assignment.item?.assetTag || "-"}</td>
                                  <td>
                                    {assignment.item?.serialNumber || "-"}
                                  </td>
                                  <td>
                                    {new Date(
                                      assignment.createdAt
                                    ).toLocaleDateString()}
                                  </td>
                                </tr>
                              )
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div
                      className="modal-actions"
                      style={{ justifyContent: "flex-end" }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(group.personnelName, group.assignments);
                        }}
                        className="danger"
                      >
                        <FaTrash />{" "}
                        {group.assignments.length > 1
                          ? "Toplu Reddet"
                          : "Reddet"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserForApproval({
                            personnelName: group.personnelName,
                            assignments: group.assignments,
                          });
                        }}
                      >
                        <FaCheck />{" "}
                        {group.assignments.length > 1
                          ? "Toplu Onayla"
                          : "Onayla"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sayfalama Kontrolleri */}
      {totalPages > 1 && (
        <div className="pagination no-print">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            &laquo;&laquo;
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &laquo; Geri
          </button>
          {paginationRange.map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={currentPage === number ? "active" : ""}
            >
              {number}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            İleri &raquo;
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            &raquo;&raquo;
          </button>
        </div>
      )}

      {/* Onaylama Modalı */}
      <Modal
        isOpen={!!selectedUserForApproval}
        onClose={() => setSelectedUserForApproval(null)}
        title="Zimmeti Onayla"
      >
        {selectedUserForApproval && (
          <div>
            <p>
              <strong>{selectedUserForApproval.personnelName}</strong>{" "}
              personeline ait{" "}
              <strong>{selectedUserForApproval.assignments.length} adet</strong>{" "}
              zimmeti onaylamak için lütfen imzalı zimmet formunu yükleyin.
            </p>
            <div className="form-file-upload" style={{ margin: "1.5rem 0" }}>
              <input
                type="file"
                id="approval-form-file"
                onChange={(e) => setFormFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              <label htmlFor="approval-form-file" className="file-upload-label">
                <FaUpload /> Form Seç
              </label>
              {formFile && <span>{formFile.name}</span>}
            </div>
            <div className="modal-actions">
              <button
                onClick={handleApprove}
                disabled={!formFile || isApproving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {isApproving ? (
                  <Loader size="sm" />
                ) : (
                  <>
                    <FaCheck /> Onayla ve Zimmetle
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reddetme Onay Modalı */}
      <Modal
        isOpen={!!userToReject}
        onClose={() => setUserToReject(null)}
        title="Zimmet Talebini Reddet"
      >
        {userToReject && (
          <div>
            <p>
              <strong>{userToReject.personnelName}</strong> personeline ait{" "}
              <strong>{userToReject.assignments.length} adet</strong> zimmet
              talebini reddetmek istediğinizden emin misiniz? Bu işlem, ilgili
              tüm zimmet kayıtlarını kalıcı olarak silecektir.
            </p>
            <div
              className="modal-actions"
              style={{ justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setUserToReject(null)}
                style={{ backgroundColor: "var(--secondary-color)" }}
              >
                İptal
              </button>
              <button onClick={confirmRejectHandler} className="danger">
                <FaTrash
                  style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
                />
                Evet, Reddet ve Sil
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingAssignmentsPage;
