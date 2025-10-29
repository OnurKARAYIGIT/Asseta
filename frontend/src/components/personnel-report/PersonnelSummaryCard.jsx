import React from "react";
import { FaUser } from "react-icons/fa";

const PersonnelSummaryCard = ({ results, searchedPersonnel, onClick }) => {
  return (
    <div
      className="mt-8 flex cursor-pointer items-center gap-8 rounded-xl border border-border bg-card-background p-8 shadow-lg transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl print:hidden"
      onClick={onClick}
      title="Bu personele ait tüm zimmetleri görmek için tıklayın"
    >
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FaUser />
      </div>
      <div className="flex flex-grow flex-col gap-6">
        <div>
          <h2 className="text-4xl font-bold text-text-main">
            {searchedPersonnel}
          </h2>
          <p className="mt-1 text-base text-text-light">
            Personel Zimmet Özeti
          </p>
        </div>
        <div className="flex gap-8 border-t border-border pt-6">
          <div>
            <div className="text-xs font-medium uppercase text-text-light">
              Toplam Zimmet
            </div>
            <div className="text-5xl font-bold text-secondary">
              {results.length}
            </div>
          </div>
          <div className="flex-grow">
            <div className="text-xs font-medium uppercase text-text-light">
              Bulunduğu Konumlar
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...new Set(results.map((r) => r.company.name))].map((loc) => (
                <span
                  key={loc}
                  className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {loc}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelSummaryCard;
