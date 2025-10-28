import React from "react";

const LocationsTable = ({ locations }) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Konum Adı</th>
            <th>Oluşturulma Tarihi</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location._id}>
              <td>{location.name}</td>
              <td>
                {new Date(location.createdAt).toLocaleDateString("tr-TR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LocationsTable;
