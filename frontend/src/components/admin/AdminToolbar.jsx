import React from "react";
import { FaUsersCog, FaUserPlus } from "react-icons/fa";
import Button from "../shared/Button";

const AdminToolbar = ({ onAddNewUser }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      <div className="flex items-center gap-4">
        <FaUsersCog className="text-secondary text-2xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          Kullanıcı Yönetimi
        </h1>
      </div>
      <div className="w-full sm:w-auto">
        <Button onClick={onAddNewUser} className="w-full">
          <FaUserPlus /> Yeni Kullanıcı Ekle
        </Button>
      </div>
    </div>
  );
};

export default AdminToolbar;
