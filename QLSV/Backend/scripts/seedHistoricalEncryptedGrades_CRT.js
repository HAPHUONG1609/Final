/*
  seedHistoricalEncryptedGrades_CRT.js

  Seed điểm lịch sử đã mã hóa CRT cho đồ án QLSV.

  File này phù hợp với DB hiện tại:
  - HOC_PHAN lưu lớp học phần theo NamHoc + HocKy + MaLop.
  - THOI_KHOA_BIEU dùng cột HOCKY.
  - DIEM_CRT có thể chỉ có khóa MASV + MAHP hoặc có thêm NamHoc/HocKy/HOCKY tùy bản SQL.
  - Không insert điểm rõ GK/CK/TB vào DB.
  - Vẫn giữ flow CRT cũ: sinh điểm -> tính startIndex từ sharedSecret -> lấy 3 SNT -> CRT -> lưu C vào DIEM_CRT.

  Lệnh chạy nhanh cho demo:
    cd QLSV/Backend
    node scripts/seedHistoricalEncryptedGrades_CRT.js --students=SV001,SV920 --concurrency=20
    node scripts/seedHistoricalEncryptedGrades_CRT.js --class=CNTT01 --concurrency=30
    node scripts/seedHistoricalEncryptedGrades_CRT.js --year=2023-2024 --semester=2 --limit=500 --concurrency=20

  Seed toàn bộ điểm lịch sử:
    node scripts/seedHistoricalEncryptedGrades_CRT.js --all --concurrency=30

  Mặc định KHÔNG seed 2025-2026 HK2 để giảng viên nhập điểm hiện tại qua UI.
  Nếu muốn seed cả học kỳ hiện tại:
    node scripts/seedHistoricalEncryptedGrades_CRT.js --include-current=true

  Nếu muốn seed lại điểm đã có:
    node scripts/seedHistoricalEncryptedGrades_CRT.js --students=SV001 --force=true
*/

const sql = require("msnodesqlv8");
const crypto = require("crypto");

const connectionString =
  process.env.DB_CONNECTION_STRING ||
  "Server=localhost\\SQLEXPRESS;" +
    "Database=QLSV_AT;" +
    "Trusted_Connection=Yes;" +
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Encrypt=no;TrustServerCertificate=yes;";

// Phải trùng với GradeCrtService.java.
const P = BigInt(
  "0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF"
);

const N = 5_000_000n;
const NUMBER_OF_GRADES = 3n;
const MAX_SCORE_X10 = 100n;
const VERSION = "CRT_V1";

function getArg(name, defaultValue = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : defaultValue;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function parseBoolArg(name, defaultValue = false) {
  const raw = getArg(name, String(defaultValue));
  return raw.toLowerCase() === "true" || raw === "1" || hasFlag(name);
}

const STUDENTS_ARG = getArg("students");
const CLASS_ARG = getArg("class");
const YEAR_ARG = getArg("year");
const SEMESTER_ARG = getArg("semester");
const LIMIT = Number(getArg("limit", process.env.MAX_SEED_ROWS || "0"));
const CONCURRENCY = Math.max(
  1,
  Number(getArg("concurrency", process.env.SEED_CONCURRENCY || "20"))
);
const INCLUDE_CURRENT_TERM = parseBoolArg(
  "include-current",
  String(process.env.SEED_INCLUDE_CURRENT_TERM || "false").toLowerCase() === "true"
);
const FORCE = parseBoolArg("force", false);
const DRY_RUN = parseBoolArg("dry-run", false);
const TEACHER_PIN = getArg("teacher-pin", process.env.SEED_TEACHER_PIN || "123456");

const FILTER_STUDENTS = STUDENTS_ARG
  ? STUDENTS_ARG.split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
  : [];

function queryAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function columnExists(tableName, columnName) {
  const rows = await queryAsync(
    `
      SELECT 1 AS ok
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [tableName, columnName]
  );

  return rows.length > 0;
}

async function getMetadata() {
  return {
    svHasKhoa: await columnExists("SINH_VIEN", "Khoa"),
    hpHasMaKhoa: await columnExists("HOC_PHAN", "MaKhoa"),
    diemHasStartIndex: await columnExists("DIEM_CRT", "START_INDEX"),
    diemHasEndIndex: await columnExists("DIEM_CRT", "END_INDEX"),
    diemHasNamHoc: await columnExists("DIEM_CRT", "NamHoc"),
    diemHasHocKy: await columnExists("DIEM_CRT", "HocKy"),
    diemHasHocky: await columnExists("DIEM_CRT", "HOCKY"),
    diemHasUpdatedAt: await columnExists("DIEM_CRT", "UPDATED_AT"),
  };
}

function modPow(base, exp, mod) {
  let result = 1n;
  base %= mod;

  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }

  return result;
}

function egcd(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = egcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

function modInv(a, m) {
  const [g, x] = egcd((a % m + m) % m, m);
  if (g !== 1n) throw new Error("Không có nghịch đảo modular");
  return (x % m + m) % m;
}

function sha256BigInt(text) {
  const hex = crypto.createHash("sha256").update(text, "utf8").digest("hex");
  return BigInt(`0x${hex}`);
}

function cleanText(value) {
  return String(value || "").trim();
}

function calcStartIndex(maKhoa, maLop, mssv, maHp, studentPublicKey, teacherPin) {
  const publicKeyClean = cleanText(studentPublicKey);
  const pinClean = cleanText(teacherPin);

  if (!publicKeyClean) throw new Error("Sinh viên chưa có PUBLIC_KEY");
  if (!/^\d+$/.test(pinClean)) throw new Error("PIN giảng viên seed phải là số");

  // Đây là sharedSecret lúc mã hóa: PUBLIC_KEY sinh viên ^ PIN giảng viên mod P.
  const sharedSecret = modPow(BigInt(publicKeyClean), BigInt(pinClean), P).toString();
  const safeRange = N - MAX_SCORE_X10 - NUMBER_OF_GRADES + 1n;

  const seed = [
    cleanText(maKhoa),
    cleanText(maLop),
    cleanText(mssv).toLowerCase(),
    cleanText(maHp).toUpperCase(),
    VERSION,
    sharedSecret.trim(),
  ].join("|");

  const k = sha256BigInt(seed) % safeRange;
  return Number(k + MAX_SCORE_X10);
}

function crtEncrypt(values, primes) {
  const p = primes.map((item) => BigInt(cleanText(item)));
  const a = values.map((item) => BigInt(item));

  const M = p.reduce((acc, cur) => acc * cur, 1n);
  let C = 0n;

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] < 0n || a[i] >= p[i]) {
      throw new Error(`Điểm ${a[i].toString()} không hợp lệ với prime ${p[i].toString()}`);
    }

    const Mi = M / p[i];
    const yi = modInv(Mi % p[i], p[i]);
    C += a[i] * Mi * yi;
  }

  return (C % M + M) % M;
}

function deterministicGrades(mssv, maHp, namHoc, hocKy) {
  // Điểm giả lập ổn định, không random theo thời gian.
  // Giá trị lưu trong CRT là điểm x10: 8.5 -> 85.
  const hash = Number(sha256BigInt(`${mssv}|${maHp}|${namHoc}|${hocKy}`) % 56n);

  const gk = 4.0 + ((hash % 55) / 10);       // 4.0 .. 9.4
  const ck = 4.2 + (((hash * 7) % 55) / 10); // 4.2 .. 9.6
  const tb = Math.round((gk * 0.4 + ck * 0.6) * 10) / 10;

  return [Math.round(gk * 10), Math.round(ck * 10), Math.round(tb * 10)];
}

function buildMaKhoaExpression(metadata) {
  const parts = [];

  if (metadata.svHasKhoa) parts.push("NULLIF(LTRIM(RTRIM(sv.Khoa)), '')");
  if (metadata.hpHasMaKhoa) parts.push("NULLIF(LTRIM(RTRIM(hp.MaKhoa)), '')");

  parts.push("NULLIF(LTRIM(RTRIM(l.MAKHOA)), '')");

  return `COALESCE(${parts.join(", ")}, 'CNTT')`;
}

async function loadTargetRows(metadata) {
  const whereParts = ["CAST(LEFT(tkb.NamHoc, 4) AS INT) BETWEEN 2022 AND 2025"];
  const params = [];

  // Giữ đúng flow đồ án: HK2 năm hiện tại để giảng viên nhập/import qua UI.
  if (!INCLUDE_CURRENT_TERM) {
    whereParts.push("NOT (LTRIM(RTRIM(tkb.NamHoc)) = '2025-2026' AND tkb.HOCKY = 2)");
  }

  if (FILTER_STUDENTS.length > 0) {
    const placeholders = FILTER_STUDENTS.map(() => "?").join(",");
    whereParts.push(`UPPER(LTRIM(RTRIM(tkb.MASV))) IN (${placeholders})`);
    params.push(...FILTER_STUDENTS);
  }

  if (CLASS_ARG) {
    whereParts.push("UPPER(LTRIM(RTRIM(sv.MaLop))) = UPPER(?)");
    params.push(CLASS_ARG.trim());
  }

  if (YEAR_ARG) {
    whereParts.push("LTRIM(RTRIM(tkb.NamHoc)) = ?");
    params.push(YEAR_ARG.trim());
  }

  if (SEMESTER_ARG) {
    whereParts.push("tkb.HOCKY = ?");
    params.push(Number(SEMESTER_ARG));
  }

  const maKhoaExpr = buildMaKhoaExpression(metadata);

  let rows = await queryAsync(
    `
      SELECT DISTINCT
        -- SQL Server yêu cầu ORDER BY phải dùng cột/alias nằm trong SELECT khi có DISTINCT.
        LTRIM(RTRIM(tkb.MASV)) AS MASV,
        LTRIM(RTRIM(tkb.MAHP)) AS MAHP,
        LTRIM(RTRIM(tkb.NamHoc)) AS NamHoc,
        tkb.HOCKY AS HocKy,
        LTRIM(RTRIM(COALESCE(hp.MaLop, tkb.MaLop, sv.MaLop))) AS MaLop,
        LTRIM(RTRIM(${maKhoaExpr})) AS MaKhoa,
        sv.PUBLIC_KEY AS SvPublicKey,
        LTRIM(RTRIM(hp.MaGV)) AS MaGV,
        hp.TenHP AS TenHP
      FROM dbo.THOI_KHOA_BIEU tkb
      INNER JOIN dbo.SINH_VIEN sv
        ON UPPER(LTRIM(RTRIM(sv.MaSV))) = UPPER(LTRIM(RTRIM(tkb.MASV)))
      LEFT JOIN dbo.LOP l
        ON LTRIM(RTRIM(l.MaLop)) = LTRIM(RTRIM(sv.MaLop))
      INNER JOIN dbo.HOC_PHAN hp
        ON LTRIM(RTRIM(hp.MAHP)) = LTRIM(RTRIM(tkb.MAHP))
       AND hp.HocKy = tkb.HOCKY
       AND LTRIM(RTRIM(hp.NamHoc)) = LTRIM(RTRIM(tkb.NamHoc))
      WHERE ${whereParts.join(" AND ")}
      ORDER BY NamHoc, HocKy, MAHP, MASV
    `,
    params
  );

  if (LIMIT > 0) rows = rows.slice(0, LIMIT);
  return rows;
}

function buildGradeWhere(row, metadata) {
  const whereParts = ["LTRIM(RTRIM(MASV)) = ?", "LTRIM(RTRIM(MAHP)) = ?"];
  const params = [row.MASV, row.MAHP];

  // Nếu DIEM_CRT có NamHoc/HocKy thì kiểm tra đủ theo học kỳ.
  // Nếu không có, giữ đúng schema cũ MASV+MAHP.
  if (metadata.diemHasNamHoc) {
    whereParts.push("LTRIM(RTRIM(NamHoc)) = ?");
    params.push(row.NamHoc);
  }

  if (metadata.diemHasHocKy) {
    whereParts.push("HocKy = ?");
    params.push(Number(row.HocKy));
  } else if (metadata.diemHasHocky) {
    whereParts.push("HOCKY = ?");
    params.push(Number(row.HocKy));
  }

  return { whereSql: whereParts.join(" AND "), params };
}

async function gradeExists(row, metadata) {
  const { whereSql, params } = buildGradeWhere(row, metadata);

  const rows = await queryAsync(
    `SELECT TOP 1 1 AS ok FROM dbo.DIEM_CRT WHERE ${whereSql}`,
    params
  );

  return rows.length > 0;
}

async function deleteExistingGrade(row, metadata) {
  const { whereSql, params } = buildGradeWhere(row, metadata);
  await queryAsync(`DELETE FROM dbo.DIEM_CRT WHERE ${whereSql}`, params);
}

async function insertGrade(row, cValue, startIndex, endIndex, metadata) {
  const columns = ["MASV", "MAHP", "MAGV", "C"];
  const values = [row.MASV, row.MAHP, row.MaGV, cValue];

  if (metadata.diemHasStartIndex) {
    columns.push("START_INDEX");
    values.push(startIndex);
  }

  if (metadata.diemHasEndIndex) {
    columns.push("END_INDEX");
    values.push(endIndex);
  }

  if (metadata.diemHasNamHoc) {
    columns.push("NamHoc");
    values.push(row.NamHoc);
  }

  if (metadata.diemHasHocKy) {
    columns.push("HocKy");
    values.push(Number(row.HocKy));
  } else if (metadata.diemHasHocky) {
    columns.push("HOCKY");
    values.push(Number(row.HocKy));
  }

  if (metadata.diemHasUpdatedAt) {
    columns.push("UPDATED_AT");
    values.push(new Date());
  }

  const placeholders = columns.map(() => "?").join(", ");

  await queryAsync(
    `INSERT INTO dbo.DIEM_CRT (${columns.join(", ")}) VALUES (${placeholders})`,
    values
  );
}

async function processOne(row, metadata) {
  if (!row.MASV || !row.MAHP) throw new Error("Thiếu MASV hoặc MAHP");
  if (!row.MaGV) throw new Error("Học phần chưa có MaGV");

  const exists = await gradeExists(row, metadata);

  if (exists && !FORCE) return "skipped";

  if (exists && FORCE && !DRY_RUN) {
    await deleteExistingGrade(row, metadata);
  }

  const startIndex = calcStartIndex(
    row.MaKhoa,
    row.MaLop,
    row.MASV,
    row.MAHP,
    row.SvPublicKey,
    TEACHER_PIN
  );
  const endIndex = startIndex + 2;

  const primeRows = await queryAsync(
    `SELECT Primes FROM dbo.SNT WHERE Id BETWEEN ? AND ? ORDER BY Id`,
    [startIndex, endIndex]
  );

  if (primeRows.length !== 3) {
    throw new Error(
      `Không lấy đủ 3 số nguyên tố, startIndex=${startIndex}, endIndex=${endIndex}`
    );
  }

  const values = deterministicGrades(row.MASV, row.MAHP, row.NamHoc, row.HocKy);
  const cValue = crtEncrypt(values, primeRows.map((item) => item.Primes)).toString();

  if (DRY_RUN) return "dry-run";

  await insertGrade(row, cValue, startIndex, endIndex, metadata);
  return "inserted";
}

async function runWithConcurrency(items, concurrency, worker) {
  let index = 0;
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  let dryRun = 0;

  async function runner() {
    while (true) {
      const currentIndex = index;
      index += 1;

      if (currentIndex >= items.length) break;

      const item = items[currentIndex];

      try {
        const status = await worker(item, currentIndex);

        if (status === "inserted") inserted += 1;
        else if (status === "skipped") skipped += 1;
        else if (status === "dry-run") dryRun += 1;

        const done = inserted + skipped + failed + dryRun;
        if (done % 200 === 0 || done === items.length) {
          console.log(
            `Tiến độ ${done}/${items.length} | inserted=${inserted} | skipped=${skipped} | failed=${failed} | dryRun=${dryRun}`
          );
        }
      } catch (err) {
        failed += 1;
        console.error(
          `Lỗi seed ${item.MASV}-${item.MAHP}-${item.NamHoc}-HK${item.HocKy}: ${err.message}`
        );
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runner()));

  return { inserted, skipped, failed, dryRun };
}

async function printQuickStats(metadata) {
  const totalRows = await queryAsync(`SELECT COUNT(*) AS total FROM dbo.THOI_KHOA_BIEU`);
  const targetRows = await loadTargetRows(metadata);

  console.log(`Tổng dòng THOI_KHOA_BIEU: ${totalRows[0]?.total ?? 0}`);
  console.log(`Dòng đủ điều kiện seed theo bộ lọc hiện tại: ${targetRows.length}`);
}

async function main() {
  console.log("=== Seed điểm lịch sử mã hóa CRT ===");
  console.log(`students=${STUDENTS_ARG || "ALL"}`);
  console.log(`class=${CLASS_ARG || "ALL"}`);
  console.log(`year=${YEAR_ARG || "ALL"}`);
  console.log(`semester=${SEMESTER_ARG || "ALL"}`);
  console.log(`limit=${LIMIT || "NO LIMIT"}`);
  console.log(`concurrency=${CONCURRENCY}`);
  console.log(`includeCurrentTerm=${INCLUDE_CURRENT_TERM}`);
  console.log(`force=${FORCE}`);
  console.log(`dryRun=${DRY_RUN}`);
  console.log(`teacherPin=${TEACHER_PIN ? "***" : "EMPTY"}`);

  const metadata = await getMetadata();
  console.log("Schema DIEM_CRT:", {
    START_INDEX: metadata.diemHasStartIndex,
    END_INDEX: metadata.diemHasEndIndex,
    NamHoc: metadata.diemHasNamHoc,
    HocKy: metadata.diemHasHocKy,
    HOCKY: metadata.diemHasHocky,
  });

  await printQuickStats(metadata);

  const rows = await loadTargetRows(metadata);

  if (rows.length === 0) {
    console.log("Không có dữ liệu cần seed.");
    return;
  }

  const result = await runWithConcurrency(rows, CONCURRENCY, (row) => processOne(row, metadata));

  console.log("=== Hoàn tất seed điểm CRT ===");
  console.log(result);
  console.log("Mặc định đã bỏ qua 2025-2026 HK2 để giảng viên nhập/import điểm hiện tại qua UI.");

  if (result.failed > 0) {
    console.log("Có dòng lỗi. Hãy kiểm tra SNT đủ 5.000.000 dòng và sinh viên/giảng viên đã có PUBLIC_KEY.");
  }
}

main().catch((err) => {
  console.error("Lỗi seed điểm lịch sử CRT:", err);
  process.exit(1);
});
