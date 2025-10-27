import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisH } from "react-icons/fa"; // Yatay üç nokta daha modern durur
import "./ActionDropdown.css";

const ActionDropdown = ({ actions, toggleComponent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Dışarı tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleActionClick = (action) => {
    if (action.disabled) return;
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className="action-dropdown" ref={dropdownRef}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {toggleComponent || (
          <button className="dropdown-toggle">
            <FaEllipsisH />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className={`dropdown-item ${action.className || ""}`}
            >
              <span className="icon">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionDropdown;
