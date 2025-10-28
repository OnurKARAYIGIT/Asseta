import React from "react";

const PersonnelChoices = ({ choices, onSelect }) => {
  if (!choices || choices.length === 0) {
    return null;
  }

  return (
    <div className="personnel-choices-container no-print">
      <h4>Arama Kriterinize Uyan Birden Fazla Personel Bulundu</h4>
      <p>Lütfen raporunu görüntülemek istediğiniz personeli seçin:</p>
      <div className="personnel-choices-list">
        {choices.map((p) => (
          <button
            key={p.personnelId || p.personnelName}
            onClick={() => onSelect(p)}
            className="choice-button"
          >
            <span className="choice-name">{p.personnelName}</span>
            <span className="choice-badge">{p.assignments.length} zimmet</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonnelChoices;
