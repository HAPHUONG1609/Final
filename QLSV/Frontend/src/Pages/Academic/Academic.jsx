import React, { useMemo, useState, useEffect } from "react";
import "./Academic.css";
import Student from "../../assets/icon/student-bg.png";

const API_BASE = "http://localhost:3000";

function Academic() {
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [loadingYear, setLoadingYear] = useState(false);
  const [loadingSemester, setLoadingSemester] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);

  const [errorYear, setErrorYear] = useState("");
  const [errorSemester, setErrorSemester] = useState("");
  const [errorCourse, setErrorCourse] = useState("");

  const [pin, setPin] = useState("");
  const [year, setYear] = useState("");
  const [sem, setSem] = useState("");
  const [q, setQ] = useState("");
  const [decrypted, setDecrypted] = useState(false);

  const formatGrade = (value) => {
    if (value === null || value === undefined || value === "") return "-";

    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return "-";

    return Number.isInteger(numberValue)
      ? String(numberValue)
      : numberValue.toFixed(1);
  };

  useEffect(() => {
    let dead = false;

    (async () => {
      try {
        setLoadingYear(true);
        setErrorYear("");

        const res = await fetch(`${API_BASE}/api/tkb/year`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load years");

        const data = await res.json();

        if (!dead && data?.length) {
          const [start, end] = data[0].KhoaHoc.split("-").map(Number);
          const listYears = [];

          for (let y = start; y < end; y++) {
            listYears.push(`${y}-${y + 1}`);
          }

          setYears(listYears);

          if (!year && listYears.length > 0) {
            setYear(listYears[0]);
          }
        }
      } catch (err) {
        if (!dead) setErrorYear(err.message);
      } finally {
        if (!dead) setLoadingYear(false);
      }
    })();

    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    if (!year) return;

    let dead = false;

    (async () => {
      try {
        setLoadingSemester(true);
        setErrorSemester("");
        setSemesters([]);
        setSem("");

        const res = await fetch(`${API_BASE}/api/semesters/${year}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load semesters");

        const data = await res.json();

        if (!dead && data?.length) {
          setSemesters(data);

          if (!sem) {
            setSem(String(data[0].HocKy));
          }
        }
      } catch (err) {
        if (!dead) setErrorSemester(err.message);
      } finally {
        if (!dead) setLoadingSemester(false);
      }
    })();

    return () => {
      dead = true;
    };
  }, [year]);

  useEffect(() => {
    if (!year || !sem) return;

    let dead = false;

    (async () => {
      try {
        setLoadingCourse(true);
        setErrorCourse("");
        setDecrypted(false);

        const res = await fetch(`${API_BASE}/api/tkb/${year}/${sem}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load courses");

        const data = await res.json();

        if (!dead) {
          const clean = (data || []).map((c) => ({
            ...c,
            MAHP: String(c.MAHP || "").trim(),
            TenHP: String(c.TenHP || "").trim(),
            SoTinChi: Number(c.SoTinChi || 0),
            MaLop: String(c.MaLop || "").trim(),
            LichHoc: String(c.LichHoc || "").trim(),
            GK: null,
            CK: null,
            DiemTrungBinh: null,
            error: "",
          }));

          setCourses(clean);
        }
      } catch (err) {
        if (!dead) setErrorCourse(err.message);
      } finally {
        if (!dead) setLoadingCourse(false);
      }
    })();

    return () => {
      dead = true;
    };
  }, [year, sem]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    return courses.filter((c) => {
      const maHp = String(c.MAHP || "").toLowerCase();
      const tenHp = String(c.TenHP || "").toLowerCase();
      const maLop = String(c.MaLop || "").toLowerCase();
      const lichHoc = String(c.LichHoc || "").toLowerCase();
      const soTinChi = String(c.SoTinChi || "").toLowerCase();

      return (
        !search ||
        maHp.includes(search) ||
        tenHp.includes(search) ||
        maLop.includes(search) ||
        lichHoc.includes(search) ||
        soTinChi.includes(search)
      );
    });
  }, [courses, q]);

  const semesterSummary = useMemo(() => {
    if (!decrypted) {
      return {
        gpa: null,
        totalCredits: 0,
        countedCourses: 0,
      };
    }

    let totalGpaPoints = 0;
    let totalCredits = 0;
    let countedCourses = 0;

    // Tính GPA theo toàn bộ học phần của năm học + học kỳ đang chọn.
    // Không dùng filtered, vì filtered chỉ là danh sách đang tìm kiếm trên giao diện.
    courses.forEach((c) => {
      if (c.error) return;

      const finalGrade =
        c.DiemTrungBinh ??
        c.average ??
        c.DiemThat ??
        c.Diem ??
        null;

      const score10 = Number(finalGrade);
      const credits = Number(c.SoTinChi || 0);

      if (Number.isFinite(score10) && credits > 0) {
        const score4 = (score10 / 10) * 4;

        totalGpaPoints += score4 * credits;
        totalCredits += credits;
        countedCourses += 1;
      }
    });

    if (!totalCredits) {
      return {
        gpa: null,
        totalCredits: 0,
        countedCourses: 0,
      };
    }

    return {
      gpa: (totalGpaPoints / totalCredits).toFixed(2),
      totalCredits,
      countedCourses,
    };
  }, [courses, decrypted]);

  const handleDecrypt = async () => {
    const pinClean = String(pin || "").trim();

    if (!/^\d{4,10}$/.test(pinClean)) {
      alert("PIN phải là số và dài từ 4 đến 10 chữ số");
      return;
    }

    if (!courses || courses.length === 0) {
      alert("Không có học phần nào để giải mã");
      return;
    }

    try {
      const decryptedCourses = await Promise.all(
        courses.map(async (course) => {
          const courseId = String(course.MAHP || "").trim();

          if (!courseId) {
            return {
              ...course,
              GK: null,
              CK: null,
              DiemTrungBinh: null,
              error: "Thiếu mã học phần",
            };
          }

          const res = await fetch(`${API_BASE}/api/view-grades`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              pin: pinClean,
              courseId,
            }),
          });

          const text = await res.text();

          let data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch {
            data = null;
          }

          if (!res.ok) {
            const rawMessage = data?.message || text || "Không giải mã được điểm";
            const friendlyMessage =
              res.status === 404 || rawMessage.includes("Không tìm thấy điểm CRT")
                ? "Chưa có điểm cho môn học này"
                : rawMessage;

            return {
              ...course,
              GK: null,
              CK: null,
              DiemTrungBinh: null,
              error: friendlyMessage,
            };
          }

          return {
            ...course,
            GK:
              data?.gk ??
              data?.GK ??
              data?.grades?.gk ??
              data?.grades?.GK ??
              null,

            CK:
              data?.ck ??
              data?.CK ??
              data?.grades?.ck ??
              data?.grades?.CK ??
              null,

            DiemTrungBinh:
              data?.average ??
              data?.DiemTrungBinh ??
              data?.DiemThat ??
              data?.grades?.average ??
              data?.grades?.DiemTrungBinh ??
              data?.grades?.DiemThat ??
              null,

            error: "",
          };
        })
      );

      setCourses(decryptedCourses);
      setDecrypted(true);
    } catch (err) {
      console.error("Lỗi handleDecrypt:", err);
      alert(err?.message || "Lỗi khi giải mã điểm. Vui lòng thử lại.");
    }
  };

  return (
    <div className="acad">
      <section className="acad__hero card first">
        <div className="hero__left">
          <div className="hero__content">
            <img src={Student} alt="" className="hero__icon" />
            <h1 className="hero__title">
              My Academic <br /> Records
            </h1>
          </div>

          <p className="hero__desc">
            Nhập mã PIN dạng số để giải mã và xem điểm giữa kỳ, cuối kỳ,
            điểm trung bình.
          </p>
        </div>

        <div className="hero__right">
          <label htmlFor="pin" className="pin__label">
            Secure PIN
          </label>

          <div className="pin__field">
            <i className="fa-regular fa-square-check" aria-hidden="true" />
            <input
              id="pin"
              className="pin__input"
              type="password"
              maxLength={10}
              placeholder="Nhập PIN dạng số"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>

          <button className="btn btn--primary" onClick={handleDecrypt}>
            Giải mã điểm
          </button>
        </div>
      </section>

      <section className="acad__section">
        <div className="sec__header">
          <div className="sec__title">
            <i className="fa-regular fa-clipboard" aria-hidden="true" />
            {decrypted ? "Kết quả giải mã điểm" : "Course Performance Overview"}
          </div>

          <div className="filters">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{
                backgroundColor: "#fff",
                color: "#334155",
                borderRadius: "8px",
                padding: "10px 12px",
                height: "40px",
                fontSize: "13px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Chọn năm học</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select value={sem} onChange={(e) => setSem(e.target.value)}>
              <option value="">Chọn học kỳ</option>
              {semesters.map((s) => (
                <option key={s.HocKy} value={s.HocKy}>
                  {s.HocKy}
                </option>
              ))}
            </select>

            <div className="search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by course code or name..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {errorYear && <div className="error">{errorYear}</div>}
        {errorSemester && <div className="error">{errorSemester}</div>}
        {errorCourse && <div className="error">{errorCourse}</div>}

        <div className="table card">
          <div className="table__scroll">
            <table>
              <thead>
                <tr>
                  <th>MAHP</th>
                  <th>TenHP</th>
                  <th>SoTinChi</th>
                  {!decrypted && <th>MaLop</th>}
                  {!decrypted && <th>LichHoc</th>}
                  {decrypted && <th>GK</th>}
                  {decrypted && <th>CK</th>}
                  {decrypted && <th>Điểm trung bình</th>}
                </tr>
              </thead>

              <tbody>
                {loadingYear || loadingSemester || loadingCourse ? (
                  <tr>
                    <td colSpan={decrypted ? 6 : 5} className="empty">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((c, index) => (
                    <tr key={`${c.MAHP}-${index}`}>
                      <td className="mono">{c.MAHP}</td>
                      <td>{c.TenHP}</td>
                      <td>{c.SoTinChi}</td>

                      {!decrypted && <td>{c.MaLop}</td>}
                      {!decrypted && <td>{c.LichHoc}</td>}

                      {decrypted && (
                        <>
                          <td className="mono">
                            {c.error ? c.error : formatGrade(c.GK)}
                          </td>
                          <td className="mono">
                            {c.error ? "-" : formatGrade(c.CK)}
                          </td>
                          <td className="mono">
                            {c.error ? "-" : formatGrade(c.DiemTrungBinh)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={decrypted ? 6 : 5} className="empty">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {decrypted && (
        <section className="summary card">
          <div className="summary__title">Academic Summary</div>

          <div className="summary__grid">
            <div className="summary__meta">
              <div className="meta__label">Semester GPA</div>
              <div className="meta__value">{semesterSummary.gpa ?? "—"}</div>
            </div>

            <div className="summary__note">
              Tính theo {semesterSummary.countedCourses} học phần / {semesterSummary.totalCredits} tín chỉ trong học kỳ {sem}, năm học {year}.
              <br />
              Last Updated: {new Date().toLocaleDateString("vi-VN")}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Academic;