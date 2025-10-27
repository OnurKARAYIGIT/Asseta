import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../components/AuthContext";

const PendingCountContext = createContext();

export const usePendingCount = () => useContext(PendingCountContext);

export const PendingCountProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const { userInfo } = useAuth();

  const fetchPendingCount = useCallback(async () => {
    if (
      userInfo &&
      (userInfo.role === "admin" || userInfo.role === "developer")
    ) {
      try {
        const { data } = await axiosInstance.get("/assignments", {
          params: { status: "Beklemede", limit: 1 }, // Sadece toplam sayıyı almak için
        });
        setPendingCount(data.total || 0);
      } catch (error) {
        console.error("Bekleyen zimmet sayısı alınamadı:", error);
      }
    }
  }, [userInfo]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  const value = { pendingCount, refetchPendingCount: fetchPendingCount };

  return (
    <PendingCountContext.Provider value={value}>
      {children}
    </PendingCountContext.Provider>
  );
};
