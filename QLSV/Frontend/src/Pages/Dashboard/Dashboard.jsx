import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import Class from "../../assets/icon/class.png";
import Key from "../../assets/icon/key.png";
import Id from "../../assets/icon/id.png";
import User from "../../assets/icon/user.png";
import Scur from "../../assets/icon/scurity.png";
import { API_BASE } from "../../utils/auth.js";

function Dashboard() {
  const [keyStatus, setKeyStatus] = useState("Chưa xác minh");
  const [student, setStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  // Thêm state lưu lịch sử đăng nhập
  const [loginHistory, setLoginHistory] = useState([]);

  // Gọi API lấy thông tin sinh viên
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`${API_BASE}/student`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error(res.statusText);

        const data = await res.json();
        const studentData = Array.isArray(data) ? data[0] : data;

        if (studentData) {
          setStudent(studentData);
        }
      } catch (e) {
        console.error(e);
        setErr(e.message || "Không tải được hồ sơ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Lấy 5 lần đăng nhập gần nhất để hiển thị ở Dashboard
  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/login-history?t=${Date.now()}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok) {
          const history = Array.isArray(data) ? data : (data.data || data.history || []);
          setLoginHistory(history.slice(0, 5));
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử đăng nhập:", error);
      }
    };

    fetchLoginHistory();
  }, []);

  const formatVietnamTime = (value, textValue) => {
    if (textValue) return textValue;
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const onVerifyClick = async () => {
    alert("Thao tác xác minh tại đây!");
  };

  return (
    <div className="dash">
      <section className="dash__greet">
        <h1 className="dash__title dash__student-name">
          {loading ? "…" : student.HoTen || "—"} <span className="wave"></span>
        </h1>

        <p className="dash__subtitle">
          Chào mừng bạn đến với cổng sinh viên. Tại đây bạn có thể quản lý tiến độ học tập,
          thông tin cá nhân và khóa mã hóa.
        </p>

        {!!err && (
          <div style={{ marginTop: 8, color: "var(--warn, #c00)" }}>
            Lỗi: {err}
          </div>
        )}
      </section>

      {/* CHỈ GIỮ 4 Ô ĐÚNG THEO TASK */}
      <section className="dash__grid4">
        <div className="card info">
          <img src={User} alt="" className="info_icon" />
          <div className="info__title">Ngành đào tạo</div>
          <div className="info__value info__faculty-value">{loading ? "…" : student.NganhDT || "—"}</div>
        </div>

        <div className="card info">
          <img src={Class} alt="" className="info_icon" />
          <div className="info__title">Lớp</div>
          <div className="info__value">{loading ? "…" : student.MaLop || "—"}</div>
        </div>

        <div className="card info">
          <img src={Id} alt="" className="info_icon" />
          <div className="info__title">MSSV</div>
          <div className="info__value id">{loading ? "…" : student.MaSV || "—"}</div>
        </div>

        <div className="card info">
          <img src={Key} alt="" className="info_icon" />
          <div className="info__title">Trạng thái khóa</div>
          <div className={`status ${keyStatus === "Đã xác minh" ? "ok" : "warn"}`}>
            {loading ? "…" : keyStatus}
          </div>
          <button
            className="btn btn--verify"
            onClick={onVerifyClick}
            disabled={loading}
          >
            Xác minh
          </button>
        </div>
      </section>

      <section className="card dash__security">
        <div className="sec__text">
          <img src={Scur} alt="" className="shield" />
          <div className="sec__title">Tóm tắt bảo mật</div>
        </div>

        <div className="sec__desc">
          Dữ liệu của bạn được bảo vệ bằng cơ chế mã hóa nâng cao. Hãy xác minh
          khóa mã hóa thường xuyên để tăng cường bảo mật.
        </div>
      </section>

      <section className="dash__grid2">
        <div className="card list">
          <div className="list__title">Hoạt động gần đây</div>
          <ul className="list__items">
            <li>
              <span>Đã truy cập khóa mã hóa</span>
              <time>2 giờ trước</time>
            </li>
            <li>
              <span>Đã cập nhật thông tin cá nhân</span>
              <time>Hôm qua</time>
            </li>
            <li>
              <span>Đã nộp bài ‘Cơ bản về mật mã học’</span>
              <time>3 ngày trước</time>
            </li>
            <li>
              <span>Đã nhận thông báo mới</span>
              <time>1 tuần trước</time>
            </li>
          </ul>
        </div>

        {/* Lịch sử đăng nhập: chỉ hiển thị ngày giờ đăng nhập */}
        <div className="card list" style={{ minHeight: "250px" }}>
          <div className="list__title">Lịch sử đăng nhập (5 lần gần nhất)</div>

          {loginHistory.length > 0 ? (
            <ul
              className="last__items"
              style={{
                maxHeight: "250px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                paddingRight: "5px",
              }}
            >
              {loginHistory.map((log, index) => (
                <li
                  key={index}
                  style={{
                    borderBottom: "1px dashed #ddd",
                    paddingBottom: "10px",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span className="dot dot--time" />
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: index === 0 ? "700" : "500",
                      color: index === 0 ? "#2563eb" : "#374151",
                    }}
                  >
                    {formatVietnamTime(log.THOI_GIAN, log.THOI_GIAN_TEXT)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: "10px 0", color: "#888", fontSize: "14px" }}>
              Chưa có dữ liệu đăng nhập.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
