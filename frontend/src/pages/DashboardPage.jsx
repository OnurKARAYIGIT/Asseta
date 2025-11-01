import React from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../components/AuthContext";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import RecentActivity from "../components/RecentActivity";
import ExampleModal from "../components/examples/ExampleModal";

// Yeni, özelleşmiş grafik bileşenlerini import et
import ItemDistributionChart from "../components/ItemDistributionChart";
import MonthlyAssignmentsChart from "../components/MonthlyAssignmentsChart";
import StatusDistributionChart from "../components/StatusDistributionChart";
import LocationAssignmentsChart from "../components/LocationAssignmentsChart";

import {
  FaBoxOpen,
  FaClipboardList,
  FaUsers,
  FaMapMarkerAlt,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
} from "chart.js";

import "./DashboardPage.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  DoughnutController
);

const DashboardPage = () => {
  const { userInfo } = useAuth();

  // --- React Query ile Veri Çekme ---
  const {
    data: stats,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/dashboard/stats");
      return data;
    },
    refetchInterval: 1000 * 60, // 1 dakikada bir veriyi arka planda tazele
  });

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          Ana Panel
        </h1>
        <p className="text-base text-text-light">
          Hoş Geldin,{" "}
          <span className="font-semibold text-text-main">
            {userInfo?.personnel?.fullName || userInfo?.email}!
          </span>
        </p>
      </div>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="error-message">{error.message}</p>
      ) : (
        stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                className="total-assignments-card"
                icon={<FaClipboardList />}
                title="Toplam Zimmet"
                value={stats.totalAssignments}
                linkTo="/assignments"
              />
              <StatCard
                className="total-items-card"
                icon={<FaBoxOpen />}
                title="Toplam Eşya"
                value={stats.totalItems}
                linkTo="/items"
              />
              <StatCard
                className="total-users-card"
                icon={<FaUsers />}
                title="Toplam Personel"
                value={stats.totalPersonnel}
                // linkTo="/admin" // IK modülü eklenene kadar yönlendirme kaldırıldı.
              />
              <StatCard
                className="total-locations-card"
                icon={<FaMapMarkerAlt />}
                title="Toplam Konum"
                value={stats.totalLocations}
                linkTo="/locations"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ItemDistributionChart data={stats.itemDistribution} />
              <MonthlyAssignmentsChart data={stats.monthlyAssignments} />
              <StatusDistributionChart data={stats.itemsByStatus} />
              <LocationAssignmentsChart data={stats.itemsByLocation} />
            </div>

            <RecentActivity assignments={stats.recentAssignments} />
          </>
        )
      )}
    </div>
  );
};

export default DashboardPage;
