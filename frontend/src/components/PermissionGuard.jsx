import React from "react";
import Modal from "./Modal";
import { FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "./AuthContext";

const PermissionGuard = ({ requiredPermission, children }) => {
  const { userInfo } = useAuth();

  // Admin ve Developer rolleri her zaman yetkilidir (Süper Kullanıcılar)
  if (
    userInfo &&
    (userInfo.role === "admin" || userInfo.role === "developer")
  ) {
    return children;
  }

  // Kullanıcının gerekli yetkisi var mı?
  const hasPermission = userInfo?.permissions?.includes(requiredPermission);

  if (hasPermission) {
    return children;
  }

  // Yetkisi yoksa, modal göster
  return (
    <Modal isOpen={true} onClose={() => {}} title="Erişim Engellendi">
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <FaExclamationTriangle
          style={{ fontSize: "4rem", color: "var(--secondary-color)" }}
        />
        <h2 style={{ marginTop: "1.5rem" }}>Bu Sayfaya Erişemezsiniz</h2>
        <p>Bu içeriği görüntülemek için gerekli yetkilere sahip değilsiniz.</p>
      </div>
    </Modal>
  );
};

export default PermissionGuard;
