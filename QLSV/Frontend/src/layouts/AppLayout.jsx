import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar"; 

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
