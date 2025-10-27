import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaBuilding, FaPlus } from "react-icons/fa";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";

const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const { userInfo } = useAuth();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await axiosInstance.get("/locations");
        setLocations(data);
      } catch (err) {
        setError(
          err.response && err.response.data.message
            ? err.response.data.message
            : err.message
        );
      }
      setLoading(false);
    };

    fetchLocations();
  }, [userInfo?.token]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!name) {
      setSubmitError("Konum adı boş olamaz.");
      return;
    }
    try {
      const { data } = await axiosInstance.post("/locations", { name });
      setLocations([...locations, data]);
      setName("");
      toast.success("Yeni konum başarıyla eklendi.");
    } catch (err) {
      setSubmitError(
        err.response && err.response.data.message
          ? err.response.data.message
          : err.message
      );
    }
  };

  return (
    <div className="page-container">
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
                <p style={{ color: "red", marginTop: "0.5rem" }}>
                  {submitError}
                </p>
              )}
            </div>
          )}
      </div>
      {loading ? (
        <Loader />
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
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
      )}
    </div>
  );
};

export default LocationsPage;
