import React, { useState } from "react";
import {
  FaUser,
  FaTimes,
  FaFileUpload,
  FaBarcode,
  FaTag,
  FaCalendarPlus,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import Button from "../shared/Button";

const PersonnelAssignmentAccordion = ({
  group,
  onUploadAndApprove,
  onReject,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { personnel, assignments, _id: personnelId } = group;

  if (!personnel) return null;

  const handleUploadClick = (e) => {
    e.stopPropagation();
    onUploadAndApprove(personnelId, personnel.fullName);
  };

  const handleRejectClick = (e) => {
    e.stopPropagation();
    onReject(assignments.map((a) => a._id));
  };

  return (
    <div className="bg-card-bg-light dark:bg-card-bg-dark border border-border-color rounded-lg shadow-md transition-shadow duration-300 hover:shadow-xl">
      {/* Akordiyon Başlığı */}
      <div
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          {isOpen ? (
            <FaChevronDown className="text-primary" />
          ) : (
            <FaChevronRight className="text-text-secondary" />
          )}
          <FaUser className="text-text-secondary text-lg" />
          <span className="font-bold text-text-main text-lg">
            {personnel.fullName}
          </span>
          <span className="text-sm font-medium text-white bg-secondary px-2 py-1 rounded-full">
            {assignments.length} Eşya Bekliyor
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

      {/* Açılabilir İçerik */}
      {isOpen && (
        <div className="border-t border-border-color p-4 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="bg-card-background p-4 rounded-lg border border-border-color shadow-sm space-y-3"
              >
                <div className="font-bold text-text-main text-md">
                  {assignment.item.name}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3 text-text-secondary">
                    <FaTag className="w-4" />
                    <span className="font-mono">
                      {assignment.item.assetTag}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary">
                    <FaBarcode className="w-4" />
                    <span className="font-mono">
                      {assignment.item.serialNumber || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-dashed border-border-color mt-3">
                  <FaCalendarPlus />
                  <span>
                    {new Date(assignment.createdAt).toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelAssignmentAccordion;
