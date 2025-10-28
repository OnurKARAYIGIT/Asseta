import React from "react";
import { FaBuilding, FaPlus } from "react-icons/fa";

const LocationsToolbar = ({
  name,
  setName,
  submitHandler,
  submitError,
  userInfo,
}) => {
  return (
    <div className="page-header">
      <h1>
        <FaBuilding style={{ color: "var(--secondary-color)" }} /> Konum
        Yönetimi
      </h1>
      {userInfo &&
        (userInfo.role === "admin" || userInfo.role === "developer") && (
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <form onSubmit={submitHandler} className="add-location-form">
              <input
                type="text"
                placeholder="Yeni konum adı ekle..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <button type="submit">
                <FaPlus /> Ekle
              </button>
            </form>
            {submitError && (
              <p style={{ color: "red", marginTop: "0.5rem" }}>{submitError}</p>
            )}
          </div>
        )}
    </div>
  );
};

export default LocationsToolbar;
