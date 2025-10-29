import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Button from "../shared/Button";

const PersonnelDetailsHeader = ({ personnel }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-border">
      <div className="flex items-center gap-6">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
          {personnel.personnelName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-main">
            {personnel.personnelName}
          </h1>
          <p className="text-text-light mt-1">
            Sicil No: {personnel.personnelId}
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        onClick={() => navigate(-1)}
        className="w-full sm:w-auto"
      >
        <FaArrowLeft className="mr-2" /> Geri Dön
      </Button>
    </div>
  );
};

export default PersonnelDetailsHeader;
