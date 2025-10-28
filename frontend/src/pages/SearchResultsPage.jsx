import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaSearch } from "react-icons/fa";
import "./SearchResultsPage.css";
import SearchResultCategory from "../components/search/SearchResultCategory";

const SearchResultsPage = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(""); // Sadece arama terimini göstermek için

  const allPages = [
    { name: "Ana Panel", path: "/dashboard" },
    { name: "Zimmet Yönetimi", path: "/assignments" },
    { name: "Eşya Yönetimi", path: "/items" },
    { name: "Admin Paneli", path: "/admin" },
    { name: "Ayarlar", path: "/settings" },
    { name: "Profilim", path: "/profile" },
    { name: "Denetim Kayıtları", path: "/audit-logs" },
  ];

  // URL'den arama terimini al
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q") || "";
    setSearchTerm(query);
  }, [location.search]);

  // --- React Query ile Veri Çekme ---
  const {
    data: results,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["searchResults", searchTerm],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/search?q=${searchTerm}`);
      return data;
    },
    enabled: !!searchTerm, // Sadece bir arama terimi varsa sorguyu çalıştır
  });

  const filteredPages = searchTerm
    ? allPages.filter((page) =>
        page.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="page-container">
      <h1>
        <FaSearch style={{ color: "var(--secondary-color)" }} /> Arama Sonuçları
      </h1>
      <p>
        <strong>"{searchTerm}"</strong> için bulunan sonuçlar:
      </p>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="error-message">{error.message}</p>
      ) : (
        <div className="search-results-container">
          <SearchResultCategory
            title="Zimmetler"
            items={results?.assignments}
            type="assignment"
          />
          <SearchResultCategory
            title="Eşyalar"
            items={results?.items}
            type="item"
          />
          <SearchResultCategory
            title="Kullanıcılar"
            items={results?.users}
            type="user"
          />
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
