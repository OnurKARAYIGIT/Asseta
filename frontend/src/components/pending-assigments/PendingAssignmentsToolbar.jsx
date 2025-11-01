import React from "react";
import Button from "../shared/Button";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const PendingAssignmentsToolbar = ({
  onApproveSelected,
  onRejectSelected,
  selectedCount,
}) => {
  const hasSelection = selectedCount > 0;

  return (
    <div className="bg-card-background p-4 rounded-lg mb-6 flex justify-end items-center gap-4 border border-border-color">
      <span className="text-sm text-text-secondary mr-4">
        {selectedCount} personel seçildi
      </span>
      <Button
        onClick={onApproveSelected}
        variant="success"
        disabled={!hasSelection}
        icon={<FaCheckCircle />}
      >
        Seçilenleri Onayla
      </Button>
      <Button
        onClick={onRejectSelected}
        variant="danger"
        disabled={!hasSelection}
        icon={<FaTimesCircle />}
      >
        Seçilenleri Reddet
      </Button>
    </div>
  );
};

export default PendingAssignmentsToolbar;
