import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaBoxOpen, FaSearch, FaPrint } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import Button from "../components/shared/Button";

const ItemReportPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
  const location = useLocation();

  // --- React Query ile Veri Çekme ---
  const {
    data: reportData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["itemReport", submittedSearchTerm],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/assignments/search", {
        params: { itemAssetTag: submittedSearchTerm },
      });
      // Backend'den gelen veri bir dizi içinde tek bir obje olabilir.
      // Eğer öyleyse, o objeyi doğrudan döndür.
      if (data && data.length > 0) {
        return data[0];
      }
      return null; // Sonuç bulunamazsa null döndür.
    },
    enabled: !!submittedSearchTerm,
  });

  // URL'den gelen arama terimini dinle
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get("keyword");
    if (keyword) {
      setSearchTerm(keyword);
      setSubmittedSearchTerm(keyword);
    }
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSubmittedSearchTerm(searchTerm.trim());
    }
  };

  const itemData = reportData || null;
  const noResultsFound = !isLoading && submittedSearchTerm && !itemData;

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <FaBoxOpen className="text-secondary text-2xl" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
            Eşya Zimmet Raporu
          </h1>
        </div>
        <form onSubmit={handleSearch} className="flex-grow sm:max-w-md w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-text-light" />
            </div>
            <input
              type="text"
              placeholder="Demirbaş veya Seri No ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </form>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="submit"
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Aranıyor..." : "Ara"}
          </Button>
        </div>
      </div>

      {isError && (
        <p className="text-danger bg-danger/10 p-3 rounded-lg my-4">
          {error.message}
        </p>
      )}

      {noResultsFound && (
        <p className="text-text-light text-center py-8">
          "{submittedSearchTerm}" kriterine uygun eşya bulunamadı.
        </p>
      )}

      {itemData && (
        <div className="report-content mt-6">
          {/* Arama çubuğu ve butonlar buraya taşındı */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden">
            <form
              onSubmit={handleSearch}
              className="flex-grow sm:max-w-md w-full"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-text-light" />
                </div>
                <input
                  type="text"
                  placeholder="Demirbaş veya Seri No ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </form>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="submit"
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Aranıyor..." : "Ara"}
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-main">
                {itemData.assignments[0]?.item?.name || "Eşya Adı Bilinmiyor"}
              </h2>
              <p className="text-text-light mt-1">
                <strong>Demirbaş No:</strong>{" "}
                {itemData.assignments[0]?.item?.assetTag || "-"} |{" "}
                <strong>Seri No:</strong>{" "}
                {itemData.assignments[0]?.item?.serialNumber || "-"}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="print:hidden"
            >
              <FaPrint className="mr-2" /> Yazdır
            </Button>
          </div>

          <h3 className="text-xl font-semibold text-text-main mb-4">
            Zimmet Geçmişi
          </h3>
          <div className="overflow-x-auto bg-card-background rounded-lg shadow border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-light-gray">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Personel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Birim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Zimmet Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    İade Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {itemData.assignments.map((assignment) => (
                  <tr
                    key={assignment._id}
                    className="hover:bg-background transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main">
                      {assignment.personnelName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                      {assignment.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                      {new Date(assignment.assignmentDate).toLocaleDateString(
                        "tr-TR"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                      {assignment.returnDate
                        ? new Date(assignment.returnDate).toLocaleDateString(
                            "tr-TR"
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          assignment.status === "Zimmetli"
                            ? "bg-blue-100 text-blue-800"
                            : ""
                        }
                        ${
                          assignment.status === "İade Edildi"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                        ${
                          assignment.status === "Arızalı"
                            ? "bg-red-100 text-red-800"
                            : ""
                        }
                        ${
                          assignment.status === "Beklemede"
                            ? "bg-yellow-100 text-yellow-800"
                            : ""
                        }
                        ${
                          assignment.status === "Hurda"
                            ? "bg-gray-700 text-gray-100"
                            : ""
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemReportPage;
