import React from "react";

const ChartCard = ({ title, children }) => {
  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <div className="chart-wrapper">{children}</div>
    </div>
  );
};

export default ChartCard;
