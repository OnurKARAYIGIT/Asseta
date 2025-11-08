import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter, // Stratejiyi değiştiriyoruz
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import PipelineColumn from "./PipelineColumn";
import CandidateCard from "./CandidateCard";

// GÜVENİLİR YAPI: Sütunlar için standart ID'ler ve Türkçe başlıklar.
// ID'ler sadece ASCII karakterler içermelidir.
const PIPELINE_STAGES = [
  { id: "basvuru-alindi", title: "Başvuru Alındı" },
  { id: "on-degerlendirme", title: "Ön Değerlendirme" },
  { id: "ik-mulakati", title: "İK Mülakatı" },
  { id: "teknik-mulakat", title: "Teknik Mülakat" },
  { id: "teklif", title: "Teklif" },
  { id: "ise-alindi", title: "İşe Alındı" },
  { id: "reddedildi", title: "Reddedildi" },
];

// Backend'den gelen Türkçe status'u standart ID'ye çeviren bir harita.
const statusToIdMap = PIPELINE_STAGES.reduce((acc, stage) => {
  acc[stage.title] = stage.id;
  return acc;
}, {});

// Standart ID'den Türkçe başlığa çeviren bir harita.
const idToTitleMap = PIPELINE_STAGES.reduce((acc, stage) => {
  acc[stage.id] = stage.title;
  return acc;
}, {});

const RecruitmentPipeline = ({
  applications,
  onUpdateStatus,
  onViewDetails,
}) => {
  const [activeId, setActiveId] = useState(null);

  // SADELENMİŞ YAPI: `applications` prop'u her değiştiğinde sütunları yeniden hesapla.
  // `useState` ve `useEffect` yerine `useMemo` kullanarak gereksiz render'ları önle.
  const columns = useMemo(() => {
    // Sütunları standart ID'lere göre grupla
    const groupedApplications = PIPELINE_STAGES.reduce((acc, stage) => {
      // Gelen başvuruları Türkçe durumlarına göre filtrele
      acc[stage.id] = applications.filter((app) => app.status === stage.title);
      return acc;
    }, {});
    return groupedApplications;
  }, [applications]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // TAMAMEN YENİLENMİŞ handleDragEnd FONKSİYONU
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null); // Sürükleme bitince her zaman temizle

    // Eğer bir hedef sütunun üzerine bırakılmadıysa, hiçbir şey yapma
    if (!over) {
      return;
    }

    const activeApplication = active.data.current?.application;
    const sourceColumnId = active.data.current?.sourceColumnId;
    const destinationColumnId = over.id;

    if (activeApplication && sourceColumnId !== destinationColumnId) {
      onUpdateStatus({
        applicationId: activeApplication._id,
        newStatus: idToTitleMap[destinationColumnId],
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Sürüklenen kartı bulmak için yardımcı fonksiyon
  const findActiveCard = () => {
    if (!activeId) return null;
    for (const key in columns) {
      const found = columns[key].find((item) => item._id === activeId);
      if (found) return found;
    }
    return null;
  };
  const activeCard = findActiveCard();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter} // Daha stabil bir çarpışma tespiti
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto p-1">
        {PIPELINE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage.id}
            id={stage.id} // Güvenilir ID
            title={stage.title} // Görünen başlık
            items={columns[stage.id] || []}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
      {/* YENİ: Sürükleme Katmanı */}
      <DragOverlay>
        {activeId && activeCard ? (
          // Sürüklenirken gösterilecek "hayalet" kart
          <CandidateCard
            id={activeCard._id}
            application={activeCard}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default RecruitmentPipeline;
