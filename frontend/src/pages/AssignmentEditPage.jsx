import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";
import { FaSave } from "react-icons/fa";
import { useAuth } from "../components/AuthContext";

const AssignmentEditPage = () => {
  const { id: assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [status, setStatus] = useState("zimmetli");
  const [returnDate, setReturnDate] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");

  const { userInfo } = useAuth();

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get(
          `/api/assignments/${assignmentId}`,
          config
        );
        setAssignment(data);
        setStatus(data.status);
        setAssignmentNotes(data.assignmentNotes || "");
        if (data.returnDate) {
          setReturnDate(data.returnDate.substring(0, 10)); // Tarihi YYYY-MM-DD formatına çevir
        }
        setLoading(false);
      } catch (err) {
        setError("Zimmet detayı getirilemedi.");
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId, userInfo?.token]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setUpdateError("");
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.put(
        `/api/assignments/${assignmentId}`,
        { status, returnDate, assignmentNotes },
        config
      );
      navigate("/zimmetler");
    } catch (err) {
      setUpdateError("Güncelleme sırasında bir hata oluştu.");
    }
  };

  return (
    <div className="page-container">
      <h1>Zimmet Detayı ve Güncelleme</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        assignment && (
          <form onSubmit={submitHandler}>
            <p>
              <strong>Personel:</strong> {assignment.personnelName}
            </p>
            <p>
              <strong>Eşya:</strong> {assignment.item.name} (SN:{" "}
              {assignment.item.serialNumber})
            </p>
            <div style={{ margin: "1.5rem 0" }}>
              <label>Zimmet Durumu</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="zimmetli">Zimmetli</option>
                <option value="iade edildi">İade Edildi</option>
              </select>
            </div>
            {status === "iade edildi" && (
              <div style={{ margin: "1.5rem 0" }}>
                <label>İade Tarihi</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            )}
            <div style={{ margin: "1.5rem 0" }}>
              <label>Açıklama / Notlar</label>
              <textarea
                rows="4"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              ></textarea>
            </div>
            {updateError && <p style={{ color: "red" }}>{updateError}</p>}
            <button
              type="submit"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FaSave /> Değişiklikleri Kaydet
            </button>
          </form>
        )
      )}
    </div>
  );
};

export default AssignmentEditPage;
