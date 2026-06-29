import React from "react";

/**
 * Pagination Component - Dark theme style matching admin pages
 * @param {number} currentPage - Current active page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Items displayed per page
 */
function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  // Don't render if no items
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "16px",
        padding: "12px 16px",
        backgroundColor: "rgba(30, 41, 59, 0.5)",
        borderRadius: "12px",
        border: "1px solid rgba(100, 116, 139, 0.2)",
      }}
    >
      {/* Info text */}
      <span style={{ fontSize: "13px", color: "#94a3b8" }}>
        Hiển thị {startItem}-{endItem} trong tổng {totalItems} mục
      </span>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "8px 14px",
            backgroundColor: currentPage === 1 ? "rgba(51, 65, 85, 0.3)" : "rgba(59, 130, 246, 0.2)",
            color: currentPage === 1 ? "#64748b" : "#60a5fa",
            border: currentPage === 1 ? "1px solid rgba(100, 116, 139, 0.2)" : "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "8px",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
        >
          <i className="fa-solid fa-chevron-left" style={{ fontSize: "10px" }}></i>
          <span>Trước</span>
        </button>

        {/* Page indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "8px 16px",
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            borderRadius: "8px",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#60a5fa" }}>
            {currentPage}
          </span>
          <span style={{ fontSize: "13px", color: "#64748b" }}>/</span>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>{totalPages}</span>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "8px 14px",
            backgroundColor: currentPage === totalPages ? "rgba(51, 65, 85, 0.3)" : "rgba(59, 130, 246, 0.2)",
            color: currentPage === totalPages ? "#64748b" : "#60a5fa",
            border: currentPage === totalPages ? "1px solid rgba(100, 116, 139, 0.2)" : "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "8px",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
        >
          <span>Sau</span>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px" }}></i>
        </button>
      </div>
    </div>
  );
}

export default Pagination;
