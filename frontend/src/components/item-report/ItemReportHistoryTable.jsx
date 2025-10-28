import React from "react";

const ItemReportHistoryTable = ({ assignments }) => {
  return (
    <div className="table-container">
      <h2>Zimmet Geçmişi</h2>
      <table>
        <thead>
          <tr>
            <th>Personel</th>
            <th>Konum</th>
            <th>Birim</th>
            <th>Durum</th>
            <th>Zimmet Tarihi</th>
            <th>İade Tarihi</th>
          </tr>
        </thead>
        <tbody>
          {assignments
            .sort(
              (a, b) => new Date(b.assignmentDate) - new Date(a.assignmentDate)
            )
            .map((assign) => (
              <tr key={assign._id}>
                <td>{assign.personnelName}</td>
                <td>{assign.company.name}</td>
                <td>{assign.unit}</td>
                <td>
                  <span
                    className={`summary-status-badge status-${assign.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {assign.status}
                  </span>
                </td>
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

export default ItemReportHistoryTable;
