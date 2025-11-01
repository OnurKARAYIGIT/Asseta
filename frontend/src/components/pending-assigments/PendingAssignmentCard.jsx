import React from "react";
import {
  FaUser,
  FaTimes,
  FaFileUpload,
  FaBarcode,
  FaTag,
  FaCalendarPlus,
} from "react-icons/fa";
import Button from "../shared/Button";

const PendingAssignmentCard = ({ group, onUploadAndApprove, onReject }) => {
  const { personnel, assignments, _id: personnelId } = group;

  if (!personnel) {
    return null; // Eğer bir şekilde personel bilgisi silinmişse bu kartı gösterme
  }

  const handleUploadClick = (e) => {
    e.stopPropagation();
    onUploadAndApprove(personnelId, personnel.fullName);
  };

  const handleRejectClick = (e) => {
    e.stopPropagation();
    onReject(assignments.map((a) => a._id));
  };

  return (
    <div className="bg-card-bg-light dark:bg-card-bg-dark border border-border-color rounded-lg shadow-md">
      <div className="p-4 border-b border-border-color flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FaUser className="text-text-secondary" />
          <span className="font-bold text-text-main">{personnel.fullName}</span>
          <span className="text-sm text-text-secondary bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
            {assignments.length} Eşya
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRejectClick}
            variant="danger"
            size="sm"
            icon={<FaTimes />}
          >
            Tümünü Reddet
          </Button>
          <Button
            onClick={handleUploadClick}
            variant="success"
            size="sm"
            icon={<FaFileUpload />}
          >
            Form Yükle ve Onayla
          </Button>
        </div>
      </div>
      <ul className="p-4 space-y-2">
        {assignments.map((assignment) => (
          <div
            key={assignment._id}
            className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-border-color"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              <div className="md:col-span-3 font-semibold text-text-main text-base">
                {assignment.item.name}
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <FaTag />
                <span className="font-mono">{assignment.item.assetTag}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <FaBarcode />
                <span className="font-mono">
                  {assignment.item.serialNumber || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <FaCalendarPlus />
                <span>
                  {new Date(assignment.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </ul>
    </div>
  );
};

export default PendingAssignmentCard;
