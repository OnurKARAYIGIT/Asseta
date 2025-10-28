import React from "react";
import {
  FaTrash,
  FaHistory,
  FaFileDownload,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

const AssignmentsTable = ({
  assignments,
  columns,
  visibleColumns,
  sortConfig,
  handleSort,
  handleRowClick,
  handleSummaryClick,
  handleDelete,
  userInfo,
}) => {
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="sort-icon" />;
    }
    if (sortConfig.direction === "asc") {
      return <FaSortUp className="sort-icon active" />;
    }
    return <FaSortDown className="sort-icon active" />;
  };

  const getNestedValue = (obj, path) => {
    const keys = path.split(".");
    let result = obj;
    for (const key of keys) {
      if (result && typeof result === "object") {
        result = result[key];
      } else {
        return undefined;
      }
    }
    return result;
  };

  return (
    <div className="table-container">
      <h2>Mevcut Zimmetler</h2>
      <table>
        <thead>
          <tr>
            {columns
              .filter((col) => visibleColumns.includes(col.key))
              .map((col) => (
                <th
                  key={col.key}
                  className="sortable"
                  onClick={() => handleSort(col.key)}
                >
                  {col.name}
                  {getSortIcon(col.key)}
                </th>
              ))}
            <th className="no-sort">Form</th>
            <th className="no-sort">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => (
            <tr
              key={assignment._id}
              onClick={() => handleRowClick(assignment)}
              style={{ cursor: "pointer" }}
            >
              {columns
                .filter((col) => visibleColumns.includes(col.key))
                .map((col) => {
                  const value = getNestedValue(assignment, col.key);
                  if (col.key.includes("Date")) {
                    return (
                      <td key={col.key}>
                        {value
                          ? new Date(value).toLocaleDateString("tr-TR")
                          : "-"}
                      </td>
                    );
                  }
                  if (
                    col.key === "personnelName" ||
                    col.key === "item.assetTag"
                  ) {
                    return (
                      <td key={col.key}>
                        <span
                          className="link-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSummaryClick(
                              col.key === "personnelName"
                                ? "personnel"
                                : "item",
                              value
                            );
                          }}
                        >
                          {value || "-"}
                        </span>
                      </td>
                    );
                  }
                  return <td key={col.key}>{value || "-"}</td>;
                })}
              <td>
                {assignment.formPath && (
                  <a
                    href={`http://localhost:5001${assignment.formPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Zimmet Formunu Görüntüle"
                  >
                    <FaFileDownload
                      style={{
                        color: "var(--primary-color)",
                        fontSize: "1.2rem",
                      }}
                    />
                  </a>
                )}
              </td>
              <td
                onClick={(e) => e.stopPropagation()}
                style={{ display: "flex", gap: "0.5rem" }}
              >
                {(userInfo.role === "admin" ||
                  userInfo.role === "developer") && (
                  <>
                    <button
                      title="Sil"
                      onClick={() => handleDelete(assignment)}
                      style={{
                        backgroundColor: "var(--danger-color)",
                        padding: "8px 12px",
                      }}
                    >
                      <FaTrash />
                    </button>
                    <button
                      title="Geçmişi Görüntüle"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(assignment);
                      }}
                      style={{ padding: "8px 12px" }}
                    >
                      <FaHistory />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentsTable;
