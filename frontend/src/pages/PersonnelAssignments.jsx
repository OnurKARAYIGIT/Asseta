import React from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../Loader";
import { Link } from "react-router-dom";

const PersonnelAssignments = ({ personnelId }) => {
  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["personnelAssignments", personnelId],
    queryFn: () =>
      axiosInstance
        .get(`/assignments?personnel=${personnelId}&limit=1000`) // Personele göre filtrele
        .then((res) => res.data.assignments),
    enabled: !!personnelId,
  });

  if (isLoading) return <Loader />;
  if (isError) return <p className="text-danger">{error.message}</p>;

  return (
    <div className="mt-6">
      {assignments.length === 0 ? (
        <p className="text-text-light text-center py-4">
          Bu personele ait zimmet kaydı bulunmamaktadır.
        </p>
      ) : (
        <div className="overflow-x-auto bg-table-background rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-table-header-background">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-main">
                  Eşya Adı
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-main">
                  Demirbaş No
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-main">
                  Zimmet Tarihi
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-main">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-divider">
              {assignments.map((assignment) => (
                <tr key={assignment._id} className="hover:bg-table-row-hover">
                  <td className="py-3 px-4">
                    <Link
                      to={`/assignments?openModal=${assignment._id}`}
                      className="text-primary hover:underline"
                    >
                      {assignment.item?.name || "N/A"}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    {assignment.item?.assetTag || "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(assignment.assignmentDate).toLocaleDateString(
                      "tr-TR"
                    )}
                  </td>
                  <td className="py-3 px-4">{assignment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PersonnelAssignments;
