import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Doughnut, getElementAtEvent } from "react-chartjs-2";
import ChartCard from "./ChartCard";

const StatusDistributionChart = ({ data }) => {
  const navigate = useNavigate();
  const chartRef = useRef();

  const chartData = {
    labels: data.map((item) => item._id),
    datasets: [
      {
        label: "Zimmet Sayısı",
        data: data.map((item) => item.count),
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "right" } },
  };

  const handleClick = (event) => {
    const element = getElementAtEvent(chartRef.current, event);
    if (!element.length) return;

    const { index } = element[0];
    const statusTR = data[index]._id;

    const statusMap = {
      Zimmetli: "assigned",
      Boşta: "unassigned",
      Arızalı: "arizali",
      Beklemede: "beklemede",
      Hurda: "hurda",
    };
    const filterKey = statusMap[statusTR];

    if (filterKey) {
      navigate(`/items?status=${filterKey}`);
    }
  };

  return (
    <ChartCard title="Zimmet Durum Dağılımı">
      <Doughnut
        ref={chartRef}
        data={chartData}
        options={chartOptions}
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default StatusDistributionChart;
