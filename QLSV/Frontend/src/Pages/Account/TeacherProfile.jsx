import React, { useEffect, useState } from "react";
import { API_BASE } from "../../utils/auth.js";
import "./Account.css";
import "./TeacherProfile.css";

function TeacherProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_BASE}/api/profile/me`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải thông tin giảng viên");
        }

        if (active) setProfile(data);
      } catch (err) {
        if (active) setError(err.message || "Không thể tải thông tin giảng viên");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const details = [
    { icon: "fa-solid fa-id-badge", label: "Mã giảng viên", value: profile?.id },
    { icon: "fa-solid fa-user", label: "Họ và tên", value: profile?.fullName },
    { icon: "fa-solid fa-envelope", label: "Email", value: profile?.email },
    { icon: "fa-solid fa-building-columns", label: "Mã khoa", value: profile?.facultyId },
    { icon: "fa-solid fa-school", label: "Khoa", value: profile?.facultyName },
    { icon: "fa-solid fa-user-shield", label: "Vai trò", value: "Giảng viên" },
  ];

  return (
    <div className="account-page account-page--dark">
      <section className="account-card teacher-profile">
        <div className="account-card__heading">
          <span className="account-card__icon" aria-hidden="true">
            <i className="fa-solid fa-user-tie" />
          </span>
          <div>
            <p className="account-card__eyebrow">Hồ sơ giảng viên</p>
            <h1>Thông tin cá nhân</h1>
            <p className="account-card__description">
              Thông tin được đồng bộ từ hồ sơ giảng viên đang đăng nhập.
            </p>
          </div>
        </div>

        {error && (
          <div className="account-message account-message--error" role="alert">
            <i className="fa-solid fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        <div className="teacher-profile__grid" aria-busy={loading}>
          {details.map((detail) => (
            <div className="teacher-profile__item" key={detail.label}>
              <span className="teacher-profile__item-icon" aria-hidden="true">
                <i className={detail.icon} />
              </span>
              <div>
                <span className="teacher-profile__label">{detail.label}</span>
                <strong className={loading ? "teacher-profile__loading" : ""}>
                  {loading ? "Đang tải..." : detail.value || "Chưa cập nhật"}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TeacherProfile;
