import React from "react";

const Loader = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-12 h-12 border-4 border-light-gray border-t-primary rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader;
