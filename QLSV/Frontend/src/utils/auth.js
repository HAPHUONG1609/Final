export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export function normalizeRole(value) {
  const role = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[Đđ]/g, "D")
    .toUpperCase()
    .replace(/[\s_-]+/g, "");

  if (role === "ADMIN" || role === "1") return "ADMIN";

  if (
    role === "GIANGVIEN" ||
    role === "GIẢNGVIÊN" ||
    role === "GIANG VIEN" ||
    role === "GV"
  ) {
    return "GIANGVIEN";
  }

  if (
    role === "SINHVIEN" ||
    role === "SINH VIÊN" ||
    role === "STUDENT" ||
    role === "SV" ||
    role === "0"
  ) {
    return "SINHVIEN";
  }

  return role;
}

export function getRoleHome(roleValue) {
  const role = normalizeRole(roleValue);
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "GIANGVIEN") return "/teacher/dashboard";
  if (role === "SINHVIEN") return "/student/dashboard";
  return "/login";
}

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("roleCode");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
}

export async function getCurrentSession() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = new Error("UNAUTHENTICATED");
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function logoutSession() {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("LOGOUT_FAILED");
  }

  clearAuthStorage();
  return response.json();
}
