import React from "react";
import {
  FaEdit,
  FaTrash,
  FaHistory,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaTrashAlt,
  FaTimesCircle,
} from "react-icons/fa";

const StatusBadge = ({ status }) => {
  switch (status) {
    case "Zimmetli":
      return (
        <span className="status-badge status-zimmetli">
          <FaCheckCircle /> Zimmetli
        </span>
      );
    case "Arızalı":
      return (
        <span className="status-badge status-arizali">
          <FaExclamationTriangle /> Arızalı
        </span>
      );
    case "Beklemede":
      return (
        <span className="status-badge status-beklemede">
          <FaClock /> Beklemede
        </span>
      );
    case "Hurda":
      return (
        <span className="status-badge status-hurda">
          <FaTrashAlt /> Hurda
        </span>
      );
    default: // Boşta
      return (
        <span className="status-badge status-unassigned">
          <FaTimesCircle /> Boşta
        </span>
      );
  }
};

const ItemsTable = ({
  items,
  userInfo,
  handleOpenModal,
  handleDeleteClick,
  handleHistoryClick,
}) => {
  return (
    <div className="table-container">
      <h2>Mevcut Eşyalar</h2>
      <table>
        <thead>
          <tr>
            <th>Eşya Adı</th>
            <th>Varlık Cinsi</th>
            <th>Durum</th>
            <th>Marka</th>
            <th>Demirbaş No</th>
            <th>Seri No</th>
            <th>Açıklama</th>
            {(userInfo?.role === "admin" || userInfo?.role === "developer") && (
              <th>İşlemler</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.assetType}</td>
              <td>
                <StatusBadge status={item.assignmentStatus} />
              </td>
              <td>{item.brand || "-"}</td>
              <td>{item.assetTag || "-"}</td>
              <td>{item.serialNumber || "-"}</td>
              <td>{item.description || "-"}</td>
              {userInfo &&
                (userInfo.role === "admin" ||
                  userInfo.role === "developer") && (
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        title="Düzenle"
                        onClick={() => handleOpenModal("edit", item)}
                        style={{ padding: "8px 12px" }}
                      >
                        {" "}
                        <FaEdit />{" "}
                      </button>
                      <button
                        title="Sil"
                        onClick={() => handleDeleteClick(item)}
                        style={{
                          backgroundColor: "var(--danger-color)",
                          padding: "8px 12px",
                        }}
                      >
                        {" "}
                        <FaTrash />{" "}
                      </button>
                      <button
                        title="Geçmişi Görüntüle"
                        onClick={() => handleHistoryClick(item)}
                        style={{
                          padding: "8px 12px",
                          color: "var(--secondary-color)",
                        }}
                      >
                        {" "}
                        <FaHistory />{" "}
                      </button>
                    </div>
                  </td>
                )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ItemsTable;
