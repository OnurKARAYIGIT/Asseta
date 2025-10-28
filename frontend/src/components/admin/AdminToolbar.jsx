import React from "react";
import { FaUsersCog, FaUserPlus } from "react-icons/fa";

const AdminToolbar = ({ onAddNewUser }) => {
  return (
    <>
      <h1>
        <FaUsersCog style={{ color: "var(--secondary-color)" }} /> Admin Paneli
      </h1>
      <div className="admin-panel-header">
        <h2>Kullanıcı Yönetimi</h2>
        <button onClick={onAddNewUser}>
          <FaUserPlus /> Yeni Kullanıcı Ekle
        </button>
      </div>
    </>
  );
};

export default AdminToolbar;
