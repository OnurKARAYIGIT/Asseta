import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const NoAccessPage = () => {
  return (
    <div className="page-container" style={{ textAlign: "center" }}>
      <FaExclamationTriangle
        style={{ fontSize: "4rem", color: "var(--secondary-color)" }}
      />
      <h1 style={{ justifyContent: "center" }}>Erişim Engellendi</h1>
      <p>Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.</p>
      <p>Lütfen sistem yöneticinizle iletişime geçin.</p>
    </div>
  );
};

export default NoAccessPage;
