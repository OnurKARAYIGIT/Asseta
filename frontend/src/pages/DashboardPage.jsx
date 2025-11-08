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
  FaHourglassHalf,
  FaBriefcase,
  FaUserClock,
  FaBusinessTime,
  FaUserFriends,
  FaHandshake,
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
import { FaMoneyCheckAlt } from "react-icons/fa";

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                className="total-assignments-card"
                icon={<FaClipboardList className="text-primary" />}
                title="Toplam Zimmet"
                value={stats.totalAssignments}
                linkTo="/assignments"
              />
              <StatCard
                className="total-items-card"
                icon={<FaBoxOpen className="text-secondary" />}
                title="Toplam Eşya"
                value={stats.totalItems}
                linkTo="/items"
              />
              <StatCard
                className="total-users-card"
                icon={<FaUsers className="text-indigo-500" />}
                title="Toplam Personel"
                value={stats.totalPersonnel} // Değişiklik yok, sadece bağlam için burada
                linkTo="/personnel"
              />
              <StatCard
                className="total-locations-card"
                icon={<FaMapMarkerAlt className="text-purple-500" />}
                title="Toplam Konum"
                value={stats.totalLocations}
                linkTo="/locations"
              />
            </div>

            {/* --- YENİ İK İSTATİSTİK KARTLARI --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                className="pending-leaves-card"
                icon={<FaHourglassHalf className="text-warning" />}
                title="Bekleyen İzin Talebi"
                value={stats.pendingLeaveCount}
                linkTo="/leave-management"
              />
              <StatCard
                className="active-employees-card"
                icon={<FaUserClock className="text-success" />}
                title="Bugün Aktif Çalışan"
                value={stats.activeEmployeesToday}
                linkTo="/attendance-records"
              />
              <StatCard
                className="overtime-card"
                icon={<FaBusinessTime className="text-info" />}
                title="Bu Ayki Fazla Mesai"
                value={`${(stats.totalOvertimeThisMonth / 60).toFixed(1)} sa`}
                linkTo="/attendance-records"
              />
              <StatCard
                className="payroll-card"
                icon={<FaMoneyCheckAlt className="text-primary" />}
                title="Son Maaş Ödemesi"
                value={stats.lastPayrollTotal.toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
                linkTo="/payroll-periods"
              />
            </div>

            {/* --- YENİ İŞE ALIM İSTATİSTİK KARTLARI --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                className="open-jobs-card"
                icon={<FaBriefcase className="text-blue-500" />}
                title="Açık İş İlanı"
                value={stats.openJobOpeningsCount}
                linkTo="/job-openings?status=Açık"
              />
              <StatCard
                className="candidates-pool-card"
                icon={<FaUserFriends className="text-teal-500" />}
                title="Aday Havuzu"
                value={stats.totalCandidatesCount}
                linkTo="/candidates"
              />
              <StatCard
                className="offers-pending-card"
                icon={<FaHandshake className="text-cyan-500" />}
                title="Teklif Aşamasında"
                value={stats.offersPendingCount}
                linkTo={
                  stats.firstOfferJobId
                    ? `/recruitment?status=Teklif&jobId=${stats.firstOfferJobId}`
                    : "/recruitment?status=Teklif"
                }
              />
              {/* Gelecekteki bir metrik için boş bir kart bırakılabilir */}
              <StatCard
                className="placeholder-card"
                title="Yeni Metrik"
                value="-"
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
