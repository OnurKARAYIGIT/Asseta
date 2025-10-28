import React from "react";
import { FaCheck, FaTimes, FaTrash, FaChevronDown } from "react-icons/fa";

const PersonnelAssignmentAccordion = ({
  group,
  isExpanded,
  toggleExpansion,
  onReject,
  onApprove,
}) => {
  return (
    <div key={group.personnelName} className="accordion-item">
      <div
        className="accordion-header"
        onClick={() => toggleExpansion(isExpanded ? null : group.personnelName)}
      >
        <div className="accordion-title">
          <strong>{group.personnelName}</strong>
          <span className="badge">
            {group.assignments.length} Bekleyen Eşya
          </span>
        </div>
        <FaChevronDown
          className={`expand-icon ${isExpanded ? "expanded" : ""}`}
        />
      </div>
      {isExpanded && (
        <div className="accordion-content">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Eşya Adı</th>
                  <th>Demirbaş No</th>
                  <th>Seri No</th>
                  <th>Oluşturulma Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {group.assignments.map(
                  (assignment) =>
                    assignment.item && (
                      <tr key={assignment._id}>
                        <td>{assignment.item?.name || "N/A"}</td>
                        <td>{assignment.item?.assetTag || "-"}</td>
                        <td>{assignment.item?.serialNumber || "-"}</td>
                        <td>
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          </div>
          <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(group.personnelName, group.assignments);
              }}
              className="danger"
            >
              <FaTrash />{" "}
              {group.assignments.length > 1 ? "Toplu Reddet" : "Reddet"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove({
                  personnelName: group.personnelName,
                  assignments: group.assignments,
                });
              }}
            >
              <FaCheck />{" "}
              {group.assignments.length > 1 ? "Toplu Onayla" : "Onayla"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelAssignmentAccordion;
