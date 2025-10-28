import React from "react";
import Modal from "../Modal";
import Loader from "../Loader";
import { FaUser } from "react-icons/fa";

const PersonnelSummary = ({ data }) => {
  const activeAssignments = data.filter(
    (a) => a.status === "Zimmetli" || a.status === "Arızalı"
  );
  const pastAssignments = data.filter(
    (a) => a.status === "İade Edildi" || a.status === "Hurda"
  );

  if (data.length === 0) {
    return <p>Bu personele ait zimmet kaydı bulunamadı.</p>;
  }

  return (
    <div className="summary-modal-card">
      <div className="summary-avatar">
        <FaUser />
      </div>
      <div className="summary-details">
        <div className="summary-stats">
          <div className="summary-stat-item">
            <span className="summary-stat-value">
              {activeAssignments.length}
            </span>
            <span className="summary-stat-label">Mevcut Zimmet</span>
          </div>
          <div className="summary-stat-item">
            <span className="summary-stat-value">{pastAssignments.length}</span>
            <span className="summary-stat-label">Geçmiş Zimmet</span>
          </div>
        </div>
        <div className="summary-locations">
          <span className="summary-stat-label">Bulunduğu Konumlar</span>
          <div className="summary-location-tags">
            {[...new Set(data.map((r) => r.company.name))].map((loc) => (
              <span key={loc} className="summary-location-tag">
                {loc}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemHistorySummary = ({ data }) => {
  if (data.length === 0) {
    return <p>Bu eşyaya ait zimmet geçmişi bulunamadı.</p>;
  }

  return (
    <div className="table-container" style={{ maxHeight: "50vh" }}>
      <table className="summary-item-history-table">
        <thead>
          <tr>
            <th>Personel</th>
            <th>Durum</th>
            <th>Zimmet Tarihi</th>
            <th>İade Tarihi</th>
          </tr>
        </thead>
        <tbody>
          {data.map((assign) => (
            <tr key={assign._id}>
              <td>{assign.personnelName}</td>
              <td>{assign.status}</td>
              <td>{new Date(assign.assignmentDate).toLocaleDateString()}</td>
              <td>
                {assign.returnDate
                  ? new Date(assign.returnDate).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SummaryModal = ({
  isOpen,
  onClose,
  title,
  loading,
  data,
  type,
  onGoToDetails,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="large">
      {loading ? (
        <Loader />
      ) : (
        <>
          {type === "personnel" ? (
            <PersonnelSummary data={data} />
          ) : (
            <ItemHistorySummary data={data} />
          )}
        </>
      )}
      {type === "personnel" && !loading && data.length > 0 && (
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button onClick={onGoToDetails} className="primary">
            Detaylı Rapora Git
          </button>
        </div>
      )}
    </Modal>
  );
};

export default SummaryModal;
