import React from "react";
import { Link } from "react-router-dom";
import { FaClipboardList, FaBoxOpen, FaUser } from "react-icons/fa";

const SearchResultItem = ({ item, type }) => {
  if (type === "assignment") {
    return (
      <Link to={`/assignments?openModal=${item._id}`} className="result-item">
        <FaClipboardList className="result-icon" />
        <div className="result-details">
          <span className="result-title">
            {item.personnelName} - {item.item.name}
          </span>
          <span className="result-subtitle">Zimmet Kaydı</span>
        </div>
      </Link>
    );
  }
  if (type === "item") {
    return (
      <Link to={`/items?keyword=${item.assetTag}`} className="result-item">
        <FaBoxOpen className="result-icon" />
        <div className="result-details">
          <span className="result-title">
            {item.name} ({item.assetTag})
          </span>
          <span className="result-subtitle">Eşya</span>
        </div>
      </Link>
    );
  }
  if (type === "user") {
    return (
      <Link
        to={`/personnel-report?keyword=${item.username}`}
        className="result-item"
      >
        <FaUser className="result-icon" />
        <div className="result-details">
          <span className="result-title">{item.username}</span>
          <span className="result-subtitle">Kullanıcı</span>
        </div>
      </Link>
    );
  }
  return null;
};

export default SearchResultItem;
