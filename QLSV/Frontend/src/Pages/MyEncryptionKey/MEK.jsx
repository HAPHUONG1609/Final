import React, { useEffect, useState } from "react";
import "./MEK.css";
import { API_BASE } from "../../utils/auth.js";

const PIN_CHANGE_PROGRESS_MESSAGE = "Đang thực hiện đổi mã PIN, vui lòng chờ...";
const PIN_CHANGE_SUCCESS_MESSAGE = "Đổi PIN thành công";

function EncryptionKey() {
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");

  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: ""
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoProof, setDemoProof] = useState(null);

  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const formatDateTime = (value, textValue) => {
    if (textValue) return textValue;
    if (!value) return "Không có";
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

  const fetchPinChangeHistory = async () => {
    try {
      setLogsLoading(true);
      setLogsError("");

      const res = await fetch(`${API_BASE}/api/pin-change-history`, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không tải được lịch sử đổi PIN");
      }

      const history = Array.isArray(data) ? data : (data.data || data.history || []);
      setLogs(history.slice(0, 5));
    } catch (error) {
      console.error("Lỗi lấy lịch sử đổi PIN:", error);
      setLogsError(error.message || "Không tải được lịch sử đổi PIN");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchPinChangeHistory();
  }, []);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollPinChangeJob = async (jobId) => {
    for (let attempt = 0; attempt < 240; attempt += 1) {
      await wait(2000);

      const res = await fetch(`${API_BASE}/api/pin-change-jobs/${jobId}`, {
        method: "GET",
        credentials: "include"
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không tải được trạng thái đổi PIN");
      }

      if (data.status === "completed") return data;
      if (data.status === "failed") {
        throw new Error(data.message || data.error || "Đổi PIN thất bại");
      }

      setMsg(PIN_CHANGE_PROGRESS_MESSAGE);
    }

    throw new Error("Đổi PIN vẫn đang xử lý. Vui lòng tải lại trang để kiểm tra sau.");
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setDemoProof(null);

    if (!form.current || !form.next || !form.confirm) {
      return setMsg("Vui lòng nhập đầy đủ thông tin.");
    }

    if (form.next.length < 4) {
      return setMsg("PIN mới phải có ít nhất 4 chữ số.");
    }

    if (form.next !== form.confirm) {
      return setMsg("PIN mới và xác nhận PIN không khớp.");
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/api/set-pin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            currentPin: form.current,
            newPin: form.next
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Cập nhật PIN thất bại");
        setLoading(false);
        return;
      }

      if (data.async && data.jobId) {
        setMsg(PIN_CHANGE_PROGRESS_MESSAGE);
        const completedJob = await pollPinChangeJob(data.jobId);
        setDemoProof(completedJob.demoProof || null);
        setMsg(PIN_CHANGE_SUCCESS_MESSAGE);
      } else {
        setDemoProof(data.demoProof || null);
        setMsg(PIN_CHANGE_SUCCESS_MESSAGE);
      }

      setForm({
        current: "",
        next: "",
        confirm: ""
      });

      await fetchPinChangeHistory();
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMsg(error.message || "Lỗi server khi đổi PIN");
      setLoading(false);
    }
  };

  return (
    <div className="ek">
      <div className="ek__grid">
        {/* Logs */}
        <section className="card ek__logs">
          <div className="ek__sectionHead">
            <div>
              <div className="ek__title">Nhật ký đổi PIN gần đây</div>
            </div>
            <span className="ek__count">{logs.length} bản ghi</span>
          </div>

          <div className="ek__logsTable">
            <div className="ek__logsHead">
              <div>Ngày</div>
              <div>Hành động</div>
            </div>

            <div className="ek__logsBody">
              {logsLoading ? (
                <div className="ek__logsRow">
                  <div>Đang tải...</div>
                  <div></div>
                </div>
              ) : logsError ? (
                <div className="ek__logsRow">
                  <div>{logsError}</div>
                  <div></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="ek__logsRow">
                  <div>Chưa có lịch sử đổi PIN</div>
                  <div></div>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div className="ek__logsRow" key={i}>
                    <div className="mono">
                      {formatDateTime(log.THOI_GIAN, log.THOI_GIAN_TEXT)}
                    </div>
                    <div>{log.HANH_DONG || "Đổi PIN"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Change PIN */}
        <section className="card ek__change">
          <div className="ek__sectionHead">
            <div>
              <div className="ek__title">Đổi PIN của bạn</div>
            </div>
          </div>

          <form className="ek__form" onSubmit={submit}>
            <label className="ek__field">
              <span>PIN hiện tại</span>
              <input
                type="password"
                name="current"
                value={form.current}
                onChange={onChange}
                placeholder="PIN hiện tại"
              />
            </label>

            <label className="ek__field">
              <span>PIN mới</span>
              <input
                type="password"
                name="next"
                value={form.next}
                onChange={onChange}
                placeholder="PIN mới"
              />
            </label>

            <label className="ek__field">
              <span>Xác nhận PIN mới</span>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                placeholder="Xác nhận PIN mới"
              />
            </label>

            {msg && (
              <div className="ek__msg">
                {msg}
              </div>
            )}

            {demoProof && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  background: "#f0f9ff",
                  border: "1px solid #38bdf8",
                  color: "#0f172a",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ color: "#0369a1", fontWeight: 800, marginBottom: "6px" }}>
                  Minh chứng đổi PIN CRT
                </div>
                <div style={{ fontWeight: 700 }}>Mã: {demoProof.subjectId || demoProof.maHp} - HP: {demoProof.maHp}</div>
                <div><span style={{ color: "#475569" }}>p cũ:</span> <span style={{ color: "#0f766e", fontWeight: 800 }}>{demoProof.oldRange ? `${demoProof.oldRange.startIndex}-${demoProof.oldRange.endIndex}` : "không có"}</span></div>
                <div><span style={{ color: "#475569" }}>p mới:</span> <span style={{ color: "#0f766e", fontWeight: 800 }}>{demoProof.newRange ? `${demoProof.newRange.startIndex}-${demoProof.newRange.endIndex}` : "không có"}</span></div>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ color: "#475569" }}>C cũ:</span> <span style={{ color: "#c2410c", fontWeight: 800 }}>{demoProof.oldC}</span></div>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ color: "#475569" }}>C mới:</span> <span style={{ color: "#c2410c", fontWeight: 800 }}>{demoProof.newC}</span></div>
                <div style={{ color: "#15803d", fontWeight: 800 }}>
                  Điểm gốc sau giải mã: {Array.isArray(demoProof.plaintext) ? demoProof.plaintext.join(", ") : "không đổi"}
                </div>
              </div>
            )}

            <button
              className="btn btn--primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang cập nhật..." : "Đổi PIN"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default EncryptionKey;
