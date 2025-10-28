import React from "react";

const AssignmentCard = ({ assignment, isPast = false, onDetailsClick }) => (
  <div className={`assignment-detail-card ${isPast ? "past" : ""}`}>
    <div className="detail-card-header">
      <h3>{assignment.item.assetType}</h3>
      {!isPast && (
        <span
          className={`status-badge status-${assignment.status
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          {assignment.status}
        </span>
      )}
    </div>
    <div className="detail-card-body">
      <div className="detail-row">
        <span className="detail-label">Marka:</span>
        <span className="detail-value">{assignment.item.brand}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Seri No:</span>
        <span className="detail-value">
          {assignment.item.serialNumber || "-"}
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Demirbaş No:</span>
        <span className="detail-value">{assignment.item.assetTag}</span>
      </div>
    </div>
    <div className="detail-card-footer">
      <button
        className="details-link"
        onClick={() => onDetailsClick(assignment)}
      >
        Tüm Detayları Gör
      </button>
      <span className={isPast ? "return-date" : ""}>
        {isPast ? "İade Tarihi: " : "Zimmet Tarihi: "}{" "}
        {new Date(
          isPast ? assignment.returnDate : assignment.assignmentDate
        ).toLocaleDateString()}
      </span>
    </div>
  </div>
);

export default AssignmentCard;
