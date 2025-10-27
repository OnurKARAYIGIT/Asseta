import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { useSettings } from "./SettingsContext";

export const useItems = () => {
  const { settings } = useSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(settings.itemsPerPage || 15);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // 'assigned', 'unassigned', 'arizali', ''
  const [assetTypeFilter, setAssetTypeFilter] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Arama terimi değiştiğinde 500ms gecikme ile arama yap
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Yeni arama yapıldığında ilk sayfaya dön
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/items", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          keyword: debouncedSearchTerm,
          status: statusFilter,
          assetType: assetTypeFilter,
        },
      });
      setItems(data.items);
      setTotalPages(data.pages);
      setTotalItems(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearchTerm,
    statusFilter,
    assetTypeFilter,
  ]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    currentPage,
    setCurrentPage,
    totalItems,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    statusFilter,
    setStatusFilter,
    assetTypeFilter,
    setAssetTypeFilter,
    searchTerm,
    setSearchTerm,
    refetchItems: fetchItems,
  };
};
