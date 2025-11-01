import React from "react";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUndo,
  FaTrashAlt,
  FaHistory,
  FaTrash,
} from "react-icons/fa";
import Button from "../shared/Button";

const AssignmentsTable = ({
  assignments,
  columns,
  visibleColumns,
  sortConfig,
  handleSort,
  handleRowClick,
  handleReturn, // Bu prop artık kullanılmıyor olabilir, ama şimdilik kalsın
  handleDelete, // Bu prop artık kullanılmıyor olabilir, ama şimdilik kalsın
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
              className="cursor-pointer transition-colors hover:bg-light-gray-color dark:hover:bg-light-gray-color"
            >
              {columns
                .filter((col) => visibleColumns.includes(col.key))
                .map((col) => {
                  const value = getNestedValue(assignment, col.key);
                  if (col.key.includes("Date")) {
                    return (
                      <td
                        key={col.key}
                        className="px-4 py-3 whitespace-nowrap text-sm text-text-main"
                      >
                        {value
                          ? new Date(value).toLocaleDateString("tr-TR")
                          : "-"}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col.key}
                      className="px-4 py-3 whitespace-nowrap text-sm text-text-main"
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
                className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <div className="flex justify-end items-center gap-2">
                  {(userInfo.role === "admin" ||
                    userInfo.role === "developer") && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReturn(assignment);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-white text-xs font-semibold bg-green-600 hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title="İade Al"
                        disabled={assignment.status !== "Zimmetli"}
                      >
                        <FaUndo />
                        <span>İade Al</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(assignment);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-white text-xs font-semibold bg-red-600 hover:bg-red-700 transition-colors"
                        title="Sil"
                      >
                        <FaTrashAlt />
                        <span>Sil</span>
                      </button>
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
