export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export function normalizeRole(value) {
  const role = String(value || "").trim().toUpperCase();

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
