import React from "react";
import {
  FaTrash,
  FaHistory,
  FaFileDownload,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import Button from "../shared/Button";

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
      <h2 className="text-xl font-semibold mb-4 text-text-main">
        Mevcut Zimmetler
      </h2>
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            {columns
              .filter((col) => visibleColumns.includes(col.key))
              .map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider cursor-pointer"
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
        <tbody className="bg-card-background divide-y divide-border">
          {assignments.map((assignment) => (
            <tr
              key={assignment._id}
              onClick={() => handleRowClick(assignment)}
              className="hover:bg-background cursor-pointer transition-colors"
            >
              {columns
                .filter((col) => visibleColumns.includes(col.key))
                .map((col) => {
                  const value = getNestedValue(assignment, col.key);
                  if (col.key.includes("Date")) {
                    return (
                      <td
                        key={col.key}
                        className="px-4 py-3 whitespace-nowrap text-sm"
                      >
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
                      <td
                        key={col.key}
                        className="px-4 py-3 whitespace-nowrap text-sm"
                      >
                        <span
                          className="text-primary hover:underline"
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
                  return (
                    <td
                      key={col.key}
                      className="px-4 py-3 whitespace-nowrap text-sm"
                    >
                      {value || "-"}
                    </td>
                  );
                })}
              <td>
                {assignment.formPath && (
                  <a
                    href={`http://localhost:5001${assignment.formPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Zimmet Formunu Görüntüle"
                    className="text-primary hover:text-primary-hover"
                  >
                    <FaFileDownload className="w-5 h-5" />
                  </a>
                )}
              </td>
              <td
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-3 whitespace-nowrap text-sm"
              >
                <div className="flex items-center gap-2">
                  {(userInfo.role === "admin" ||
                    userInfo.role === "developer") && (
                    <>
                      <Button
                        title="Sil"
                        onClick={() => handleDelete(assignment)}
                        variant="danger"
                        size="sm"
                      >
                        <FaTrash />
                      </Button>
                      <Button
                        title="Geçmişi Görüntüle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(assignment);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        <FaHistory />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentsTable;
