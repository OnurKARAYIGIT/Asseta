import React from "react";

const ProfileAssignmentsTable = ({ assignments, onRowClick }) => {
  return (
    <div className="profile-card profile-assignments-card">
      <h2>Zimmetlerim ({assignments?.length || 0})</h2>
      {assignments && assignments.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Eşya</th>
                <th>Marka</th>
                <th>Seri No</th>
                <th>Tarih</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr
                  key={assignment._id}
                  onClick={() => onRowClick(assignment)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{assignment.item?.name || "Bilinmeyen Eşya"}</td>
                  <td>{assignment.item?.brand || "-"}</td>
                  <td>{assignment.item?.serialNumber || "-"}</td>
                  <td>
                    {new Date(assignment.assignmentDate).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className={`summary-status-badge ${
                        assignment.status === "Zimmetli"
                          ? "status-zimmetli"
                          : assignment.status === "Arızalı"
                          ? "status-arizali"
                          : "status-iade"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Üzerinize kayıtlı zimmet bulunmamaktadır.</p>
      )}
    </div>
  );
};

export default ProfileAssignmentsTable;
