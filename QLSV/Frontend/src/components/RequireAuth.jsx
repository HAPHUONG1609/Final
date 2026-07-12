import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  clearAuthStorage,
  getRoleHome,
  getCurrentSession,
  normalizeRole,
} from "../utils/auth.js";

export default function RequireAuth({ allowedRoles = [] }) {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    status: "checking",
    role: "",
  });

  const allowedRolesKey = useMemo(
    () => allowedRoles.map(normalizeRole).sort().join("|"),
    [allowedRoles]
  );

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      setAuthState({ status: "checking", role: "" });

      try {
        const data = await getCurrentSession();
        const user = data?.user || {};
        const role = normalizeRole(user.role || user.roleName);

        if (!role) {
          throw new Error("INVALID_SESSION_ROLE");
        }

        localStorage.setItem("role", role);
        localStorage.setItem("username", String(user.username || ""));
        localStorage.setItem(
          "roleCode",
          role === "SINHVIEN" ? "0" : role === "ADMIN" ? "1" : "2"
        );

        const acceptedRoles = allowedRolesKey
          ? allowedRolesKey.split("|")
          : [];

        if (acceptedRoles.length > 0 && !acceptedRoles.includes(role)) {
          if (!cancelled) {
            setAuthState({ status: "forbidden", role });
          }
          return;
        }

        if (!cancelled) {
          setAuthState({ status: "authenticated", role });
        }
      } catch {
        clearAuthStorage();
        if (!cancelled) {
          setAuthState({ status: "unauthenticated", role: "" });
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [allowedRolesKey, location.pathname]);

  if (authState.status === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (authState.status === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (authState.status === "forbidden") {
    return <Navigate to={getRoleHome(authState.role)} replace />;
  }

  return <Outlet />;
}
