import React from "react";
import { FaSort, FaSortUp, FaSortDown, FaEye, FaFileAlt } from "react-icons/fa";
import Button from "../shared/Button";

// Veri yolunu güvenli bir şekilde almak için yardımcı fonksiyon
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

const ApplicationsTable = ({
  applications,
  onViewDetails,
  onUpdateStatus, // Yeni prop
}) => {
  if (!applications || applications.length === 0) {
    return (
      <div className="text-center p-8 bg-card-background-light rounded-lg">
        <p className="text-text-light">Bu ilana henüz başvuru yapılmamış.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-card-background-light rounded-lg shadow">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-table-header">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Aday
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Başvuru Tarihi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Durum
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-color">
          {applications.map((app) => (
            <tr key={app._id} className="hover:bg-background-soft">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main">
                {getNestedValue(app, "candidate.fullName")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                {new Date(app.applicationDate).toLocaleDateString("tr-TR")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main">
                {/* TODO: Durum için daha şık bir badge bileşeni yapılabilir */}
                {app.status}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end items-center gap-2">
                  {/* Örnek durum güncelleme butonu */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onUpdateStatus(app)}
                  >
                    Durum Değiştir
                  </Button>
                  <Button
                    variant="icon"
                    size="sm"
                    onClick={() => onViewDetails(app.candidate)}
                    title="Aday Detayları"
                  >
                    <FaEye />
                  </Button>
                  {getNestedValue(app, "candidate.resumePath") && (
                    <a
                      href={getNestedValue(app, "candidate.resumePath")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-light hover:text-primary p-2"
                      title="CV'yi Görüntüle"
                    >
                      <FaFileAlt />
                    </a>
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

export default ApplicationsTable;
