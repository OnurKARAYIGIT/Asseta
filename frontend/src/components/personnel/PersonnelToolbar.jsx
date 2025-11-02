import React from "react";
import Button from "../shared/Button";
import { FaUserPlus } from "react-icons/fa";

const PersonnelToolbar = ({ searchTerm, setSearchTerm, onAddNew }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
      <div className="w-full sm:w-1/3">
        <input
          type="text"
          placeholder="Personel, sicil no, departman ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-md bg-input-background text-text-main focus:ring-2 focus:ring-primary"
        />
      </div>
      <Button onClick={onAddNew} variant="primary" icon={<FaUserPlus />}>
        Yeni Personel Ekle
      </Button>
    </div>
  );
};

export default PersonnelToolbar;
