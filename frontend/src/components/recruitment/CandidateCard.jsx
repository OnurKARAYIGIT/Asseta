import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
  FaGripVertical,
  FaLinkedin,
  FaGlobe,
  FaUsers,
  FaFileAlt,
  FaPaperclip,
  FaTag,
  FaFileSignature,
} from "react-icons/fa";

const sourceIcons = {
  LinkedIn: <FaLinkedin className="text-blue-500" />,
  "Web Sitesi": <FaGlobe className="text-green-500" />,
  Referans: <FaUsers className="text-purple-500" />,
  "Kariyer.net": <FaFileAlt className="text-orange-500" />,
  "İş-Kur": <FaFileAlt className="text-red-500" />,
  Diğer: <FaFileAlt className="text-gray-500" />,
};
const CandidateCard = ({
  id,
  application,
  onViewDetails,
  sourceColumnId,
  isOverlay,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
      data: { application, sourceColumnId },
    });

  const { candidate } = application;

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging && !isOverlay ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card-background p-3 rounded-lg shadow border border-border touch-none flex flex-col gap-2 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={(e) => {
        // Eğer sürükleme katmanındaysa veya sürükleniyorsa tıklama olayını engelle
        if (isOverlay || isDragging) return;
        // Sadece sürükleme tutamacına tıklandıysa modalı açma
        if (e.target.closest(".drag-handle")) return;
        onViewDetails(candidate);
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-main truncate">
          {candidate.fullName}
        </p>
        <div
          {...listeners}
          {...attributes}
          className="drag-handle cursor-grab text-text-light hover:text-text-main pl-2"
        >
          <FaGripVertical />
        </div>
      </div>
      <p className="text-xs text-text-light -mt-2">{candidate.email}</p>

      {/* YENİ: Etiketler (Tags) */}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {candidate.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold bg-primary/10 text-primary-dark px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* YENİ: Teklif Durumu için özel gösterim */}
      {application.status === "Teklif" && (
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-md">
          <FaFileSignature className="flex-shrink-0" />
          <span className="font-semibold">İş Teklifi Yapıldı</span>
        </div>
      )}

      {/* YENİ: Kaynak ve Belge Sayısı */}
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-text-light">
          {sourceIcons[candidate.source] || <FaFileAlt />}
          <span>{candidate.source || "Bilinmiyor"}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-light">
          {application.createdAt && (
            <span title={new Date(application.createdAt).toLocaleString()}>
              {formatDistanceToNow(new Date(application.createdAt), {
                addSuffix: true,
                locale: tr,
              })}
            </span>
          )}
          {candidate.resumePaths && candidate.resumePaths.length > 0 && (
            <div className="flex items-center gap-1" title="Belge Sayısı">
              <FaPaperclip />
              <span>{candidate.resumePaths.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;
