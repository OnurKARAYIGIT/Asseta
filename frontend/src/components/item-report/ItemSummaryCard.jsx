import React from "react";
import {
  FaBoxOpen,
  FaTag,
  FaBarcode,
  FaInfoCircle,
  FaCalendarCheck,
} from "react-icons/fa";

const ItemSummaryCard = ({ itemData }) => {
  if (!itemData || !itemData.assignments || itemData.assignments.length === 0) {
    return null;
  }

  // Eşya bilgileri ve son zimmet durumu, ilk zimmet kaydından alınabilir.
  const item = itemData.assignments[0]?.item || {};
  const lastStatus = itemData.assignments[0]?.status || "Bilinmiyor";

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-start gap-8 rounded-xl border border-border bg-background/50 p-6 shadow-lg">
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-secondary/10 text-4xl text-secondary">
        <FaBoxOpen />
      </div>
      <div className="flex-grow">
        <h2 className="text-2xl font-bold text-text-main">{item.name}</h2>
        <p className="text-text-light mt-1">Eşya Zimmet Özeti</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-2 text-text-light">
            <FaTag className="flex-shrink-0" />
            <span>
              <strong>Demirbaş No:</strong> {item.assetTag}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-light">
            <FaBarcode className="flex-shrink-0" />
            <span>
              <strong>Seri No:</strong> {item.serialNumber || "-"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-light">
            <FaCalendarCheck className="flex-shrink-0" />
            <span>
              <strong>Mevcut Durum:</strong> {lastStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSummaryCard;
