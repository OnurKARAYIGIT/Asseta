import React from "react";
import SearchResultItem from "./SearchResultItem";

const SearchResultCategory = ({ title, items, type }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="result-category">
      <h2>{title}</h2>
      {items.map((item) => (
        <SearchResultItem key={item._id} item={item} type={type} />
      ))}
    </div>
  );
};

export default SearchResultCategory;
