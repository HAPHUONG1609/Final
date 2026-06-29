import { loginService } from "../services/auth.service.js";
import { setAuthCookie } from "../utils/jwt.js";
import { getStudentProfileByMaSV } from "../repositories/account.repo.js";

export async function login(req, res, next) {
  try {
    const result = await loginService(req.body || {});
    if (!result.ok)
      return res.status(result.status).json({ error: result.error });
    setAuthCookie(res, result.token);
    return res.json({ token: result.token, user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req, res) {
  res.clearCookie("access_token", { path: "/" });
  res.json({ ok: true });
}

export async function me(req, res) {
  res.json({ user: req.user }); // { sub, role, rid }
}

// NEW: /auth/profile/me
export async function getMyProfile(req, res, next) {
  try {
    const { role, rid } = req.user;

    if (role === "SINHVIEN") {
      const sv = await getStudentProfileByMaSV(rid);
      if (!sv) return res.status(404).json({ error: "STUDENT_NOT_FOUND" });
      return res.json({
        role,
        name: sv.HoTen,
        studentId: sv.MaSV,
        className: sv.TenLop || "",
        faculty: sv.TENKHOA || "",
        email: sv.Email || "",
        keyStatus: sv.HasPing ? "Verified" : "Unverified",
      });
    }

    if (role === "ADMIN") {
      return res.json({ role, name: req.user.sub, adminSummary: {} });
    }

    if (role === "GIANGVIEN") {
      return res.json({ role, name: req.user.sub });
    }

    return res.status(400).json({ error: "UNKNOWN_ROLE" });
  } catch (err) {
    next(err);
  }
}

