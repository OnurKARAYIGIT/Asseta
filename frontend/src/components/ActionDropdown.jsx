import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisH } from "react-icons/fa";

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
    <div className="relative flex" ref={dropdownRef}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {toggleComponent || (
          <button className="p-2 rounded-full flex items-center justify-center text-inherit hover:bg-light-gray">
            <FaEllipsisH />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+5px)] bg-card-background border border-border rounded-lg z-[100] min-w-[180px] py-2">
          {actions.map((action, index) => {
            const iconColorClass =
              {
                edit: "text-primary",
                permissions: "text-secondary",
                password: "text-text-light",
                delete: "text-danger",
                "theme-toggle": "text-[#f39c12]",
                secondary: "text-text-light",
              }[action.className] || "";

            return (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                className={`flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none text-left cursor-pointer text-text-main text-[0.9rem] leading-normal hover:bg-background disabled:text-text-light disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                  action.className || ""
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-5 text-base ${iconColorClass}`}
                >
                  {action.icon}
                </span>
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionDropdown;
