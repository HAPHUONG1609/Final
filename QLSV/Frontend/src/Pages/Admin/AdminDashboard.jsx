import React, { useEffect, useState } from "react";
import { API_BASE } from "../../utils/auth.js";
import { confirmAction } from "../../utils/notification.js";

const emptyForm = {
  facultyId: "",
  classId: "",
  studentId: "",
  status: "Đang học",
  createdDate: "",
};

function AdminDashboard() {
  const [studentKeys, setStudentKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const openEditModal = (key) => {
    setForm({ ...key });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const parseJsonSafe = async (res, label) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
        console.error(`${label} không trả về JSON:`, text);
      throw new Error(`${label} không hợp lệ`);
    }
  };

  const getRandomFiveStudents = (students) => {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  };

  const fetchRandomStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/students`, {
        method: "GET",
        credentials: "include",
      });

      const data = await parseJsonSafe(res, "students");

      if (!res.ok) {
        throw new Error(data.message || "Không lấy được danh sách sinh viên");
      }

      const randomStudents = getRandomFiveStudents(data);

      const mappedStudents = randomStudents.map((student) => ({
        facultyId: student.facultyId || "",
        classId: student.classId || "",
        studentId: student.studentId || "",
        status: student.status || "Đang học",
        createdDate: new Date().toISOString().split("T")[0], // giữ cột Created Date
      }));

      setStudentKeys(mappedStudents);
    } catch (error) {
      console.error("fetchRandomStudents error:", error);
      alert("Tải dữ liệu thất bại. Vui lòng kiểm tra kết nối máy chủ.");
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError("");

      const res = await fetch(`${API_BASE}/admin/audit-logs?limit=10`, {
        method: "GET",
        credentials: "include",
      });
      const data = await parseJsonSafe(res, "admin audit logs");

      if (!res.ok) {
        throw new Error(data.message || "Không tải được nhật ký quản trị");
      }

      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("fetchAuditLogs error:", error);
      setLogsError(error.message || "Không tải được nhật ký quản trị");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomStudents();
    fetchAuditLogs();
  }, []);

const handleSave = async () => {
  // Kiểm tra dữ liệu bắt buộc trên form
  if (!form.facultyId || !form.classId || !form.studentId) {
    alert("Vui lòng điền đầy đủ các trường Mã khoa và Mã lớp.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/admin/student/quick-update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mssv: form.studentId,      // Khớp với @MaSV
        facultyId: form.facultyId, // Khớp với cột Khoa
        malop: form.classId,       // Khớp với cột MaLop
        tinhtrang: form.status,    // Khớp với cột TinhTrang
      }),
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok) {
      // Cập nhật giao diện (UI) ngay lập tức
      setStudentKeys((prev) =>
        prev.map((item) => (item.studentId === form.studentId ? { ...form } : item))
      );
        alert("Đã lưu thay đổi vào hệ thống!");
      await fetchAuditLogs();
      closeModal();
    } else {
      alert("Lỗi từ server: " + result.message);
    }
  } catch (error) {
    console.error("Lỗi kết nối:", error);
    alert("Không thể kết nối tới server. Vui lòng kiểm tra lại.");
  }
};

  const handleDelete = async (studentId) => {
    const ok = await confirmAction({
      title: "Xóa khóa sinh viên",
      message: `Bạn có chắc muốn xóa khóa của sinh viên "${studentId}" không?`,
      confirmText: "Xóa khóa",
      danger: true,
    });
    if (!ok) return;
    setStudentKeys((prev) => prev.filter((item) => item.studentId !== studentId));
  };

  const getLogStatusColor = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "SUCCESS": return "text-green-400";
      case "ERROR": return "text-red-400";
      case "INFO": return "text-blue-400";
      default: return "text-slate-400";
    }
  };

  const getLogStatusLabel = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "SUCCESS": return "Thành công";
      case "ERROR": return "Lỗi";
      case "INFO": return "Thông tin";
      default: return status || "Thông tin";
    }
  };

  return (
    <div className="text-slate-200 space-y-6">
      {/* Card 1: CRT Encryption Management */}
      <div className="bg-[#0f172a]/60 rounded-[16px] p-6 shadow-lg shadow-black/10 border border-white/10">
        <div className="flex items-center gap-10">
          <div className="w-52 h-40 rounded-[16px] overflow-hidden shrink-0 shadow-md">
            <img
              src="https://img.freepik.com/free-vector/smart-city-concept-illustration_114360-1673.jpg"
              alt="CRT Management"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-4">Quản lý mã hóa CRT</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xl">
              Quản lý an toàn dữ liệu sinh viên và hồ sơ học tập bằng cơ chế mã hóa Chinese Remainder Theorem. Tạo, cập nhật và theo dõi khóa một cách tin cậy.
            </p>
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-[12px] text-sm font-medium hover:bg-blue-700 transition-colors">
              Truy cập bảng điều khiển quản trị
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Manage Student Keys */}
      <div className="bg-[#0f172a]/60 rounded-[16px] p-6 shadow-lg shadow-black/10 border border-white/10">
        <h2 className="text-xl font-semibold text-blue-400 mb-6">Quản lý khóa sinh viên</h2>
        <h3 className="text-lg font-semibold text-white mb-4">Danh sách khóa sinh viên</h3>
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.6)" }}>
                <th style={thStyle}>Mã khoa</th>
                <th style={thStyle}>Mã lớp</th>
                <th style={thStyle}>MSSV</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Ngày tạo</th>
                <th style={thStyle}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {studentKeys.map((key, index) => (
                <tr
                  key={index}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={tdStyle}>{key.facultyId}</td>
                  <td style={tdStyle}>{key.classId}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "#f1f5f9" }}>{key.studentId}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background:
                          key.status === "Đang học"
                            ? "rgba(34,197,94,0.15)"
                            : key.status === "Bảo lưu"
                            ? "rgba(234,179,8,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color:
                          key.status === "Đang học"
                            ? "#4ade80"
                            : key.status === "Bảo lưu"
                            ? "#facc15"
                            : "#f87171",
                      }}
                    >
                      {key.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "#94a3b8" }}>{key.createdDate}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => openEditModal(key)}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 8,
                          background: "rgba(59,130,246,0.15)",
                          color: "#60a5fa",
                          border: "1px solid rgba(59,130,246,0.3)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Cập nhật
                      </button>
                      <button
                        onClick={() => handleDelete(key.studentId)}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 8,
                          background: "rgba(239,68,68,0.15)",
                          color: "#f87171",
                          border: "1px solid rgba(239,68,68,0.3)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 3: Admin audit logs */}
      <div className="bg-[#0f172a]/60 rounded-[16px] p-6 shadow-lg shadow-black/10 border border-white/10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Nhật ký quản trị gần đây</h3>
            <p className="text-xs text-slate-500 mt-1">Các thao tác được ghi tự động từ backend và lưu trong SQL Server.</p>
          </div>
          <button
            type="button"
            onClick={fetchAuditLogs}
            disabled={logsLoading}
            className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-50"
          >
            {logsLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {logsError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {logsError}
          </div>
        ) : !logsLoading && logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">
            Chưa có thao tác quản trị nào được ghi nhận.
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[10px_minmax(0,1fr)_auto] gap-3 items-start py-3 px-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-colors"
              >
                <span
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                    log.status === "SUCCESS"
                      ? "bg-green-400"
                      : log.status === "ERROR"
                      ? "bg-red-400"
                      : "bg-blue-400"
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-slate-200">{log.actionLabel}</span>
                    <span className="text-xs text-slate-500">bởi {log.username}</span>
                    {log.entityId && (
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-400">
                        {log.entityId}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-slate-400 break-words">{log.message}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-slate-600">
                    <span>{log.time}</span>
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                  </div>
                </div>
                <span className={`${getLogStatusColor(log.status)} whitespace-nowrap text-xs font-semibold`}>
                  {getLogStatusLabel(log.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>2025 CRT Encrypt. All right reserved.</p>
        <p>2025 CRT Encrypt. Bảo lưu mọi quyền.</p>
      </footer>

      {/* Edit Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: 480,
              maxWidth: "94%",
              background: "#111827",
              borderRadius: 18,
              padding: "28px 32px",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h3 style={{ marginBottom: 6, fontSize: 18, fontWeight: 700 }}>Chỉnh sửa khóa sinh viên</h3>
                        <h3 style={{ marginBottom: 6, fontSize: 18, fontWeight: 700 }}>Chỉnh sửa khóa sinh viên</h3>
            <p
              style={{
                fontSize: 12,
                color: "#64748b",
                marginBottom: 24,
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                paddingBottom: 16,
              }}
            >
              Update key information for student
                          Cập nhật thông tin khóa cho sinh viên
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Mã khoa</label>
                  <label style={labelStyle}>Mã khoa</label>
                  <input
                    placeholder="Mã khoa"
                    value={form.facultyId}
                    onChange={(e) => handleChange("facultyId", e.target.value)}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Mã lớp</label>
                  <label style={labelStyle}>Mã lớp</label>
                  <input
                    placeholder="Mã lớp"
                    value={form.classId}
                    onChange={(e) => handleChange("classId", e.target.value)}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Mã sinh viên</label>
                                  <label style={labelStyle}>MSSV</label>
                <input
                  value={form.studentId}
                  disabled
                  style={{ ...inputStyle, width: "100%", opacity: 0.5, cursor: "not-allowed" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Trạng thái</label>
                  <label style={labelStyle}>Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    style={{ ...inputStyle, width: "100%" }}
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Bảo lưu">Bảo lưu</option>
                    <option value="Đã nghỉ">Đã nghỉ</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ngày tạo</label>
                  <input
                    type="date"
                    value={form.createdDate}
                    onChange={(e) => handleChange("createdDate", e.target.value)}
                    style={{ ...inputStyle, width: "100%", colorScheme: "dark" }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                paddingTop: 18,
                borderTop: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "9px 20px",
                  borderRadius: 9,
                  background: "rgba(55,65,81,0.8)",
                  color: "#cbd5e1",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "9px 20px",
                  borderRadius: 9,
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px 20px",
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "13px 20px",
  color: "#cbd5e1",
  verticalAlign: "middle",
};

const labelStyle = {
  fontSize: 12,
  color: "#94a3b8",
  marginBottom: 6,
  display: "block",
  fontWeight: 500,
};

const inputStyle = {
  padding: "10px 14px",
  borderRadius: 9,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#0f172a",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontSize: 13,
};

export default AdminDashboard;
