import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

// Tarih formatlama için yardımcı fonksiyon
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const ActivityItem = ({ assignment }) => {
  // Gerekli verileri assignment objesinden ayrıştıralım
  const { _id, item, personnelName, createdAt } = assignment;

  return (
    <li>
      <Link to={`/assignments?openModal=${_id}`}>
        <div className="activity-item">
          <span className="activity-item-name">
            {item?.name || "Silinmiş Eşya"}
          </span>
          <span className="activity-personnel">
            {personnelName} personeline zimmetlendi.
          </span>
        </div>
        <span className="activity-date">{formatDate(createdAt)}</span>
        {/* Bu ikon dekoratif olduğu için ekran okuyuculardan gizleyelim */}
        <FaChevronRight className="activity-arrow" aria-hidden="true" />
      </Link>
    </li>
  );
};

export default ActivityItem;
