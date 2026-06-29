// repositories/account.repo.js
import { db } from "../db/index.js";

/**
 * Ưu tiên USERNAME > Email, trả về 1 bản ghi đầu tiên
 * (vẫn tận dụng index tốt vì tách 2 nhánh rồi UNION ALL)
 */
export async function findAccountByIdentifier(identifier) {
  const [rows] = await db.query(
    `
    (
      SELECT USERNAME, PASSWORD_HASH, ROLE, Email, RELATED_ID
      FROM TAIKHOAN
      WHERE USERNAME = ?
      LIMIT 1
    )
    UNION ALL
    (
      SELECT USERNAME, PASSWORD_HASH, ROLE, Email, RELATED_ID
      FROM TAIKHOAN
      WHERE Email = ?
      LIMIT 1
    )
    LIMIT 1
    `,
    [identifier, identifier]
  );
  return rows[0] || null;
}

export async function getStudentProfileByMaSV(maSV) {
  const [rows] = await db.query(
    `
    SELECT sv.MaSV, sv.HoTen, sv.NgaySinh, sv.GioiTinh, sv.Email,
          sv.MaLop, lop.TenLop,
          khoa.MAKHOA, khoa.TENKHOA,
          IF(p.PING_KEY IS NULL, 0, 1) AS HasPing
    FROM SINH_VIEN sv
    LEFT JOIN LOP  lop  ON sv.MaLop = lop.MALOP
    LEFT JOIN KHOA khoa ON lop.MAKHOA = khoa.MAKHOA
    LEFT JOIN PING p    ON p.MASV = sv.MaSV
    WHERE sv.MaSV = ?
    LIMIT 1
    `,
    [maSV]
  );
  return rows[0] || null;
}
