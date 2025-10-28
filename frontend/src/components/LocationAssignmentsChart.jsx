import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, getElementAtEvent } from "react-chartjs-2";
import ChartCard from "./ChartCard";

const LocationAssignmentsChart = ({ data }) => {
  const navigate = useNavigate();
  const chartRef = useRef();

  const chartData = {
    labels: data.map((item) => item._id.name),
    datasets: [
      {
        label: "Zimmetlenen Eşya Sayısı",
        data: data.map((item) => item.count),
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

  const handleClick = (event) => {
    const element = getElementAtEvent(chartRef.current, event);
    if (!element.length) return;

    const { index } = element[0];
    const locationId = data[index]._id.id;
    navigate(`/assignments?location=${locationId}`);
  };

  return (
    <ChartCard title="Konumlara Göre Zimmet Sayısı">
      <Bar
        ref={chartRef}
        data={chartData}
        options={chartOptions}
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default LocationAssignmentsChart;
