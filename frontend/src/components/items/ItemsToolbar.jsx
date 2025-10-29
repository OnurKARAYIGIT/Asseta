import React, { useState } from "react";

const ItemsToolbar = ({
  statusFilter,
  setStatusFilter,
  assetTypeFilter,
  setAssetTypeFilter,
  searchTerm,
  setSearchTerm,
  assetTypesList,
}) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const statusButtons = [
    { label: "Tümü", value: "" },
    { label: "Zimmetli", value: "assigned" },
    { label: "Arızalı", value: "arizali" },
    { label: "Beklemede", value: "beklemede" },
    { label: "Boşta", value: "unassigned" },
    { label: "Hurda", value: "hurda" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
      {/* Durum Filtre Butonları */}
      <div className="flex-shrink-0 bg-light-gray p-1 rounded-lg flex items-center gap-1">
        {statusButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setStatusFilter(btn.value)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              statusFilter === btn.value
                ? "bg-white text-primary shadow"
                : "text-text-light hover:text-text-main"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      {/* Diğer Filtreler */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <select
          value={assetTypeFilter}
          onChange={(e) => setAssetTypeFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Tüm Varlık Cinsleri</option>
          {assetTypesList.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Eşya ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
    </div>
  );
};

export default ItemsToolbar;
