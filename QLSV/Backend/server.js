const express = require("express");
const sql = require("msnodesqlv8");
const cors = require("cors");
const session = require("express-session");

const path = require("path");
const crypto = require("crypto"); // Dùng để mã hóa/giải mã AES
  //Thêm vào để load được sinh viên trong quá trình nhập điểm, và gọi Java API cho CRT, nếu không thêm, quá trình gọi điểm sẽ bị chặn
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

/* ---------- 1. Kết nối SQL (Windows Auth, ODBC 17) ---------- */
const connectionString =
  "Server=localhost\\SQLEXPRESS;"+
  "Database=QLSV_AT;" +
  "Trusted_Connection=Yes;" +
  "Driver={ODBC Driver 17 for SQL Server};" +
  "Encrypt=no;TrustServerCertificate=yes;";

/* ==================== CÁC HÀM TIỆN ÍCH CRYPTO ==================== */

// 1. Hàm tạo khóa AES-256 (32 bytes) từ mảng C_sv (Khóa cá nhân CRT)
function deriveAESKey(cSvArray) {
  const cSvString = cSvArray.join(",");
  // Băm mảng C_sv bằng SHA-256 để lấy ra chính xác 32 byte làm khóa AES
  return crypto.createHash('sha256').update(cSvString).digest(); 
}

// 2. Hàm mã hóa AES (Giảng viên dùng khi nhập điểm)
function encryptAES(text, aesKey) {
  const iv = crypto.randomBytes(16); // Tạo Vector Khởi tạo ngẫu nhiên (16 bytes)
  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Lưu vào DB dạng: ivHex:encryptedHex
  return iv.toString('hex') + ':' + encrypted;
}

// 3. Hàm giải mã AES (Sinh viên dùng khi xem điểm)
function decryptAES(encryptedData, aesKey) {
  try {
      const parts = encryptedData.split(':');
      if (parts.length !== 2) return encryptedData; // Nếu dữ liệu không đúng format

      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
  } catch (error) {
      console.error("Lỗi giải mã AES:", error);
      return "LỖI GIẢI MÃ";
  }
}


/* ---------- 2. Hàm chính để thêm sinh viên ---------- */
async function createStudent(
  mssv,
  hoten,
  ngaysinh,
  noisinh,
  gioitinh,
  malop,
  email,
  khoahoc,
  bacdaotao,
  loaihinhDT,
  nganhDT,
  khoa,
  chuyennganh,
  cb,
) {
  const sp = ` EXEC sp_ThemSinhVien
              @MaSV = ?,
              @HoTen = ?,
              @NgaySinh = ?,
              @NoiSinh = ?,
              @GioiTinh = ?,
              @MaLop = ?,
              @Email = ?,
              @KhoaHoc = ?,
              @BacDaoTao = ?,
              @LoaiHinhDT = ?,
              @NganhDT = ?,
              @Khoa = ?,
              @ChuyenNganh = ?
            `;

  sql.query(
    connectionString,
    sp,
    [
      mssv,
      hoten,
      ngaysinh,
      noisinh,
      gioitinh,
      malop,
      email,
      khoahoc,
      bacdaotao,
      loaihinhDT,
      nganhDT,
      khoa,
      chuyennganh,
    ],
    (err, rows) => {
      if (err) return cb(err);
      cb(null, rows);
    },
  );
}

// ===================== HOC PHAN =====================

// Thêm học phần (dùng sp_ThemHocPhan)
function addHocPhan(
  mahp,
  tenhp,
  stc,
  hk,
  namhoc,
  malop,
  gv,
  ngaybd,
  ngaykt,
  cb,
) {
  const sp = `
    EXEC sp_ThemHocPhan
      @MaHP = ?,
      @TenHP = ?,
      @STC = ?,
      @HK = ?,
      @NamHoc = ?,
      @MaLop = ?,
      @GV = ?,
      @NgayBD = ?,
      @NgayKT = ?
  `;

  sql.query(
    connectionString,
    sp,
    [mahp, tenhp, stc, hk, namhoc, malop, gv, ngaybd, ngaykt],
    (err, rows) => {
      if (err) return cb(err);
      cb(null, rows);
    },
  );
}

// Sửa học phần (dùng sp_SuaHocPhan)
function updateHocPhan(
  mahp,
  tenhp,
  stc,
  hk,
  namhoc,
  malop,
  gv,
  ngaybd,
  ngaykt,
  cb,
) {
  const sp = `
    EXEC sp_SuaHocPhan
      @MaHP = ?,
      @TenHP = ?,
      @STC = ?,
      @HK = ?,
      @NamHoc = ?,
      @MaLop = ?,
      @GV = ?,
      @NgayBD = ?,
      @NgayKT = ?
  `;

  sql.query(
    connectionString,
    sp,
    [mahp, tenhp, stc, hk, namhoc, malop, gv, ngaybd, ngaykt],
    (err, rows) => {
      if (err) return cb(err);
      cb(null, rows);
    },
  );
}

// Xóa học phần (dùng sp_XoaHocPhan)
function deleteHocPhan(mahp, cb) {
  const sp = `EXEC sp_XoaHocPhan @MaHP = ?`;
  sql.query(connectionString, sp, [mahp], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}

// ===================== LOP =====================
// Thêm lớp (dùng sp_ThemLop)
function addLop(malop, tenlop, makhoa, cb) {
  const sp = `
    EXEC sp_ThemLop
      @MaLop = ?,
      @TenLop = ?,
      @MaKhoa = ?
  `;

  sql.query(connectionString, sp, [malop, tenlop, makhoa], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}

// Sửa lớp (dùng sp_SuaLop)
function updateLop(malop, tenlop, makhoa, cb) {
  const sp = `
    EXEC sp_SuaLop
      @MaLop = ?,
      @TenLop = ?,
      @MaKhoa = ?
  `;

  sql.query(connectionString, sp, [malop, tenlop, makhoa], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}

// Xóa lớp (dùng sp_XoaLop)
function deleteLop(malop, cb) {
  const sp = `EXEC sp_XoaLop @MaLop = ?`;
  sql.query(connectionString, sp, [malop], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}

/*----------3. Hàm chính để thêm khoa */
async function createKhoa(MaKhoa, TenKhoa, cb) {
  const sp = ` EXEC sp_ThemKhoa
              @MaKhoa = ?,
              @TenKhoa = ?
            `;

  sql.query(connectionString, sp, [MaKhoa, TenKhoa], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}

/* ---------- 3. Tiện ích gọi SP đăng nhập ---------- */
async function execTaiKhoan(identifier, password, cb) {
  const sp = " EXEC sp_KiemTraDangNhap @User = ?, @PassRaw = ?";
  sql.query(connectionString, sp, [identifier, password], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}

/*--------------- 4. HÀM CRT ------------------------- */
// Tự động chạy khi server khởi động để đồng bộ Key Khoa
const spKhoa = "SELECT MAKHOA FROM KHOA WHERE Primes IS NULL OR Ciphertext IS NULL";
sql.query(connectionString, spKhoa, async (err, rows) => {
  if (err) return console.error(err);
  const payload = rows.map((sv) => ({ maKhoa: sv.MAKHOA }));
  if (payload.length > 0) {
      try {
        const result = await callJavaBatch(payload);
        saveResultToDB(result);
      } catch (e) {
        console.error("Xử lý batch lỗi:", e.message);
      }
  }
});

async function callJavaBatch(list) {
  const res = await fetch("http://localhost:8080/internal/crypto/process-batch", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(list)
  });
  if (!res.ok) throw new Error("Java API error: " + res.status);
  return await res.json();
}

async function callJavaCalculateIndex(payload) {
  const res = await fetch("http://localhost:8080/internal/crypto/calculate-index", {
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Java service calculate-index error: " + res.status);
  return await res.json();
}

async function callJavaCrypto(payload) {
  const res = await fetch("http://localhost:8080/internal/crypto/process", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Java service error");
  return await res.json();
}

function saveResultToDB(result) {
  sql.open(connectionString, (err, conn) => {
    if (err) return console.error("Lỗi kết nối DB:", err);
    const updateSql = ` UPDATE KHOA SET Primes = ?, Ciphertext = ? WHERE MAKHOA = ? `;
    let index = 0;
    function next() {
      if (index >= result.length) {
        conn.close(); console.log("Lưu Key Khoa vào DB thành công!"); return;
      }
      const r = result[index++];
      if (!r.primes || !r.encryption) return next();
      conn.query(updateSql, [r.primes.join(","), r.encryption.join(","), r.maKhoa], (err) => {
          if (err) console.error(`Lỗi UPDATE ${r.maKhoa}:`, err);
          next();
      });
    }
    next();
  });
}

function getThongTinTuMSSV(mssv, cb) {
  const query = `
    SELECT sv.MaLop, k.Primes
    FROM SINH_VIEN sv join KHOA k ON sv.KHOA = k.MAKHOA
    WHERE sv.MaSV = ?
  `;

  sql.query(connectionString, query, [mssv], (err, rows) => {
    if (err) return cb(err);

    if (!rows || rows.length === 0) {
      return cb(null, null);
    }

    const primes = rows[0].Primes ? rows[0].Primes.split(",") : [];

    const payload = {
      maLop: rows[0].MaLop,
      primesKhoa: primes.map((p) => p.toString()),
    };

    cb(null, payload);
  });
}

/* ---------- 5. Khởi tạo Express + Session + CORS ---------- */
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    //methods: ["GET", "POST", "PUT", "DELETE"],
    //allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
//app.options("/*", cors());
app.use(express.json());
app.use(
  session({
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

/*===================================================================*/
/*================= 6. ĐĂNG NHẬP & LỊCH SỬ ĐĂNG NHẬP ================*/
/*===================================================================*/

// API Đăng nhập 
app.post("/login", (req, res) => {
  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Thiếu tên đăng nhập hoặc mật khẩu",
    });
  }

  execTaiKhoan(identifier, password, async (err, rows) => {
    if (err) {
      console.error("Lỗi đăng nhập:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ",
      });
    }

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
      });
    }

    const tk = rows[0];

    const roleRaw = String(tk.ROLE || "").trim().toUpperCase();

    let roleCode = -1;
    let redirectUrl = "/";

    // ADMIN và GIANGVIEN đều vào trang admin
    if (
      roleRaw === "ADMIN" ||
      roleRaw === "GIANGVIEN" ||
      roleRaw === "GIẢNGVIÊN" ||
      roleRaw === "GV" ||
      roleRaw === "1"
    ) {
      roleCode = 1;
      redirectUrl = "/admin/dashboard";
    } else if (
      roleRaw === "SINHVIEN" ||
      roleRaw === "STUDENT" ||
      roleRaw === "SV" ||
      roleRaw === "0"
    ) {
      roleCode = 0;
      redirectUrl = "/student/dashboard";
    } else {
      return res.status(403).json({
        success: false,
        message: "Tài khoản chưa được phân quyền hợp lệ",
      });
    }

    req.session.user = {
      user: tk.USERNAME,
      username: tk.USERNAME,
      role: roleCode,
      roleName: roleRaw,
      relatedId: tk.RELATED_ID,
      id: tk.RELATED_ID,
    };

    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (ip === "::1" || ip === "::ffff:127.0.0.1") ip = "127.0.0.1";

    let location = "Localhost, Unknown";

    if (ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await geoRes.json();

        if (geoData.status === "success") {
          location = `${geoData.city}, ${geoData.country}`;
        }
      } catch (e) {
        console.error("Lỗi lấy vị trí:", e);
      }
    }

    sql.query(
      connectionString,
      `EXEC sp_GhiLogDangNhap ?, ?, ?`,
      [tk.USERNAME, ip, location],
      (logErr) => {
        if (logErr) {
          console.error("LỖI GHI LOG ĐĂNG NHẬP:", logErr);
        }
      }
    );

    return res.json({
      success: true,
      message: "Đăng nhập thành công",
      username: tk.USERNAME,
      role: roleRaw,
      roleCode: roleCode,
      id: tk.RELATED_ID,
      redirectUrl: redirectUrl,
    });
  });
});
// API Lấy lịch sử đăng nhập 
app.get("/api/login-history", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const username = req.session.user.user;

  sql.query(
    connectionString,
    `EXEC sp_LayLichSuDangNhap @User=?`,
    [username],
    (err, rows) => {
      if (err) {
        console.error("Lỗi lấy lịch sử đăng nhập:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
      }

      return res.json({
        history: rows,
      });
    }
  );
});

/* ---------- 7. Lấy danh sách lớp ---------- */
app.get("/classes", (req, res) => {
  const maNV = req.session.user?.user;
  if (!maNV) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const q = "SELECT MALOP AS id, TENLOP AS name, MAKHOA AS makhoa FROM LOP";
  sql.query(connectionString, q, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    res.json(rows);
  });
});

/*---------- Lấy danh sách khoa ----------*/
app.get("/faculty", (req, res) => {
  //const maNV = req.session.user?.user;
  //if (!maNV) {
  //  return res.status(401).json({ message: "Chưa đăng nhập" });
  //}
  
  const q = "SELECT MAKHOA AS maKhoa, TENKHOA AS tenKhoa FROM KHOA";
  sql.query(connectionString, q, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    res.json(rows);
  });
});



/* ---------- 8. Lấy thông tin SV ---------- */
app.get("/student", (req, res) => {
  const mssv = req.session.user?.user;
  if (!mssv) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const sp = "EXEC sp_GetSinhVienByMSSV @MSSV = ?";
  sql.query(connectionString, sp, [mssv], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    res.json(result[0]);
  });
});

/*------------------- Chập nhật thông tin sinh viên ở student -------------------*/
app.put("/student/update", (req, res) => {
  const mssv = req.session.user?.user;
  if (!mssv) {
    return res.status(401).json({ message: "Chưa đăng nhập" });

  }
  const {noisinh} = req.body;
  const sp = `
    EXEC sp_SuaNoiSinh
      @MaSV = ?,
      @NoiSinh = ?
  `;
  sql.query(connectionString, sp, [mssv, noisinh], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    res.json({ message: "Cập nhật thành công" });
  });
});



// New Flow
// 1. Sinh viên thiết lập/cập nhật mã PIN
app.post("/api/set-pin", (req, res) => {

  const mssv = req.session.user?.user;
  const { currentPin, newPin } = req.body;

  if (!mssv || !currentPin || !newPin)
    return res.status(400).json({ message: "Thiếu thông vị" });

  // Verify PIN cũ
  sql.query(
    connectionString,
    `EXEC sp_VerifyPIN @MASV = ?, @PIN = ?`,
    [mssv, currentPin],
    (err, result) => {

      if (err)
        return res.status(500).json({ message: "Lỗi DB" });

      const valid = result[0]?.IsValid;

      if (valid !== 1)
        return res.status(401).json({ message: "PIN hiện tại không đúng" });

      // Gọi stored procedure để hash và lưu PIN mới
      sql.query(
        connectionString,
        `EXEC dbo.HashAndSavePIN @id = ?, @pin = ?`,
        [mssv, newPin],
        (err) => {

          if (err)
            return res.status(500).json({ message: "Lỗi cập nhật PIN" });

          res.json({
            message: "Cập nhật mã PIN thành công!"
          });
        }
      );
    }
  );
});


// 2. Giảng viên nhập điểm theo flow mới: 1 môn - nhiều sinh viên
// Mỗi sinh viên có GK, CK, TB -> mã hóa CRT -> lưu DIEM_CRT(MASV, MAHP, C)
// Không lưu START_INDEX / END_INDEX. Hai giá trị này sẽ được tính lại khi giải mã.
// 2. Giảng viên nhập điểm theo flow Diffie-Hellman + CRT
// Mã hóa:
//   PUBLIC_KEY sinh viên + PIN giảng viên
//   => sharedSecret
//   => startIndex/endIndex
//   => primes
//   => C
//
// Lưu:
//   DIEM_CRT(MASV, MAHP, MAGV, C)
//
// Không lưu START_INDEX / END_INDEX.
app.post("/admin/nhap-diem", async (req, res) => {
  try {
    console.log("========== API /admin/nhap-diem ==========");
    console.log("BODY:", req.body);
    console.log("SESSION:", req.session);

    const courseId = String(
      req.body.courseId ||
      req.body.maHp ||
      req.body.MAHP ||
      ""
    ).trim();

    const semesterRaw = req.body.semester ?? req.body.hocKy ?? req.body.HocKy;
    const academicYear = String(
      req.body.academicYear ||
      req.body.namHoc ||
      req.body.NamHoc ||
      ""
    ).trim();

    const pin = String(req.body.pin || "").trim();
    const grades = Array.isArray(req.body.grades) ? req.body.grades : [];

    if (!courseId || !semesterRaw || !academicYear || !pin || grades.length === 0) {
      return res.status(400).json({
        message: "Thiếu courseId, semester, academicYear, grades hoặc pin",
        debug: {
          body: req.body
        }
      });
    }

    if (!/^\d+$/.test(pin)) {
      return res.status(400).json({
        message: "PIN giảng viên phải là số"
      });
    }

    const courseIdClean = courseId.trim();
    const semester = Number(semesterRaw);

    if (!Number.isFinite(semester)) {
      return res.status(400).json({
        message: "Học kỳ không hợp lệ",
        semester: semesterRaw
      });
    }

    // =========================================================
    // 1. Lấy MAGV từ HOC_PHAN
    //
    // Lý do:
    // Không lấy MAGV từ session nữa, vì session có thể đang là sv001.
    // Nếu lấy session.user.user sẽ bị lưu nhầm MAGV = sv001.
    //
    // HOC_PHAN khi thêm học phần đang có field giangvien -> @GV,
    // nên ở đây lấy HOC_PHAN.GV làm mã giảng viên.
    // =========================================================

    const hpRows = await new Promise((resolve, reject) => {
      sql.query(
        connectionString,
        `
          SELECT 
            MaGV,
            GiangVien
          FROM HOC_PHAN
          WHERE LTRIM(RTRIM(MaHP)) = ?
            AND LTRIM(RTRIM(NamHoc)) = ?
            AND HocKy = ?
        `,
        [courseIdClean, academicYear, semester],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });

    console.log("KẾT QUẢ HOC_PHAN:", hpRows);

    if (!hpRows || hpRows.length === 0) {
      return res.status(404).json({
        message: `Không tìm thấy học phần ${courseIdClean} - ${academicYear} - học kỳ ${semester}`,
        hint: "Kiểm tra bảng HOC_PHAN có đúng MaHP, NamHoc, HocKy không."
      });
    }

    const maGv = String(
      hpRows[0].MaGV ||
      hpRows[0].GiangVien ||
      ""
    ).trim();

    if (!maGv) {
      return res.status(500).json({
        message: `Học phần ${courseIdClean} chưa có MaGV/GiangVien`,
        data: hpRows[0]
      });
    }

    if (!maGv) {
      return res.status(500).json({
        message: `Học phần ${courseIdClean} chưa có mã giảng viên GV`,
        data: hpRows[0]
      });
    }

    console.log("MAGV LẤY TỪ HOC_PHAN:", maGv);

    // =========================================================
    // 2. Kiểm tra giảng viên có PUBLIC_KEY chưa
    //
    // Mã hóa không dùng PUBLIC_KEY giảng viên,
    // nhưng giải mã cần PUBLIC_KEY giảng viên.
    // Vì vậy kiểm tra sớm để tránh lưu dữ liệu không giải mã được.
    // =========================================================

    const gvRows = await new Promise((resolve, reject) => {
      sql.query(
        connectionString,
        `
          SELECT PUBLIC_KEY
          FROM GIANG_VIEN
          WHERE LTRIM(RTRIM(MaGV)) = ?
        `,
        [maGv],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });

    console.log("KẾT QUẢ GIANG_VIEN:", gvRows);

    if (!gvRows || gvRows.length === 0) {
      return res.status(404).json({
        message: `Không tìm thấy giảng viên ${maGv} trong bảng GIANG_VIEN`,
        hint: "Kiểm tra HOC_PHAN.GV có khớp với GIANG_VIEN.MaGV không."
      });
    }

    if (!gvRows[0].PUBLIC_KEY) {
      return res.status(500).json({
        message: `Giảng viên ${maGv} chưa có PUBLIC_KEY. Sinh viên sẽ không giải mã được nếu tiếp tục mã hóa.`
      });
    }

    // =========================================================
    // 3. Mã hóa từng sinh viên
    // =========================================================

    const encryptedResults = [];

    for (const g of grades) {
      const mssv = String(
        g.MaSV ||
        g.MASV ||
        g.maSv ||
        g.mssv ||
        g.MSSV ||
        ""
      ).trim();

      if (!mssv) {
        encryptedResults.push({
          status: "error",
          message: "Thiếu mã sinh viên trong danh sách điểm",
          input: g
        });
        continue;
      }

      const gkRaw = g.gk ?? g.GK ?? g.diemGK ?? g.DiemGK;
      const ckRaw = g.ck ?? g.CK ?? g.diemCK ?? g.DiemCK;
      const averageRaw =
        g.average ??
        g.Average ??
        g.diemTrungBinh ??
        g.DiemTrungBinh ??
        g.DiemTB ??
        g.diemTB ??
        g.tb ??
        g.TB;

      const gk = Number(gkRaw);
      const ck = Number(ckRaw);
      const average = Number(averageRaw);

      if (
        !Number.isFinite(gk) ||
        !Number.isFinite(ck) ||
        !Number.isFinite(average)
      ) {
        encryptedResults.push({
          status: "error",
          MaSV: mssv,
          message: "Điểm GK, CK hoặc điểm trung bình không hợp lệ",
          input: g
        });
        continue;
      }

      if (
        gk < 0 || gk > 10 ||
        ck < 0 || ck > 10 ||
        average < 0 || average > 10
      ) {
        encryptedResults.push({
          status: "error",
          MaSV: mssv,
          message: "Điểm phải nằm trong khoảng 0 đến 10",
          input: g
        });
        continue;
      }

      const mssvClean = mssv.trim();

      const listDiem = [
        Math.round(gk * 10),
        Math.round(ck * 10),
        Math.round(average * 10)
      ];

      console.log("------------------------------------------");
      console.log("MÃ HÓA CHO SINH VIÊN:", mssvClean);
      console.log("ĐIỂM GỐC:", { gk, ck, average });
      console.log("ĐIỂM * 10:", listDiem);

      // =======================================================
      // 3.1. Lấy thông tin sinh viên
      // Cần:
      //   MaKhoa, MaLop để hash startIndex
      //   PUBLIC_KEY sinh viên để tạo sharedSecret khi mã hóa
      // =======================================================

      const svRows = await new Promise((resolve, reject) => {
        sql.query(
          connectionString,
          `
            SELECT MaLop, Khoa AS MaKhoa, PUBLIC_KEY
            FROM SINH_VIEN
            WHERE LTRIM(RTRIM(MaSV)) = ?
          `,
          [mssvClean],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          }
        );
      });

      if (!svRows || svRows.length === 0) {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: `Không tìm thấy sinh viên ${mssvClean}`
        });
        continue;
      }

      const sv = svRows[0];

      if (!sv.MaKhoa || !sv.MaLop) {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: `Sinh viên ${mssvClean} thiếu MaKhoa hoặc MaLop`,
          data: sv
        });
        continue;
      }

      const svPublicKey = String(sv.PUBLIC_KEY || "").trim();

      if (!svPublicKey) {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: `Sinh viên ${mssvClean} chưa có PUBLIC_KEY`
        });
        continue;
      }

      // =======================================================
      // 3.2. Gọi Java /prime-range
      //
      // Diffie-Hellman đúng cho mã hóa:
      //   sharedSecret = PUBLIC_KEY_SINH_VIEN ^ PIN_GIANG_VIEN mod P
      //
      // Java /prime-range chỉ biết:
      //   publicKey + pin
      //
      // Nên ở đây:
      //   publicKey = PUBLIC_KEY sinh viên
      //   pin       = PIN giảng viên
      // =======================================================

      const primeRangeRes = await fetch(
        "http://localhost:8080/internal/crypto/grade-crt/prime-range",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            maKhoa: String(sv.MaKhoa).trim(),
            maLop: String(sv.MaLop).trim(),
            mssv: mssvClean,
            maHp: courseIdClean,
            N: 5000000,

            // PIN giảng viên
            pin,

            // PUBLIC_KEY sinh viên
            publicKey: svPublicKey,
            svPublicKey
          })
        }
      );

      const primeRangeText = await primeRangeRes.text();

      console.log("JAVA PRIME-RANGE RAW:", primeRangeText);

      if (!primeRangeRes.ok) {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: "Java prime-range lỗi khi mã hóa",
          detail: primeRangeText
        });
        continue;
      }

      let primeRangeData;

      try {
        primeRangeData = JSON.parse(primeRangeText);
      } catch {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: "Java prime-range trả về JSON không hợp lệ",
          detail: primeRangeText
        });
        continue;
      }

      const startIndex = Number(primeRangeData.startIndex);
      const endIndex = Number(primeRangeData.endIndex);

      if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: "Java prime-range không trả về startIndex/endIndex hợp lệ",
          data: primeRangeData
        });
        continue;
      }

      console.log("START_INDEX MÃ HÓA:", startIndex);
      console.log("END_INDEX MÃ HÓA:", endIndex);

      // =======================================================
      // 3.3. Lấy 3 số nguyên tố từ bảng SNT
      // =======================================================

      const primeRows = await new Promise((resolve, reject) => {
        sql.query(
          connectionString,
          `
            SELECT Id, Primes
            FROM SNT
            WHERE Id BETWEEN ? AND ?
            ORDER BY Id
          `,
          [startIndex, endIndex],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          }
        );
      });

      console.log("PRIME ROWS:", primeRows);

      if (!primeRows || primeRows.length !== listDiem.length) {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: `Không lấy đủ ${listDiem.length} số nguyên tố từ bảng SNT`,
          startIndex,
          endIndex,
          count: primeRows ? primeRows.length : 0
        });
        continue;
      }

      const primes = primeRows.map(row => String(row.Primes).trim());

      if (primes.some(p => !p)) {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: "Danh sách số nguyên tố có giá trị rỗng",
          primes
        });
        continue;
      }

      // =======================================================
      // 3.4. Gọi Java /encrypt
      // Controller Java đang nhận field:
      //   mssv
      //   diem
      //   primes
      // =======================================================

      const encryptRes = await fetch(
        "http://localhost:8080/internal/crypto/grade-crt/encrypt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mssv: mssvClean,
            diem: listDiem,
            primes
          })
        }
      );

      const encryptText = await encryptRes.text();

      console.log("JAVA ENCRYPT RAW:", encryptText);

      if (!encryptRes.ok) {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: "Java encrypt CRT lỗi",
          detail: encryptText
        });
        continue;
      }

      let encryptData;

      try {
        encryptData = JSON.parse(encryptText);
      } catch {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: "Java encrypt trả về JSON không hợp lệ",
          detail: encryptText
        });
        continue;
      }

      const C = String(encryptData.C || "").trim();

      if (!C) {
        encryptedResults.push({
          status: "error",
          MaSV: mssvClean,
          message: "Java encrypt không trả về C",
          data: encryptData
        });
        continue;
      }

      // =======================================================
      // 3.5. Lưu DIEM_CRT
      //
      // Quan trọng:
      //   Lưu MAGV để lúc sinh viên giải mã biết lấy PUBLIC_KEY
      //   của giảng viên nào.
      //
      // Không lưu START_INDEX / END_INDEX.
      // =======================================================

      const queryInsertCrt = `
        IF EXISTS (
          SELECT 1
          FROM DIEM_CRT
          WHERE LTRIM(RTRIM(MASV)) = ?
            AND LTRIM(RTRIM(MAHP)) = ?
        )
        BEGIN
          UPDATE DIEM_CRT
          SET C = ?, MAGV = ?
          WHERE LTRIM(RTRIM(MASV)) = ?
            AND LTRIM(RTRIM(MAHP)) = ?
        END
        ELSE
        BEGIN
          INSERT INTO DIEM_CRT (MASV, MAHP, MAGV, C)
          VALUES (?, ?, ?, ?)
        END
      `;

      await new Promise((resolve, reject) => {
        sql.query(
          connectionString,
          queryInsertCrt,
          [
            mssvClean,
            courseIdClean,

            C,
            maGv,

            mssvClean,
            courseIdClean,

            mssvClean,
            courseIdClean,
            maGv,
            C
          ],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      encryptedResults.push({
        status: "success",
        MaSV: mssvClean,
        MAHP: courseIdClean,
        MAGV: maGv,
        originalGrades: {
          gk,
          ck,
          average
        },
        plaintext: listDiem,
        C,
        startIndex,
        endIndex,
        primes
      });
    }

    const successCount = encryptedResults.filter(x => x.status === "success").length;
    const errorCount = encryptedResults.filter(x => x.status === "error").length;

    console.log("========== KẾT QUẢ MÃ HÓA ==========");
    console.log(JSON.stringify({
      courseId: courseIdClean,
      academicYear,
      semester,
      maGv,
      successCount,
      errorCount,
      results: encryptedResults
    }, null, 2));

    return res.json({
      message: "Xử lý mã hóa điểm CRT hoàn tất",
      courseId: courseIdClean,
      academicYear,
      semester,
      maGv,
      successCount,
      errorCount,
      results: encryptedResults
    });

  } catch (err) {
    console.error("Lỗi nhập điểm CRT:", err);

    return res.status(500).json({
      message: "Lỗi nhập điểm CRT",
      detail: err.message
    });
  }
});
// 3. Sinh viên xem điểm theo flow mới
// Lấy C từ DIEM_CRT, tính lại startIndex/endIndex bằng PIN, lấy lại primes rồi giải mã CRT.
app.post("/api/view-grades", async (req, res) => {
  try {
    console.log("========== API /api/view-grades ==========");
    console.log("BODY GIẢI MÃ:", req.body);
    console.log("SESSION GIẢI MÃ:", req.session);

    // =========================================================
    // 1. Lấy input từ frontend/session
    // Frontend chỉ cần gửi:
    // {
    //   pin: "...",       // PIN sinh viên
    //   courseId: "HP012"
    // }
    // =========================================================

    const pin = String(req.body.pin || "").trim();

    const courseId = String(
      req.body.courseId ||
      req.body.maHp ||
      req.body.MAHP ||
      ""
    ).trim();

    const mssv = String(
      req.body.mssv ||
      req.body.maSV ||
      req.body.MaSV ||
      req.body.MASV ||

      // Session hiện tại của bạn đang dùng dạng này:
      req.session?.user?.user ||

      req.session?.user?.mssv ||
      req.session?.user?.MSSV ||
      req.session?.user?.maSV ||
      req.session?.user?.MaSV ||
      req.session?.user?.MASV ||
      req.session?.user?.username ||
      req.session?.user?.id ||

      req.session?.student?.user ||
      req.session?.student?.mssv ||
      req.session?.student?.MSSV ||
      req.session?.student?.maSV ||
      req.session?.student?.MaSV ||
      req.session?.student?.MASV ||
      req.session?.student?.username ||
      req.session?.student?.id ||

      req.session?.mssv ||
      req.session?.MSSV ||
      req.session?.maSV ||
      req.session?.MaSV ||
      req.session?.MASV ||
      req.session?.username ||
      req.session?.userId ||
      ""
    ).trim();

    if (!mssv || !courseId || !pin) {
      return res.status(400).json({
        message: "Thiếu mssv, courseId hoặc pin",
        debug: {
          body: req.body,
          hasSession: !!req.session,
          sessionKeys: req.session ? Object.keys(req.session) : [],
          session: req.session
        }
      });
    }

    if (!/^\d+$/.test(pin)) {
      return res.status(400).json({
        message: "PIN sinh viên phải là số"
      });
    }

    const mssvClean = mssv.trim();
    const courseIdClean = courseId.trim();

    console.log("MSSV GIẢI MÃ:", mssvClean);
    console.log("MAHP GIẢI MÃ:", courseIdClean);

    // =========================================================
    // 2. Lấy C và MAGV từ DIEM_CRT
    // MAGV dùng để biết giảng viên nào đã mã hóa điểm
    // =========================================================

    const diemRows = await new Promise((resolve, reject) => {
      sql.query(
        connectionString,
        `
          SELECT C, MAGV
          FROM DIEM_CRT
          WHERE LTRIM(RTRIM(MASV)) = ?
            AND LTRIM(RTRIM(MAHP)) = ?
        `,
        [mssvClean, courseIdClean],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });

    console.log("KẾT QUẢ DIEM_CRT:", diemRows);

    if (!diemRows || diemRows.length === 0) {
      return res.status(404).json({
        message: `Không tìm thấy điểm CRT của ${mssvClean} - ${courseIdClean}`
      });
    }

    const C = String(diemRows[0].C || "").trim();
    const maGv = String(diemRows[0].MAGV || "").trim();

    if (!C) {
      return res.status(500).json({
        message: "Dữ liệu DIEM_CRT thiếu C",
        data: diemRows[0]
      });
    }

    if (!maGv) {
      return res.status(500).json({
        message:
          "Dữ liệu DIEM_CRT thiếu MAGV, không thể lấy PUBLIC_KEY giảng viên để giải mã",
        data: diemRows[0],
        hint:
          "Hãy sửa phần mã hóa để lưu thêm MAGV vào DIEM_CRT, sau đó xóa dữ liệu cũ và mã hóa lại."
      });
    }

    console.log("MAGV ĐÃ MÃ HÓA:", maGv);

    // =========================================================
    // 3. Lấy thông tin sinh viên
    // Giải mã vẫn cần MaKhoa, MaLop để hash ra startIndex giống lúc mã hóa
    // Nhưng KHÔNG dùng PUBLIC_KEY sinh viên ở bước giải mã
    // =========================================================

    const svRows = await new Promise((resolve, reject) => {
      sql.query(
        connectionString,
        `
          SELECT MaLop, Khoa AS MaKhoa
          FROM SINH_VIEN
          WHERE LTRIM(RTRIM(MaSV)) = ?
        `,
        [mssvClean],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });

    console.log("KẾT QUẢ SINH_VIEN:", svRows);

    if (!svRows || svRows.length === 0) {
      return res.status(404).json({
        message: `Không tìm thấy sinh viên ${mssvClean}`
      });
    }

    const sv = svRows[0];

    if (!sv.MaKhoa || !sv.MaLop) {
      return res.status(500).json({
        message: `Sinh viên ${mssvClean} thiếu MaKhoa hoặc MaLop`,
        data: sv
      });
    }

    // =========================================================
    // 4. Lấy PUBLIC_KEY của giảng viên
    //
    // Quan trọng:
    // Mã hóa dùng:
    //   PUBLIC_KEY sinh viên + PIN giảng viên
    //
    // Giải mã phải dùng:
    //   PUBLIC_KEY giảng viên + PIN sinh viên
    //
    // Nếu tên bảng giảng viên của bạn khác GIANG_VIEN,
    // hãy đổi lại đúng tên bảng/cột trong query bên dưới.
    // =========================================================

    const gvRows = await new Promise((resolve, reject) => {
      sql.query(
        connectionString,
        `
          SELECT PUBLIC_KEY
          FROM GIANG_VIEN
          WHERE LTRIM(RTRIM(MaGV)) = ?
        `,
        [maGv],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });

    console.log("KẾT QUẢ GIANG_VIEN:", gvRows);

    if (!gvRows || gvRows.length === 0) {
      return res.status(404).json({
        message: `Không tìm thấy giảng viên ${maGv}`,
        hint:
          "Kiểm tra lại bảng GIANG_VIEN, cột MaGV, hoặc giá trị MAGV trong DIEM_CRT."
      });
    }

    const gv = gvRows[0];
    const gvPublicKey = String(gv.PUBLIC_KEY || "").trim();

    if (!gvPublicKey) {
      return res.status(500).json({
        message: `Giảng viên ${maGv} chưa có PUBLIC_KEY`
      });
    }

    // =========================================================
    // 5. Gọi Java /prime-range để tính lại startIndex/endIndex
    //
    // Diffie-Hellman đúng cho giải mã:
    //   sharedSecret = PUBLIC_KEY_GIANG_VIEN ^ PIN_SINH_VIEN mod P
    //
    // Java /prime-range chỉ cần:
    //   publicKey + pin
    //
    // Vì vậy:
    //   publicKey = PUBLIC_KEY giảng viên
    //   pin       = PIN sinh viên
    // =========================================================

    const primeRangeRes = await fetch(
      "http://localhost:8080/internal/crypto/grade-crt/prime-range",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          maKhoa: String(sv.MaKhoa).trim(),
          maLop: String(sv.MaLop).trim(),
          mssv: mssvClean,
          maHp: courseIdClean,
          N: 5000000,

          // PIN sinh viên
          pin,

          // PUBLIC_KEY giảng viên
          publicKey: gvPublicKey,
          gvPublicKey
        })
      }
    );

    const primeRangeText = await primeRangeRes.text();

    console.log("JAVA PRIME-RANGE RAW:", primeRangeText);

    if (!primeRangeRes.ok) {
      return res.status(500).json({
        message: "Java prime-range lỗi khi giải mã",
        detail: primeRangeText
      });
    }

    let primeRangeData;

    try {
      primeRangeData = JSON.parse(primeRangeText);
    } catch {
      return res.status(500).json({
        message: "Java prime-range trả về JSON không hợp lệ",
        detail: primeRangeText
      });
    }

    const startIndex = Number(primeRangeData.startIndex);
    const endIndex = Number(primeRangeData.endIndex);

    if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) {
      return res.status(500).json({
        message: "Java prime-range không trả về startIndex/endIndex hợp lệ",
        data: primeRangeData
      });
    }

    console.log("START_INDEX GIẢI MÃ:", startIndex);
    console.log("END_INDEX GIẢI MÃ:", endIndex);

    // =========================================================
    // 6. Lấy lại đúng 3 số nguyên tố từ bảng SNT
    // =========================================================

    const primeRows = await new Promise((resolve, reject) => {
      sql.query(
        connectionString,
        `
          SELECT Id, Primes
          FROM SNT
          WHERE Id BETWEEN ? AND ?
          ORDER BY Id
        `,
        [startIndex, endIndex],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });

    console.log("PRIME ROWS:", primeRows);

    if (!primeRows || primeRows.length !== 3) {
      return res.status(500).json({
        message: "Không lấy đủ 3 số nguyên tố từ bảng SNT",
        startIndex,
        endIndex,
        count: primeRows ? primeRows.length : 0,
        data: primeRows
      });
    }

    const primes = primeRows.map(row => String(row.Primes).trim());

    if (primes.some(p => !p)) {
      return res.status(500).json({
        message: "Danh sách số nguyên tố có giá trị rỗng",
        primes
      });
    }

    // =========================================================
    // 7. Gọi Java /decrypt
    // Java tính:
    //   plaintext[i] = C mod primes[i]
    // =========================================================

    const javaResponse = await fetch(
      "http://localhost:8080/internal/crypto/grade-crt/decrypt",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mssv: mssvClean,
          C,
          primes
        })
      }
    );

    const javaText = await javaResponse.text();

    console.log("JAVA DECRYPT RAW:", javaText);

    if (!javaResponse.ok) {
      return res.status(500).json({
        message: `Java decrypt CRT lỗi cho ${mssvClean}`,
        detail: javaText
      });
    }

    let javaData;

    try {
      javaData = JSON.parse(javaText);
    } catch {
      return res.status(500).json({
        message: "Java decrypt trả về JSON không hợp lệ",
        detail: javaText
      });
    }

    if (!javaData.plaintext || !Array.isArray(javaData.plaintext)) {
      return res.status(500).json({
        message: "Java decrypt không trả về plaintext hợp lệ",
        data: javaData
      });
    }

    const plaintext = javaData.plaintext.map(x => Number(x));

    if (plaintext.length !== 3 || plaintext.some(x => !Number.isFinite(x))) {
      return res.status(500).json({
        message: "Plaintext sau giải mã không hợp lệ",
        plaintext: javaData.plaintext
      });
    }

    // =========================================================
    // 8. Validate plaintext
    //
    // Vì điểm đã nhân 10 trước khi mã hóa:
    //   0.0 -> 0
    //   10.0 -> 100
    //
    // Nếu giải mã ra ngoài 0..100:
    //   - PIN sinh viên sai
    //   - PUBLIC_KEY giảng viên sai
    //   - MAGV sai
    //   - dữ liệu DIEM_CRT cũ chưa mã hóa lại
    // =========================================================

    const isValidPlaintext =
      plaintext.length === 3 &&
      plaintext.every(x => Number.isFinite(x) && x >= 0 && x <= 100);

    if (!isValidPlaintext) {
      return res.status(400).json({
        message:
          "Giải mã thất bại: PIN sai, PUBLIC_KEY giảng viên không đúng, hoặc dữ liệu được mã hóa bằng flow cũ",
        mssv: mssvClean,
        courseId: courseIdClean,
        maGv,
        plaintext,
        startIndex,
        endIndex,
        primes,
        hint:
          "Hãy kiểm tra: mã hóa dùng PIN giảng viên + PUBLIC_KEY sinh viên, giải mã dùng PIN sinh viên + PUBLIC_KEY giảng viên, DIEM_CRT có MAGV đúng, và dữ liệu đã được mã hóa lại theo flow mới."
      });
    }

    // =========================================================
    // 9. Đổi điểm từ số nguyên về điểm thật
    // Ví dụ:
    //   30 -> 3.0
    //   70 -> 7.0
    //   50 -> 5.0
    // =========================================================

    const grades = {
      gk: plaintext[0] / 10,
      ck: plaintext[1] / 10,
      average: plaintext[2] / 10
    };

    const result = {
      message: "Giải mã CRT thành công",

      mssv: mssvClean,
      courseId: courseIdClean,
      maGv,

      C,

      startIndex,
      endIndex,
      primes,
      plaintext,

      grades,

      // Trả thêm top-level để frontend dễ đọc
      gk: grades.gk,
      ck: grades.ck,
      average: grades.average,

      // Alias nếu frontend đang dùng tên cũ
      GK: grades.gk,
      CK: grades.ck,
      DiemTrungBinh: grades.average,
      DiemThat: grades.average
    };

    console.log("KẾT QUẢ GIẢI MÃ TRẢ VỀ FRONTEND/CURL:");
    console.log(JSON.stringify(result, null, 2));

    return res.json(result);

  } catch (err) {
    console.error("Lỗi giải mã CRT:", err);

    return res.status(500).json({
      message: "Lỗi giải mã CRT",
      detail: err.message
    });
  }
});

/* ------------ 9. Thêm SV ------------ */
app.post("/admin/student", (req, res) => {
  const MANV = req.session.user?.user;

  if (!MANV) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const {
    mssv,
    hoten,
    ngaysinh,
    noisinh,
    gioitinh,
    malop,
    email,
    khoahoc,
    bacdaotao,
    loaihinhDT,
    nganhDT,
    khoa,
    chuyennganh,
    tinhtrang,
  } = req.body;

  if (!mssv || !hoten || !malop || !khoa) {
    return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
  }

  createStudent(
    mssv,
    hoten,
    ngaysinh || null,
    noisinh || null,
    gioitinh || null,
    malop,
    email || null,
    khoahoc || null,
    bacdaotao || null,
    loaihinhDT || null,
    nganhDT || null,
    khoa,
    chuyennganh || null,
    (err) => {
      if (err) {
        console.error("Lỗi thêm sinh viên:", err);
        return res.status(500).json({ message: err.message });
      }

      res.status(201).json({
        message: "Thêm sinh viên thành công",
      });
    },
  );
});

/*--------------- 10. Sửa thông tin sinh viên ------------------*/
app.put("/admin/student/update", (req, res) => {
  const MANV = req.session.user?.user;

  const {
    mssv,
    hoten,
    ngaysinh,
    noisinh,
    gioitinh,
    malop,
    email,
    khoahoc,
    bacdaotao,
    loaihinhDT,
    nganhDT,
    khoa,
    chuyennganh,
    tinhtrang,
  } = req.body;

  if (!MANV) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  if (!mssv) {
    return res.status(400).json({ message: "Thiếu mã sinh viên" });
  }

  const sp = `
    EXEC sp_SuaSinhVien
      @MaSV = ?,
      @HoTen = ?,
      @NgaySinh = ?,
      @NoiSinh = ?,
      @GioiTinh = ?,
      @MaLop = ?,
      @Email = ?,
      @KhoaHoc = ?,
      @BacDaoTao = ?,
      @LoaiHinhDT = ?,
      @NganhDT = ?,
      @Khoa = ?,
      @ChuyenNganh = ?,
      @TinhTrang = ?
  `;

  sql.query(
    connectionString,
    sp,
    [
      mssv,
      hoten || null,
      ngaysinh || null,
      noisinh || null,
      gioitinh || null,
      malop || null,
      email || null,
      khoahoc || null,
      bacdaotao || null,
      loaihinhDT || null,
      nganhDT || null,
      khoa || null,
      chuyennganh || null,
      tinhtrang || "Đang học",
    ],
    (err) => {
      if (err) {
        console.error("Lỗi sửa sinh viên:", err);
        return res.status(500).json({ message: err.message });
      }

      res.json({
        message: `Cập nhật sinh viên ${mssv} thành công`,
      });
    },
  );
});


/* ---------- Router cập nhật nhanh: Không cần HoTen ---------- */
app.put("/admin/student/quick-update", (req, res) => {
  const { mssv, facultyId, malop, tinhtrang } = req.body;

  if (!mssv) {
    return res.status(400).json({ message: "Thiếu mã sinh viên (mssv)" });
  }

  // Sử dụng câu lệnh UPDATE trực tiếp vào bảng SINH_VIEN
  // Chỉ cập nhật các trường được gửi từ Dashboard
  const query = `
    UPDATE SINH_VIEN 
    SET Khoa = ?, 
        MaLop = ?, 
        TinhTrang = ? 
    WHERE MaSV = ?
  `;

  sql.query(
    connectionString, 
    query, 
    [facultyId, malop, tinhtrang, mssv], 
    (err, result) => {
      if (err) {
        console.error("Lỗi cập nhật nhanh:", err);
        return res.status(500).json({ message: "Lỗi cơ sở dữ liệu: " + err.message });
      }

      res.json({ 
        message: `Cập nhật sinh viên ${mssv} thành công!`,
        status: "success" 
      });
    }
  );
});
/*------------- Lấy danh sách sinh viên ---------------*/
app.get("/admin/students", (req, res) => {
  const MANV = req.session.user?.user;

  if (!MANV) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const q = `
    SELECT
      sv.Khoa AS facultyId,
      sv.MaLop AS classId,
      sv.MaSV AS studentId,
      sv.HoTen AS fullName,
      sv.Email AS email,
      ISNULL(sv.TinhTrang, N'Đang học') AS status,
      'Not yet' AS keyStatus,
      CONVERT(varchar(10), sv.NgaySinh, 23) AS ngaysinh,
      sv.NoiSinh AS noisinh,
      sv.GioiTinh AS gioitinh,
      sv.KhoaHoc AS khoahoc,
      sv.BacDaoTao AS bacdaotao,
      sv.LoaiHinhDT AS loaihinhDT,
      sv.NganhDT AS nganhDT,
      sv.ChuyenNganh AS chuyennganh
    FROM SINH_VIEN sv
    ORDER BY sv.MaSV
  `;

  sql.query(connectionString, q, (err, rows) => {
    if (err) {
      console.error("Lỗi lấy danh sách sinh viên:", err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }

    res.json(rows);
  });
});


/*------------- 12. Xóa sinh viên ---------------*/
app.delete("/admin/student/delete", (req, res) => {
  const MANV = req.session.user?.user;
  const { mssv } = req.body;

  if (!MANV) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  if (!mssv) {
    return res.status(400).json({ message: "Thiếu mã sinh viên" });
  }

  const sp = `EXEC sp_XoaSinhVien @MaSV = ?`;

  sql.query(connectionString, sp, [mssv], (err, result) => {
    if (err) {
      console.error("Lỗi xóa sinh viên:", err);
      return res.status(500).json({ message: err.message });
    }

    res.json({
      message: `Đã xóa sinh viên ${mssv}`,
    });
  });
});

/*------------- 13. CRT lớp ---------------*/
app.post("/internal/crypto/class", (req, res) => {
  const { mssv } = req.body;
  if (!mssv) {
    return res.status(400).json({ message: "Thiếu mã sinh viên" });
  }
  getThongTinTuMSSV(mssv, async (err, payload) => {
    if (err) {
      console.error("Lỗi lấy thông tin từ MSSV:", err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    if (!payload) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }
    try {
      const result = await callJavaCrypto(payload);
      console.log("Payload gửi Java:", payload);
      res.json(result);
    } catch (e) {
      console.error("Lỗi gọi Java Crypto:", e);
      res.status(500).json({ message: "Lỗi dịch vụ mã hóa" });
    }
  });
});

/* ---------- 14. API Lấy khóa cá nhân ---------- */
app.post("/api/get-personal-key", (req, res) => {
  const { mssv, pin } = req.body;

  if (!mssv || !pin) {
    return res.status(400).json({ message: "Thiếu thông tin MSSV hoặc PIN" });
  }

    const queryInfo = `
      SELECT sv.MaLop, sv.Khoa AS MaKhoa, k.Primes, k.Ciphertext
      FROM SINH_VIEN sv
      JOIN KHOA k ON sv.KHOA = k.MAKHOA
      WHERE sv.MaSV = ?
    `;

  sql.query(connectionString, query, [mssv], async (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi kết nối DB" });
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });

    const data = rows[0];
    const primesKhoaList = data.Primes ? data.Primes.split(",") : [];
    const cKhoaList = data.Ciphertext ? data.Ciphertext.split(",") : [];

    try {
      // --- Gọi Java tính primes_lop ---
      const step2Res = await fetch(
        "http://localhost:8080/internal/crypto/process",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maLop: data.MaLop,
            primesKhoa: primesKhoaList,
          }),
        },
      );
      const step2Data = await step2Res.json(); // { maLop: "...", primesLop: "..." }

      // --- Gọi Java tính C_sv ---
      const step3Input = {
        mssv: mssv,
        pin: pin,
        primesLop: step2Data.primesLop,
        encryptionKhoa: cKhoaList,
      };

      const step3Res = await fetch(
        "http://localhost:8080/internal/crypto/student-key",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(step3Input),
        },
      );

      if (!step3Res.ok) throw new Error("Lỗi tại Java Step 3-4");

      const personalKey = await step3Res.json();

      // Trả về khóa cá nhân cho Frontend
      // res.json({
      //     status: "success",
      //     mssv: mssv,
      //     personalKey: personalKey
      // });
    } catch (e) {
      console.error("Lỗi quy trình Crypto:", e);
      res.status(500).json({ message: "Lỗi tính toán bảo mật" });
    }
  });
});

/*-------------15. Thêm khoa ------------- */
app.post("/admin/fac", async (req, res) => {
  const MANV = req.session.user?.user;

  if (!MANV) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const { MaKhoa, TenKhoa } = req.body;

  if (!MaKhoa || !TenKhoa) {
    return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
  }

  try {
    // Thêm khoa vào DB
    await new Promise((resolve, reject) => {
      createKhoa(MaKhoa, TenKhoa, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    //  Gọi Java xử lý crypto
    const payload = [{ maKhoa: MaKhoa }];
    const result = await callJavaBatch(payload);

    // Lưu kết quả vào DB
    await saveResultToDB(result);

    // Trả kết quả cho client
    return res.status(201).json({
      message: "Thêm khoa thành công",
      crypto: result,
    });
  } catch (e) {
    console.error("Lỗi thêm khoa:", e);
    return res.status(500).json({
      message: "Lỗi thêm khoa hoặc xử lý crypto",
    });
  }
});

/*--------------16. Sửa thông tin khoa ------------- */
app.put("/admin/fac/update", (req, res) => {
  const MANV = req.session.user?.user; // lấy từ login
  const { MaKhoa, TenKhoa } = req.body;

  if (!MANV) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  if (!MaKhoa) {
    return res.status(400).json({ message: "Thiếu mã khoa" });
  }

  const sp = `
    EXEC sp_SuaKhoa
      @MaKhoa = ?,
      @TenKhoa = ?
  `;

  sql.query(connectionString, sp, [MaKhoa, TenKhoa || null], (err, result) => {
    if (err) {
      console.error("Lỗi sửa khoa:", err);
      return res.status(500).json({ message: err.message });
    }

    res.json({
      message: `Cập nhật khoa ${MaKhoa} thành công`,
    });
  });
});

/*--------------17. Xóa khoa ------------- */
app.delete("/admin/fac/delete", (req, res) => {
  const MANV = req.session.user?.user;
  const { MaKhoa } = req.body;

  if (!MANV) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  if (!MaKhoa) {
    return res.status(400).json({ message: "Thiếu mã khoa" });
  }

  const sp = `EXEC sp_XoaKhoa @MaKhoa = ?`;

  sql.query(connectionString, sp, [MaKhoa], (err, result) => {
    if (err) {
      console.error("Lỗi xóa khoa:", err);
      return res.status(500).json({ message: err.message });
    }

    res.json({
      message: `Đã xóa khoa ${MaKhoa}`,
    });
  });
});

/* ---------- 18. HOC PHAN ROUTES ---------- */
// Thêm học phần
app.post("/admin/hocphan", (req, res) => {
  const {
    mahp,
    tenhp,
    sotinchi,
    hocky,
    namhoc,
    malop,
    giangvien,
    ngaybatdau,
    ngayketthuc,
  } = req.body;

  if (!mahp || !tenhp || !sotinchi || !hocky) {
    return res.status(400).json({
      message: "Thiếu dữ liệu bắt buộc (mahp, tenhp, sotinchi, hocky)",
    });
  }

  addHocPhan(
    mahp,
    tenhp,
    sotinchi,
    hocky,
    namhoc || null,
    malop || null,
    giangvien || null,
    ngaybatdau || null,
    ngayketthuc || null,
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ message: `Đã thêm học phần ${mahp}` });
    },
  );
});

// Sửa học phần
app.put("/admin/hocphan", (req, res) => {
  const {
    mahp,
    tenhp,
    sotinchi,
    hocky,
    namhoc,
    malop,
    giangvien,
    ngaybatdau,
    ngayketthuc,
  } = req.body;

  if (!mahp) return res.status(400).json({ message: "Thiếu mahp" });

  updateHocPhan(
    mahp,
    tenhp || null,
    sotinchi || null,
    hocky || null,
    namhoc || null,
    malop || null,
    giangvien || null,
    ngaybatdau || null,
    ngayketthuc || null,
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: `Đã cập nhật học phần ${mahp}` });
    },
  );
});

// Xóa học phần
app.delete("/admin/hocphan", (req, res) => {
  const { mahp } = req.body;
  if (!mahp) return res.status(400).json({ message: "Thiếu mahp" });

  deleteHocPhan(mahp, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: `Đã xóa học phần ${mahp}` });
  });
});


/* ---------- 19. LOP ROUTES ---------- */
// Thêm lớp
app.post("/admin/lop", (req, res) => {
  const { malop, tenlop, makhoa } = req.body;
  if (!malop || !tenlop || !makhoa) {
    return res.status(400).json({ message: "Thiếu (malop, tenlop, makhoa)" });
  }

  addLop(malop, tenlop, makhoa, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ message: `Đã thêm lớp ${malop}` });
  });
});

// Sửa lớp
app.put("/admin/lop", (req, res) => {
  const { malop, tenlop, makhoa } = req.body;
  if (!malop) return res.status(400).json({ message: "Thiếu malop" });

  updateLop(malop, tenlop || null, makhoa || null, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: `Đã cập nhật lớp ${malop}` });
  });
});

// Xóa lớp
app.delete("/admin/lop", (req, res) => {
  const { malop } = req.body;
  if (!malop) return res.status(400).json({ message: "Thiếu malop" });

  deleteLop(malop, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: `Đã xóa lớp ${malop}` });
  });
});

/*--------Lấy danh sách sinh viên theo mã học phần, học kì ------*/
app.get('/admin/sinhvien/:mahp/:hocky', (req, res) => {
  const { mahp, hocky } = req.params;

  const query = `
    SELECT sv.MaSV, sv.HoTen
    FROM THOI_KHOA_BIEU tkb JOIN SINH_VIEN sv ON tkb.MASV = sv.MASV
    WHERE tkb.MAHP = ? AND tkb.HocKy = ?
  `;

  sql.query(connectionString, query, [mahp, hocky], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });
    res.json(rows);
  });
});



/* ---------- Lấy danh sách thời khóa biểu theo mssv, học kì, năm học  ---------- */
app.get("/api/schedule", (req, res) => {
  const mssv = req.session.user?.user;
  const { hocky, namhoc } = req.body; 
  if (!mssv) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }
  const sp = `EXEC sp_LayThoiKhoaBieu @MaSV = ?, @HocKy = ?, @NamHoc = ?`;
  sql.query(connectionString, sp, [mssv, hocky, namhoc], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    res.json(rows);
  });
});


/* ---------- Lấy danh sách học phần theo học kì, năm học của admin  ---------- */
app.get("/api/courses/:namhoc/:hocky", (req, res) => {
  const { namhoc, hocky } = req.params;

  if (!namhoc || !hocky) {
    return res.status(400).json({
      message: "Thiếu thông tin năm học hoặc học kỳ",
    });
  }

  const q = `
    SELECT
      LTRIM(RTRIM(hp.MaHP)) AS MaHP,
      hp.TenHP,
      hp.SoTinChi,
      hp.HocKy,
      LTRIM(RTRIM(hp.NamHoc)) AS NamHoc,
      hp.MaLop,
      hp.LichHoc,
      hp.GiangVien,
      hp.MaGV,
      COUNT(DISTINCT tkb.MASV) AS SoSinhVien
    FROM HOC_PHAN hp
    LEFT JOIN THOI_KHOA_BIEU tkb
      ON LTRIM(RTRIM(hp.MaHP)) = LTRIM(RTRIM(tkb.MaHP))
      AND hp.HocKy = tkb.HocKy
      AND LTRIM(RTRIM(hp.NamHoc)) = LTRIM(RTRIM(tkb.NamHoc))
    WHERE LTRIM(RTRIM(hp.NamHoc)) = ?
      AND hp.HocKy = ?
    GROUP BY
      hp.MaHP, hp.TenHP, hp.SoTinChi, hp.HocKy, hp.NamHoc,
      hp.MaLop, hp.LichHoc, hp.GiangVien, hp.MaGV
    ORDER BY hp.MaHP
  `;

  sql.query(connectionString, q, [namhoc.trim(), Number(hocky)], (err, rows) => {
    if (err) {
      console.error("Lỗi lấy học phần:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }

    res.json(rows);
  });
});

/* ---------- Lấy danh sách học sinh theo học kì, năm học, môn học của admin  ---------- */
app.get("/api/students-by-course/:namhoc/:hocky/:mahp", (req, res) => {
  const { namhoc, hocky, mahp } = req.params;
  if (!mahp || !hocky || !namhoc) {
    return res.status(400).json({ message: "Thiếu thông tin (mahp, hocky, namhoc)" });
  }
  const sp = `EXEC sp_LaySinhVienTheoHocPhan @NamHoc = ?, @HocKy = ?, @MaHP = ? `;
  sql.query(connectionString, sp, [namhoc, hocky, mahp], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    res.json(rows);
  });
});

/* ---------- Lấy các năm học trong cơ sở dữ liệu của admin ---------- */
app.get("/api/academic-years", (req, res) => {

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let currentAcademicYear;

  if (month >= 9) {
    currentAcademicYear = `${year}-${year + 1}`;
  } else {
    currentAcademicYear = `${year - 1}-${year}`;
  }

  const q = `
    SELECT DISTINCT NamHoc
    FROM HOC_PHAN
    WHERE NamHoc = '${currentAcademicYear}'
  `;

  sql.query(connectionString, q, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }

    if (rows.length === 0) {
      return res.json({ message: "Không tìm thấy năm học hiện tại" });
    }

    console.log("Năm học hiện tại:", rows[0].NamHoc);
    res.json(rows);
  });
});


/* ---------- Lấy danh sách học phần tkb của sinh viên theo năm học trong cơ sở dữ liệu của student ---------- */
app.get("/api/tkb/:year/:sem", (req, res) => {
  const year = String(req.params.year);        // CHAR(9)
  const sem = parseInt(req.params.sem);        // INT
  const masv = String(req.session.user?.user);

  const query = "EXEC sp_LayThoiKhoaBieu ?, ?, ?";

  sql.query(connectionString, query, [year, masv, sem], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi server" });
    }

    res.json(rows);
  });
});


/* ---------- Lấy danh sách học khóa học của sinh viên trong cơ sở dữ liệu của student ---------- */
app.get("/api/tkb/year", (req, res) => {
  const q = `
    SELECT KhoaHoc
    FROM SINH_VIEN WHERE MaSV = ?
  `;

  sql.query(connectionString, q, [req.session.user?.user], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    res.json(rows);
  });
});

/* ---------- Lấy danh sách học kỳ của sinh viên theo năm học trong cơ sở dữ liệu của student ---------- */
app.get("/api/tkb/semester/:namhoc", (req, res) => {
  const { namhoc } = req.params;
  const q = `
    SELECT DISTINCT HocKy
    FROM THOI_KHOA_BIEU
    WHERE NamHoc = ? AND MaSV = ?
  `;

  sql.query(connectionString, q, [namhoc, req.session.user?.user], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    res.json(rows);
  });
});

/* ---------- Lấy danh sách học kỳ trong cơ sở dữ liệu cho admin ---------- */
app.get("/api/semesters/:namhoc", (req, res) => {
  const { namhoc } = req.params;

  if (!namhoc) {
    return res.status(400).json({ message: "Thiếu năm học" });
  }

  const query = `
    SELECT DISTINCT HocKy
    FROM HOC_PHAN
    WHERE NamHoc = ?
    ORDER BY HocKy
  `;

  sql.query(connectionString, query, [namhoc], (err, rows) => {
    if (err) {
      console.error("SQL error:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }

    res.json(rows);
  });
});

/* ---------- TEST TÍCH HỢP JAVA CRYPTO ---------- */
app.post("/api/test-prime-index", async (req, res) => {
  const { maKhoa, maLop, mssv } = req.body;

  if (!maKhoa || !maLop || !mssv) {
    return res.status(400).json({ message: "Thiếu thông tin (maKhoa, maLop, mssv)" });
  }

  try {
    // Đẩy dữ liệu sang hàm gọi Java
    const javaResult = await callJavaCalculateIndex({
      maKhoa: maKhoa,
      maLop: maLop,
      mssv: mssv
    });

    // Trả kết quả về cho Postman
    res.json({
      message: "Node.js đã giao tiếp thành công với Java!",
      dataFromJava: javaResult
    });

  } catch (error) {
    console.error("Lỗi khi test integration:", error);
    res.status(500).json({ message: "Lỗi kết nối đến hệ thống mã hóa: " + error.message });
  }
});

/* ---------- 15. Health check ---------- */
app.get("/", (_, res) => res.send("API chạy OK!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy http://localhost:${PORT}`));