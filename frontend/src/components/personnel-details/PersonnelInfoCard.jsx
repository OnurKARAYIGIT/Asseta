import React from "react";
import { FaBuilding, FaBriefcase, FaMapMarkerAlt } from "react-icons/fa";

const PersonnelInfoCard = ({ personnel }) => {
  // İlk zimmetten bilgileri al, çünkü hepsi aynı personel için
  const firstAssignment = personnel.assignments[0] || {};

  return (
    <div className="bg-background p-6 rounded-lg shadow-sm h-full">
      <h3 className="text-lg font-semibold text-text-main mb-4">
        Personel Bilgileri
      </h3>
      <ul className="space-y-3">
        <li className="flex items-center gap-3 text-sm">
          <FaBuilding className="text-secondary flex-shrink-0" />
          <span className="text-text-light">
            <b>Şirket:</b> {firstAssignment.company?.name || "-"}
          </span>
        </li>
        <li className="flex items-center gap-3 text-sm">
          <FaBriefcase className="text-secondary flex-shrink-0" />
          <span className="text-text-light">
            <b>Birim:</b> {firstAssignment.unit || "-"}
          </span>
        </li>
        <li className="flex items-center gap-3 text-sm">
          <FaMapMarkerAlt className="text-secondary flex-shrink-0" />
          <span className="text-text-light">
            <b>Konum:</b> {firstAssignment.location || "-"}
          </span>
        </li>
      </ul>
    </div>
  );
};

export default PersonnelInfoCard;
