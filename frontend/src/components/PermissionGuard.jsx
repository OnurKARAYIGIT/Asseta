import React from "react";
import Modal from "./shared/Modal.jsx";
import { FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "./AuthContext";

const PermissionGuard = ({ requiredPermission, children }) => {
  const { hasPermission } = useAuth(); // hasPermission fonksiyonunu context'ten al

  // Yetki kontrolünü merkezi hasPermission fonksiyonuna devret
  if (hasPermission(requiredPermission)) {
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
