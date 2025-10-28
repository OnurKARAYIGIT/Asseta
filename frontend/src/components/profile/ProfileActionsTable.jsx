import React from "react";

const ProfileActionsTable = ({ actions }) => {
  return (
    <div className="profile-card profile-history-card">
      <h2>İşlem Geçmişim ({actions?.length || 0})</h2>
      {actions && actions.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>İşlem</th>
                <th>Detay</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action._id}>
                  <td>{action.action.replace(/_/g, " ")}</td>
                  <td>{action.details}</td>
                  <td>{new Date(action.createdAt).toLocaleString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Herhangi bir işlem geçmişiniz bulunmamaktadır.</p>
      )}
    </div>
  );
};

export default ProfileActionsTable;
