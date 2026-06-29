import { findAccountByIdentifier } from "../repositories/account.repo.js";
import { verifyPassword } from "../utils/password.js";
import { signJwt } from "../utils/jwt.js";
import { db } from "../db/index.js";

/**
 * Đăng nhập và trả thông tin tuỳ theo ROLE
 * - Nếu là SINHVIEN: lấy thêm thông tin từ bảng SINHVIEN
 * - Nếu là ADMIN: chỉ trả role và username
 */
export async function loginService({ identifier, password }) {
  const id = identifier?.trim() || "";
  const pwd = password?.trim() || "";

  if (!id || !pwd) {
    return { ok: false, status: 400, error: "MISSING_CREDENTIALS" };
  }

  // 1️⃣ Lấy tài khoản theo username/email
  const acc = await findAccountByIdentifier(id);
  if (!acc) {
    return { ok: false, status: 401, error: "INVALID_CREDENTIALS" };
  }

  // 2️⃣ Kiểm tra mật khẩu
  const hash = String(acc.PASSWORD_HASH ?? "").trim();
  const ok = await verifyPassword(pwd, hash);
  if (!ok) {
    return { ok: false, status: 401, error: "INVALID_CREDENTIALS" };
  }

  // 3️⃣ Tạo payload JWT
  const payload = {
    sub: acc.USERNAME,
    role: acc.ROLE,
    rid: acc.RELATED_ID, // MaSV hoặc MaGV tùy role
  };
  const token = signJwt(payload);

  // 4️⃣ Truy vấn thêm nếu là SINHVIEN
  let extraInfo = {};
  if (acc.ROLE === "SINHVIEN" && acc.RELATED_ID) {
    const [rows] = await db.query(
      `SELECT sv.MaSV, sv.HoTen, sv.Email, sv.NgaySinh,
              sv.GioiTinh, sv.MaLop, lop.TenLop, khoa.TENKHOA
      FROM SINH_VIEN sv
      LEFT JOIN LOP lop ON sv.MaLop = lop.MALOP
      LEFT JOIN KHOA khoa ON lop.MAKHOA = khoa.MAKHOA
      WHERE sv.MaSV = ? LIMIT 1`,
      [acc.RELATED_ID]
    );
    if (rows.length) {
      const sv = rows[0];
      extraInfo = {
        name: sv.HoTen,
        studentId: sv.MaSV,
        email: sv.Email,
        className: sv.TenLop,
        faculty: sv.TENKHOA,
      };
    }
  }

  // 5️⃣ Dữ liệu trả về
  const user = {
    username: acc.USERNAME,
    role: acc.ROLE,
    email: acc.Email,
    relatedId: acc.RELATED_ID,
    ...extraInfo,
  };

  return { ok: true, status: 200, token, user };
}
