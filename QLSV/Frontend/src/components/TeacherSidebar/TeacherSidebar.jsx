import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Avt from "../../assets/icon/user.png";
import { logoutSession } from "../../utils/auth.js";

function TeacherSidebar() {
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await logoutSession();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      alert("Không thể đăng xuất. Vui lòng kiểm tra backend và thử lại.");
    }
  };

  const linkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    margin: "0 8px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s",
    color: "#ffffff",
    textDecoration: "none",
    backgroundColor: isActive ? "#2563eb" : "transparent",
    boxShadow: isActive ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none",
  });

  const iconStyle = {
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: "#ffffff",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0f172a" }}>
      <aside
        style={{
          width: "200px",
          minWidth: "200px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#0f172a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(59, 130, 246, 0.2)",
            }}
          >
            <i className="fa-solid fa-check" style={{ fontSize: "12px", color: "#60a5fa" }}></i>
          </div>
          <span style={{ fontWeight: "600", fontSize: "14px", color: "#f97316" }}>CRT Encrypt</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, marginTop: "8px" }}>
          <NavLink to="/teacher/grades" style={linkStyle}>
            <i className="fa-solid fa-graduation-cap" style={iconStyle}></i>
            <span style={{ color: "#ffffff" }}>Nhập điểm</span>
          </NavLink>

          <NavLink to="/teacher/encryption-key" style={linkStyle}>
            <i className="fa-solid fa-key" style={iconStyle}></i>
            <span style={{ color: "#ffffff" }}>Sửa mã PIN</span>
          </NavLink>
        </nav>

      </aside>

      <div
        style={{
          flex: 1,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1e293b",
          minWidth: 0,
        }}
      >
        <header
          style={{
            height: "56px",
            flexShrink: 0,
            backgroundColor: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={onLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
              }}
            >
              Đăng xuất <i className="fa-solid fa-power-off" style={{ fontSize: "12px", color: "#ffffff" }}></i>
            </button>

            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #475569",
              }}
            >
              <img
                src={Avt}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", backgroundColor: "#334155" }}
              />
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default TeacherSidebar;
