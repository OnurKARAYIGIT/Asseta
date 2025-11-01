import React from "react";
import { FaHistory } from "react-icons/fa";

const AuditLogTable = ({ logs }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-6">
      {logs && logs.length > 0 ? (
        <ol className="relative border-l border-border ml-2">
          {logs.map((log) => (
            <li key={log._id} className="mb-8 ml-6">
              <span className="absolute flex items-center justify-center w-6 h-6 bg-secondary rounded-full -left-3 ring-4 ring-card-background">
                <FaHistory className="w-3 h-3 text-white" />
              </span>
              <div className="flex items-baseline">
                <p className="font-semibold text-text-main capitalize">
                  {log.action.replace(/_/g, " ")}
                </p>
              </div>
              <p className="text-sm text-text-light my-1">{log.details}</p>
              <time className="block text-xs font-normal leading-none text-text-light">
                {formatDate(log.createdAt)} &bull; IP: {log.ipAddress}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-center text-text-light py-8">
          Seçilen kriterlere uygun denetim kaydı bulunamadı.
        </p>
      )}
    </div>
  );
};

export default AuditLogTable;
