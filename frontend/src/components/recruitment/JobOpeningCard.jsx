import React from "react";
import { FaBuilding, FaBriefcase, FaEdit, FaTrash } from "react-icons/fa";
import Button from "../shared/Button";

const StatusBadge = ({ status }) => {
  const statusMap = {
    Açık: "status-success",
    Dolduruldu: "status-info",
    "İptal Edildi": "status-danger",
  };
  return <span className={`status-badge ${statusMap[status]}`}>{status}</span>;
};

const JobOpeningCard = ({ job, onEdit, onDelete, onView }) => {
  return (
    <div
      className="bg-background-soft p-4 rounded-lg shadow border border-border flex flex-col justify-between transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
      onClick={() => onView(job)}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-text-main pr-2">{job.title}</h4>
          <StatusBadge status={job.status} />
        </div>
        <div className="text-sm text-text-light space-y-1">
          <p className="flex items-center gap-2">
            <FaBriefcase /> {job.department}
          </p>
          <p className="flex items-center gap-2">
            <FaBuilding /> {job.company?.name || "Şirket Bilgisi Yok"}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(job);
          }}
        >
          <FaEdit />
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(job);
          }}
        >
          <FaTrash />
        </Button>
      </div>
    </div>
  );
};

export default JobOpeningCard;
