import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./Pages/Login/Login.jsx";

// Student pages
import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import Academic from "./Pages/Academic/Academic.jsx";
import PersonalInfo from "./Pages/PersonalInfo/PersonalInfo.jsx";
import EncryptionKey from "./Pages/MyEncryptionKey/MEK.jsx";
import StudentSidebar from "./components/StudentSidebar/StudentSidebar.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

// Error pages
import NotFoundPage from "./Pages/Error/NotFoundPage.jsx";
import GeneralErrorPage from "./Pages/Error/GeneralErrorPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";

// Admin/teacher pages
import AdminSidebar from "./components/AdminSidebar/AdminSidebar.jsx";
import AdminDashboard from "./Pages/Admin/AdminDashboard.jsx";
import ManagementKey from "./Pages/Admin/ManagementKey.jsx";
import ManageStudentInformation from "./Pages/Admin/ManageStudentInformation.jsx";
import ManageGrades from "./Pages/Admin/ManageGrades.jsx";
import AdminEncryptionKey from "./Pages/Admin/EncryptionKey.jsx";

// Teacher layout
import TeacherSidebar from "./components/TeacherSidebar/TeacherSidebar.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ===== PUBLIC LOGIN ===== */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* ===== STUDENT: bắt buộc còn session SINHVIEN ===== */}
          <Route element={<RequireAuth allowedRoles={["SINHVIEN"]} />}>
            <Route path="/student" element={<StudentSidebar />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="academic" element={<Academic />} />
              <Route path="personal-info" element={<PersonalInfo />} />
              <Route path="encryption-key" element={<EncryptionKey />} />
            </Route>
          </Route>

          {/* ===== ADMIN + GIẢNG VIÊN: bắt buộc còn session phù hợp ===== */}
          <Route element={<RequireAuth allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminSidebar />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="management-key" element={<ManagementKey />} />
              <Route path="students" element={<ManageStudentInformation />} />
              <Route path="grades" element={<ManageGrades />} />
              <Route path="logs" element={<AdminEncryptionKey />} />
            </Route>
          </Route>

          <Route element={<RequireAuth allowedRoles={["GIANGVIEN"]} />}>
            <Route path="/teacher" element={<TeacherSidebar />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Navigate to="../grades" replace />} />
              <Route path="grades" element={<ManageGrades />} />
              <Route path="encryption-key" element={<AdminEncryptionKey />} />
            </Route>
          </Route>

          {/* ===== ERROR PAGES ===== */}
          <Route path="/error" element={<GeneralErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
