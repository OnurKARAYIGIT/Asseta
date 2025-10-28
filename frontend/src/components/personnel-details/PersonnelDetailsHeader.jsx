import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaBoxOpen, FaArrowLeft } from "react-icons/fa";

const PersonnelDetailsHeader = ({ personnelData }) => {
  const navigate = useNavigate();

  return (
    <div className="personnel-details-header">
      <div className="header-info">
        <FaUser className="header-icon" />
        <div>
          <h1>{personnelData.personnelName}</h1>
          <p>
            <FaBoxOpen /> {personnelData.assignments.length} adet zimmetli ürün
            bulunuyor.
          </p>
        </div>
      </div>
      <button onClick={() => navigate(-1)} className="back-button">
        <FaArrowLeft /> Geri Dön
      </button>
    </div>
  );
};

export default PersonnelDetailsHeader;
