import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth() {
  const token = localStorage.getItem("token");
  const loc = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
