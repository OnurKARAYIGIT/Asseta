import React from "react";
import { FaClock } from "react-icons/fa";

const PendingAssignmentsHeader = () => {
  return (
    <h1>
      <FaClock style={{ color: "var(--secondary-color)" }} /> İmza Bekleyen
      Zimmetler
    </h1>
  );
};

export default PendingAssignmentsHeader;
