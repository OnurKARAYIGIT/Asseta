import React from "react";

const Header = ({ title, icon, children }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      <div className="flex items-center gap-4">
        {icon && <div className="text-secondary">{icon}</div>}
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          {title}
        </h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

export default Header;
