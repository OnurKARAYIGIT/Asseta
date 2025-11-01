import React from "react";
import { FaClock } from "react-icons/fa";

const PendingAssignmentsHeader = () => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <FaClock className="text-secondary-color text-2xl" />
      <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
        İmza Bekleyen Zimmetler
      </h1>
    </div>
  );
};

export default PendingAssignmentsHeader;
