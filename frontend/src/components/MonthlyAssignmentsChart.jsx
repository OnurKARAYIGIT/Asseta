import React from "react";
import { Bar } from "react-chartjs-2";
import ChartCard from "./ChartCard";

const MonthlyAssignmentsChart = ({ data }) => {
  const chartData = {
    labels: data.map((item) => `${item._id.year}-${item._id.month}`),
    datasets: [
      {
        label: "Aylık Zimmet Sayısı",
        data: data.map((item) => item.count),
        backgroundColor: "rgba(23, 162, 184, 0.5)",
        borderColor: "rgba(23, 162, 184, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
  };

  return (
    <ChartCard title="Aylara Göre Zimmet Sayısı">
      <Bar data={chartData} options={chartOptions} />
    </ChartCard>
  );
};

export default MonthlyAssignmentsChart;
