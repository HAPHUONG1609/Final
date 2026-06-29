import React from "react";
import { NavLink, Outlet } from "react-router-dom";

function StudentSidebar() {
  const linkStyle = ({ isActive }) => ({
    display: "block",
    marginBottom: "12px",
    color: "white",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "8px",
    background: isActive ? "#2563eb" : "transparent",
    fontWeight: 500,
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div
        style={{
          width: "220px",
          background: "#0b1a33",
          padding: "20px",
        }}
      >
        <h3 style={{ color: "white", marginBottom: "20px" }}>CRT Encrypt</h3>

        <nav>
          <NavLink to="dashboard" style={linkStyle}>
            Dashboard
          </NavLink>

          <NavLink to="academic" style={linkStyle}>
            Academic
          </NavLink>

          <NavLink to="personal-info" style={linkStyle}>
            Personal Info
          </NavLink>

          <NavLink to="encryption-key" style={linkStyle}>
            My encryption key
          </NavLink>
        </nav>
      </div>

      <div style={{ flex: 1, padding: "30px" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default StudentSidebar;