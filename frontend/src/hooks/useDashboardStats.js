import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

export const useDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get("/dashboard/stats");
        setStats(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "İstatistikler yüklenirken bir hata oluştu."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};
