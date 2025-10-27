import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaSearch, FaClipboardList, FaBoxOpen, FaUser } from "react-icons/fa";
import "./SearchResultsPage.css";

const SearchResultsPage = () => {
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const allPages = [
    { name: "Ana Panel", path: "/dashboard" },
    { name: "Zimmet Yönetimi", path: "/assignments" },
    { name: "Eşya Yönetimi", path: "/items" },
    { name: "Admin Paneli", path: "/admin" },
    { name: "Ayarlar", path: "/settings" },
    { name: "Profilim", path: "/profile" },
    { name: "Denetim Kayıtları", path: "/audit-logs" },
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q") || "";
    setSearchTerm(query);

    if (query) {
      const fetchResults = async () => {
        setLoading(true);
        try {
          const { data } = await axiosInstance.get(`/search?q=${query}`);
          setResults(data);
        } catch (error) {
          console.error("Arama sonuçları alınamadı:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    } else {
      setResults(null);
      setLoading(false);
    }
  }, [location.search]);

  const filteredPages = searchTerm
    ? allPages.filter((page) =>
        page.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const renderResult = (item, type) => {
    if (type === "assignment") {
      return (
        <Link to={`/assignments?openModal=${item._id}`} className="result-item">
          <FaClipboardList className="result-icon" />
          <div className="result-details">
            <span className="result-title">
              {item.personnelName} - {item.item.name}
            </span>
            <span className="result-subtitle">Zimmet Kaydı</span>
          </div>
        </Link>
      );
    }
    if (type === "item") {
      return (
        <Link to="/items" className="result-item">
          <FaBoxOpen className="result-icon" />
          <div className="result-details">
            <span className="result-title">
              {item.name} ({item.assetTag})
            </span>
            <span className="result-subtitle">Eşya</span>
          </div>
        </Link>
      );
    }
    if (type === "user") {
      return (
        <Link to="/admin" className="result-item">
          <FaUser className="result-icon" />
          <div className="result-details">
            <span className="result-title">{item.username}</span>
            <span className="result-subtitle">Kullanıcı</span>
          </div>
        </Link>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      <h1>
        <FaSearch style={{ color: "var(--secondary-color)" }} /> Arama Sonuçları
      </h1>
      <p>
        <strong>"{searchTerm}"</strong> için bulunan sonuçlar:
      </p>

      {loading ? (
        <Loader />
      ) : (
        <div className="search-results-container">
          {results?.assignments?.length > 0 && (
            <div className="result-category">
              <h2>Zimmetler</h2>
              {results.assignments.map((item) =>
                renderResult(item, "assignment")
              )}
            </div>
          )}
          {results?.items?.length > 0 && (
            <div className="result-category">
              <h2>Eşyalar</h2>
              {results.items.map((item) => renderResult(item, "item"))}
            </div>
          )}
          {results?.users?.length > 0 && (
            <div className="result-category">
              <h2>Kullanıcılar</h2>
              {results.users.map((item) => renderResult(item, "user"))}
            </div>
          )}
          {filteredPages.length > 0 && (
            <div className="result-category">
              <h2>Sayfalar</h2>
              {filteredPages.map((page) => (
                <Link to={page.path} key={page.path} className="result-item">
                  <div className="result-details">
                    <span className="result-title">{page.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
