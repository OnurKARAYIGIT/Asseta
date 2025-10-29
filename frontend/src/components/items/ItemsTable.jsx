import React from "react";
import { FaEdit, FaTrash, FaHistory } from "react-icons/fa";
import { useAuth } from "../AuthContext";
import Button from "../shared/Button";
const ItemsTable = ({
  items,
  handleOpenModal,
  handleDeleteClick,
  handleHistoryClick,
}) => {
  const { hasPermission } = useAuth();

  return (
    <div className="overflow-x-auto bg-card-background rounded-lg shadow border border-border">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-light-gray">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
              Eşya Adı
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
              Varlık Cinsi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
              Demirbaş No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
              Seri No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
              Durum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            // Güvenli erişim için item objesini kontrol edelim
            if (!item) return null;
            return (
              <tr
                key={item._id}
                className="hover:bg-background transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                  {item.assetType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                  {item.assetTag}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                  {item.serialNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        item.assignmentStatus === "Zimmetli"
                          ? "bg-blue-100 text-blue-800"
                          : ""
                      }
                      ${
                        item.assignmentStatus === "Boşta"
                          ? "bg-gray-100 text-gray-800"
                          : ""
                      }
                      ${
                        item.assignmentStatus === "Arızalı"
                          ? "bg-red-100 text-red-800"
                          : ""
                      }
                      ${
                        item.assignmentStatus === "Beklemede"
                          ? "bg-yellow-100 text-yellow-800"
                          : ""
                      }
                      ${
                        item.assignmentStatus === "Hurda"
                          ? "bg-gray-700 text-gray-100"
                          : ""
                      }
                      ${
                        item.assignmentStatus === "İade Edildi"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }`}
                  >
                    {item.assignmentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {hasPermission("items") && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenModal("edit", item)}
                        title="Düzenle"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleHistoryClick(item)}
                        title="Geçmişi Görüntüle"
                      >
                        <FaHistory />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(item)}
                        title="Sil"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
export default ItemsTable;
