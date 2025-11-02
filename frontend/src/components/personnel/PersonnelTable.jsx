import React from "react";
import { Link } from "react-router-dom";
import { FaPencilAlt, FaTrash } from "react-icons/fa";

const PersonnelTable = ({ personnel, onEdit }) => {
  return (
    <div className="overflow-x-auto bg-table-background rounded-lg shadow">
      <table className="min-w-full">
        <thead className="bg-table-header-background">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-semibold text-text-main tracking-wider">
              Adı Soyadı
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-text-main tracking-wider">
              Sicil No
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-text-main tracking-wider">
              Departman
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-text-main tracking-wider">
              Şirket
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-text-main tracking-wider">
              Pozisyon
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-text-main tracking-wider">
              E-posta
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-text-main tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-table-divider">
          {personnel.map((p) => (
            <tr key={p._id} className="hover:bg-table-row-hover">
              <td className="py-3 px-4 whitespace-nowrap">
                <Link
                  to={`/personnel/${p._id}/details`}
                  className="text-primary font-medium hover:underline"
                >
                  {p.fullName}
                </Link>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">{p.employeeId}</td>
              <td className="py-3 px-4 whitespace-nowrap">
                {p.jobInfo?.department || "-"}
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-xs text-text-light">
                {p.company?.name || "-"}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                {p.jobInfo?.position || "-"}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">{p.email}</td>
              <td className="py-3 px-4 whitespace-nowrap">
                <button
                  onClick={() => onEdit(p)}
                  className="text-primary hover:text-primary-dark transition-colors"
                  title="Düzenle"
                >
                  <FaPencilAlt />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PersonnelTable;
