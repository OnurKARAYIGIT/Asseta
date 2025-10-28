import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

const StatCard = ({ icon, title, value, linkTo, className }) => (
  <Link to={linkTo} className={`dashboard-card ${className || ""}`}>
    <div className="card-icon">{icon}</div>
    <div className="card-content">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
    <FaChevronRight className="card-arrow" />
  </Link>
);

export default StatCard;
