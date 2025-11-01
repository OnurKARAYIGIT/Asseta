import React from "react";
import { FaClock } from "react-icons/fa";

const PendingAssignmentsHeader = ({ totalItems }) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <FaClock className="text-secondary text-2xl" />
      <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
        Onay Bekleyen Zimmetler ({totalItems})
      </h1>
    </div>
  );
};

export default PendingAssignmentsHeader;
