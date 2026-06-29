import React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import "./ErrorPages.css";

/**
 * 404 Not Found Page
 * Displayed when user accesses a route that doesn't exist
 */
function NotFoundPage() {
  const navigate = useNavigate();

  const navLinks = [
    { label: "Thông tin chung", to: "/student" },
    { label: "Học tập", to: "/Academic" },
    { label: "Đăng kí học phần", to: "#" },
    { label: "Home", to: "/" },
  ];

  return (
    <div className="error-page">
      <PageHeader navLinks={navLinks} showLogout={true} showAvatar={true} />

      <main className="error-page__content">
        <h1 className="error-page__title">
          <span className="error-page__code">404</span>
          <span className="error-page__divider">|</span>
          <span className="error-page__text">Page Not Found</span>
        </h1>

        <button
          className="error-page__btn"
          onClick={() => navigate("/")}
        >
          Go to Home Page
        </button>
      </main>
    </div>
  );
}

export default NotFoundPage;
