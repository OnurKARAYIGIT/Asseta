import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div>
      <Navbar />
      <main className="main-content">
        <Outlet /> {/* Sayfa içeriği burada görünecek */}
      </main>
    </div>
  );
};

export default Layout;
