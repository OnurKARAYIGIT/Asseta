import React from "react";
import { FaColumns } from "react-icons/fa";

const ColumnManager = ({ visibleColumns, allColumns, onColumnChange }) => {
  return (
    <div className="border-t border-border-color pt-8">
      <div className="flex items-start gap-4">
        <FaColumns className="text-secondary text-xl mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-main">
            Tablo Sütun Görünümü
          </h3>
          <p className="text-sm text-text-light mt-1">
            Zimmetler sayfasında varsayılan olarak görmek istediğiniz sütunları
            seçerek tabloyu kişiselleştirin.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {allColumns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 cursor-pointer rounded-full border border-border-color bg-background-color py-2 px-4 hover:bg-light-gray-color transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => onColumnChange(col.key)}
                  className="h-4 w-4 rounded-sm border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-text-main select-none">{col.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnManager;
