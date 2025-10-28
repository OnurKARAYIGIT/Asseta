import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Doughnut, getElementAtEvent } from "react-chartjs-2";
import ChartCard from "./ChartCard";

const ItemDistributionChart = ({ data }) => {
  const navigate = useNavigate();
  const chartRef = useRef();

  const chartData = {
    labels: data.map((item) => item._id),
    datasets: [
      {
        label: "Eşya Sayısı",
        data: data.map((item) => item.count),
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "right" } },
  };

  const handleClick = (event) => {
    const element = getElementAtEvent(chartRef.current, event);
    if (!element.length) return;

    const { index } = element[0];
    const itemType = data[index]._id;
    navigate(`/items?assetType=${encodeURIComponent(itemType)}`);
  };

  return (
    <ChartCard title="Varlık Türüne Göre Eşya Dağılımı">
      <Doughnut
        ref={chartRef}
        data={chartData}
        options={chartOptions}
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default ItemDistributionChart;
