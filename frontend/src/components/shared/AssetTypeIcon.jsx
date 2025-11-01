import React from "react";
import {
  FaLaptop,
  FaDesktop,
  FaMobileAlt,
  FaPrint,
  FaHdd,
  FaQuestionCircle,
} from "react-icons/fa";

const AssetTypeIcon = ({ type, className = "" }) => {
  const getIcon = () => {
    switch (type) {
      case "Laptop":
        return <FaLaptop className={`text-blue-500 ${className}`} />;
      case "Monitör":
        return <FaDesktop className={`text-green-500 ${className}`} />;
      case "Telefon":
        return <FaMobileAlt className={`text-purple-500 ${className}`} />;
      case "Yazıcı":
        return <FaPrint className={`text-red-500 ${className}`} />;
      case "Network Cihazı":
        return <FaHdd className={`text-yellow-500 ${className}`} />;
      default:
        return <FaQuestionCircle className={`text-gray-400 ${className}`} />;
    }
  };

  return <span title={type}>{getIcon()}</span>;
};

export default AssetTypeIcon;
