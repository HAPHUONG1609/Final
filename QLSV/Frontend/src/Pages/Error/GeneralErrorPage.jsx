import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import "./ErrorPages.css";

/**
 * General Error Page
 * Displayed for server errors, CRT decryption errors, etc.
 * Can receive error details via location state
 */
function GeneralErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get error details from navigation state (if available)
  const errorDetails = location.state?.error || null;
  const errorMessage = location.state?.message || "An internal error has occurred. Your request can't be processed at this time";

  const navLinks = [
    { label: "Thông tin chung", to: "/student" },
    { label: "Học tập", to: "/Academic" },
    { label: "Đăng kí học phần", to: "#" },
    { label: "Home", to: "/" },
  ];

  return (
    <div className="error-page error-page--general">
      <PageHeader navLinks={navLinks} showLogout={true} showAvatar={true} />

      <main className="error-page__content">
        <div className="error-page__icon">
          <i className="fa-solid fa-circle-exclamation"></i>
        </div>

        <h1 className="error-page__heading">Oops! Something went wrong</h1>

        <p className="error-page__description">
          {errorMessage}
        </p>

        {errorDetails && (
          <div className="error-page__details">
            <code>{errorDetails}</code>
          </div>
        )}

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

export default GeneralErrorPage;
