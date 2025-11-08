import React from "react";
import { useDroppable } from "@dnd-kit/core";
import CandidateCard from "./CandidateCard";

const PipelineColumn = ({ id, title, items, onViewDetails }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });
  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-72 bg-background-soft rounded-lg shadow-inner flex-shrink-0"
    >
      <div className="p-3 border-b border-border">
        <h4 className="font-semibold text-text-main text-sm">
          {title}
          <span className="ml-2 text-xs font-normal bg-primary/20 text-primary-dark px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </h4>
      </div>
      <div className="flex-1 p-2 overflow-y-auto min-h-[200px] space-y-2">
        {items.map((item) => (
          <CandidateCard
            key={item._id}
            id={item._id}
            application={item}
            sourceColumnId={id} // Kartın hangi sütundan geldiğini bilmesi için
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default PipelineColumn;
