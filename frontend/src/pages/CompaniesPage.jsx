import React, { useState, useEffect } from "react";
import axios from "axios";

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        // API endpoint'i için tam URL kullanmak yerine proxy ayarından faydalanacağız.
        const { data } = await axios.get("/api/companies", config);
        setCompanies(data);
        setLoading(false);
      } catch (err) {
        setError(
          err.response && err.response.data.message
            ? err.response.data.message
            : err.message
        );
        setLoading(false);
      }
    };

    if (userInfo && userInfo.token) {
      fetchCompanies();
    } else {
      setError("Bu sayfayı görüntülemek için giriş yapmalısınız.");
      setLoading(false);
    }
  }, [userInfo.token]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!name) {
      setSubmitError("Şirket adı boş olamaz.");
      return;
    }
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.post("/api/companies", { name }, config);
      setCompanies([...companies, data]);
      setName("");
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
      <h1>Şirket Yönetimi</h1>
      {loading ? (
        <p>Yükleniyor...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div style={{ display: "flex", gap: "2rem" }}>
          <div style={{ flex: 1 }}>
            <h2>Mevcut Şirketler</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {companies.map((company) => (
                <li
                  key={company._id}
                  style={{
                    background: "#eee",
                    padding: "10px",
                    marginBottom: "5px",
                    borderRadius: "4px",
                  }}
                >
                  {company.name}
                </li>
              ))}
            </ul>
          </div>
          {userInfo && userInfo.role === "admin" && (
            <div style={{ flex: 1 }}>
              <h2>Yeni Şirket Ekle</h2>
              {submitError && <p style={{ color: "red" }}>{submitError}</p>}
              <form onSubmit={submitHandler}>
                <input
                  type="text"
                  placeholder="Yeni şirket adı"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                  }}
                />
                <button
                  type="submit"
                  style={{ width: "100%", padding: "10px", cursor: "pointer" }}
                >
                  Ekle
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
