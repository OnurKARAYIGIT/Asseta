import React from "react";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEdit,
  FaTrashAlt,
  FaUndo,
} from "react-icons/fa";
import AssetTypeIcon from "../shared/AssetTypeIcon"; // Yeni ikon bileşenimizi import ediyoruz

// Veri yolunu güvenli bir şekilde almak için yardımcı fonksiyon
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

const AssignmentsTable = ({
  assignments,
  columns,
  visibleColumns,
  sortConfig,
  handleSort,
  handleRowClick,
  handleSummaryClick,
  handleDelete,
  handleReturn,
  userInfo,
}) => {
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="inline-block ml-1 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <FaSortUp className="inline-block ml-1" />
    ) : (
      <FaSortDown className="inline-block ml-1" />
    );
  };

  const visibleColumnKeys = new Set(visibleColumns);

  return (
    <div className="overflow-x-auto bg-card-background rounded-lg shadow border border-border-color">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-table-header">
          <tr>
            {columns
              .filter((col) => visibleColumnKeys.has(col.key))
              .map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort(column.key)}
                >
                  {column.name}
                  {renderSortIcon(column.key)}
                </th>
              ))}
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider"
            >
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-color">
          {assignments.map((assignment) => (
            <tr // Zebra stili için even/odd sınıfları eklenebilir, ancak hover bunu geçersiz kılar.
              key={assignment._id}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => handleRowClick(assignment)}
            >
              {columns
                .filter((col) => visibleColumnKeys.has(col.key))
                .map((column) => {
                  const value = getNestedValue(assignment, column.key);
                  return (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-text-main"
                    >
                      {column.key === "item.name" ? (
                        <div className="flex items-center gap-3">
                          <AssetTypeIcon type={assignment.item?.assetType} />
                          <span
                            className="font-medium hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSummaryClick(
                                "item",
                                assignment.item.assetTag
                              );
                            }}
                          >
                            {value}
                          </span>
                        </div>
                      ) : column.key === "personnel.fullName" ? (
                        <span
                          className="hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSummaryClick(
                              "personnel",
                              value,
                              assignment.personnel._id
                            );
                          }}
                        >
                          {value}
                        </span>
                      ) : column.key.includes("Date") ? (
                        new Date(value).toLocaleDateString("tr-TR")
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end items-center gap-4">
                  {assignment.status === "Zimmetli" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReturn(assignment);
                      }}
                      className="text-green-500 hover:text-green-700"
                      title="İade Al"
                    >
                      <FaUndo />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(assignment);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Sil"
                  >
                    <FaTrashAlt />
                  </button>
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
