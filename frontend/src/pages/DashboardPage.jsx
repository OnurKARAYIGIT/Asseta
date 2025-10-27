import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import {
  FaBoxOpen,
  FaClipboardList,
  FaUsers,
  FaMapMarkerAlt,
  FaChevronRight,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
} from "chart.js";
import { Bar, Doughnut, getElementAtEvent } from "react-chartjs-2";
import "./DashboardPage.css";

const StatCard = ({ icon, title, value, linkTo, className }) => (
  <Link to={linkTo} className={`dashboard-card ${className || ""}`}>
    <div className="card-icon">{icon}</div>
    <div className="card-content">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  </Link>
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement
);

const DashboardPage = () => {
  const { userInfo } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const itemDistChartRef = useRef();
  const statusChartRef = useRef();
  const locationChartRef = useRef();

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

  const itemDistributionData = {
    labels: stats?.itemDistribution.map((item) => item._id) || [],
    datasets: [
      {
        label: "Eşya Sayısı",
        data: stats?.itemDistribution.map((item) => item.count) || [],
        backgroundColor: [
          "rgba(23, 162, 184, 0.6)",
          "rgba(253, 126, 20, 0.6)",
          "rgba(111, 66, 193, 0.6)",
          "rgba(40, 167, 69, 0.6)",
          "rgba(232, 62, 140, 0.6)",
        ],
        borderColor: [
          "rgba(23, 162, 184, 1)",
          "rgba(253, 126, 20, 1)",
          "rgba(111, 66, 193, 1)",
          "rgba(40, 167, 69, 1)",
          "rgba(232, 62, 140, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const monthlyAssignmentsData = {
    labels:
      stats?.monthlyAssignments.map(
        (item) => `${item._id.year}-${item._id.month}`
      ) || [],
    datasets: [
      {
        label: "Aylık Zimmet Sayısı",
        data: stats?.monthlyAssignments.map((item) => item.count) || [],
        backgroundColor: "rgba(23, 162, 184, 0.5)",
        borderColor: "rgba(23, 162, 184, 1)",
        borderWidth: 2,
      },
    ],
  };

  const assignmentsByStatusData = {
    labels: stats?.itemsByStatus.map((item) => item._id) || [],
    datasets: [
      {
        label: "Zimmet Sayısı",
        data: stats?.itemsByStatus.map((item) => item.count) || [],
        backgroundColor: [
          "rgba(40, 167, 69, 0.6)", // Zimmetli (Yeşil)
          "rgba(253, 126, 20, 0.6)", // Arızalı
          "rgba(108, 117, 125, 0.6)", // İade Edildi
          "rgba(0, 123, 255, 0.6)", // Beklemede
          "rgba(220, 53, 69, 0.6)", // Hurda
        ],
        borderColor: [
          "rgba(40, 167, 69, 1)",
          "rgba(253, 126, 20, 1)",
          "rgba(108, 117, 125, 1)",
          "rgba(0, 123, 255, 1)",
          "rgba(220, 53, 69, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const itemsByLocationData = {
    labels: stats?.itemsByLocation.map((item) => item._id.name) || [],
    datasets: [
      {
        label: "Zimmetlenen Eşya Sayısı",
        data: stats?.itemsByLocation.map((item) => item.count) || [],
        backgroundColor: "rgba(111, 66, 193, 0.5)",
        borderColor: "rgba(111, 66, 193, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
  };

  const pieChartOptions = {
    ...chartOptions,
    plugins: { legend: { position: "right" } },
  };

  const handleChartClick = (event, chartRef, data, onDataClick) => {
    const element = getElementAtEvent(chartRef.current, event);
    if (!element.length) return;

    const { index } = element[0];
    const clickedData = data[index];
    onDataClick(clickedData);
  };

  // "Zimmet Durum Dağılımı" grafiğine tıklandığında çalışır.
  const onStatusClick = (clickedData) => {
    const statusTR = clickedData._id; // Örn: "Zimmetli", "Boşta", "Arızalı"

    // Türkçe durum adlarını, Eşyalar sayfasının kullandığı filtre anahtarlarına çeviriyoruz.
    const statusMap = {
      Zimmetli: "assigned",
      Boşta: "unassigned",
      Arızalı: "arizali",
      Beklemede: "beklemede",
      Hurda: "hurda",
    };
    const filterKey = statusMap[statusTR];

    if (filterKey) {
      // Kullanıcıyı Eşyalar sayfasına, doğru filtre parametresiyle yönlendir
      navigate(`/items?status=${filterKey}`);
    }
  };

  // "Konumlara Göre Zimmet Sayısı" grafiğine tıklandığında çalışır.
  const onLocationClick = (clickedData) => {
    const locationId = clickedData._id.id;
    navigate(`/assignments?location=${locationId}`);
  };

  // "Varlık Türüne Göre Eşya Dağılımı" grafiğine tıklandığında çalışır.
  const onItemTypeClick = (clickedData) => {
    const itemType = clickedData._id;
    // Kullanıcıyı Eşyalar sayfasına, varlık cinsi filtresi uygulanmış şekilde yönlendir
    navigate(`/items?assetType=${encodeURIComponent(itemType)}`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Ana Panel</h1>
        <p>Hoş Geldin, {userInfo?.username}!</p>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        stats && (
          <>
            <div className="dashboard-grid">
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
                value={stats.totalUsers}
                linkTo="/admin"
              />
              <StatCard
                className="total-locations-card"
                icon={<FaMapMarkerAlt />}
                title="Toplam Konum"
                value={stats.totalLocations}
                linkTo="/locations"
              />
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>Varlık Türüne Göre Eşya Dağılımı</h3>
                <div className="chart-wrapper">
                  <Doughnut
                    ref={itemDistChartRef}
                    onClick={(event) =>
                      handleChartClick(
                        event,
                        itemDistChartRef,
                        stats.itemDistribution,
                        onItemTypeClick
                      )
                    }
                    data={itemDistributionData}
                    options={pieChartOptions}
                  />
                </div>
              </div>
              <div className="chart-container">
                <h3>Aylara Göre Zimmet Sayısı</h3>
                <div className="chart-wrapper">
                  <Bar data={monthlyAssignmentsData} options={chartOptions} />
                </div>
              </div>
              <div className="chart-container">
                <h3>Zimmet Durum Dağılımı</h3>
                <div className="chart-wrapper">
                  <Doughnut
                    ref={statusChartRef}
                    onClick={(event) =>
                      handleChartClick(
                        event,
                        statusChartRef,
                        stats.itemsByStatus,
                        onStatusClick
                      )
                    }
                    data={assignmentsByStatusData}
                    options={pieChartOptions}
                  />
                </div>
              </div>
              <div className="chart-container">
                <h3>Konumlara Göre Zimmet Sayısı</h3>
                <div className="chart-wrapper">
                  <Bar
                    ref={locationChartRef}
                    onClick={(event) =>
                      handleChartClick(
                        event,
                        locationChartRef,
                        stats.itemsByLocation,
                        onLocationClick
                      )
                    }
                    data={itemsByLocationData}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Son Hareketler</h2>
              {stats.recentAssignments && stats.recentAssignments.length > 0 ? (
                <ul className="recent-activity-list">
                  {stats.recentAssignments.map((assignment) => (
                    <li key={assignment._id}>
                      <Link to={`/assignment/${assignment._id}/edit`}>
                        <div className="activity-item">
                          <div className="activity-details">
                            <span className="activity-item-name">
                              {assignment.item?.name || "Silinmiş Eşya"}
                            </span>
                            <span className="activity-personnel">
                              {assignment.personnelName} personeline
                              zimmetlendi.
                            </span>
                          </div>
                          <div className="activity-date">
                            {new Date(
                              assignment.createdAt
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <FaChevronRight className="activity-arrow" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Henüz bir zimmet hareketi bulunmuyor.</p>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
};

export default DashboardPage;
