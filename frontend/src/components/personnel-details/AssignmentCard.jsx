import React from "react";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaInfoCircle,
  FaTag,
  FaBarcode,
} from "react-icons/fa";
import Button from "../shared/Button";

const AssignmentCard = ({ assignment, onDetailsClick }) => {
  return (
    <div className="border border-border rounded-lg bg-background/50 transition-shadow hover:shadow-md">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FaBoxOpen className="text-secondary" />
          <h4 className="font-semibold text-text-main">
            {assignment.item.name}
          </h4>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDetailsClick(assignment)}
        >
          Detayları Gör
        </Button>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-text-light">
          <FaTag className="flex-shrink-0" />
          <span>
            <b>Demirbaş No:</b> {assignment.item.assetTag}
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-light">
          <FaBarcode className="flex-shrink-0" />
          <span>
            <b>Seri No:</b> {assignment.item.serialNumber || "-"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-light">
          <FaCalendarAlt className="flex-shrink-0" />
          <span>
            <b>Zimmet Tarihi:</b>{" "}
            {new Date(assignment.assignmentDate).toLocaleDateString("tr-TR")}
          </span>
        </div>
        {assignment.assignmentNotes && (
          <div className="sm:col-span-2 flex items-start gap-2 text-text-light">
            <FaInfoCircle className="flex-shrink-0 mt-1" />
            <span>
              <b>Not:</b> {assignment.assignmentNotes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentCard;
