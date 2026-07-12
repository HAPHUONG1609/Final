import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import Login from "./Pages/Login/Login.jsx";

// Student pages
import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import Academic from "./Pages/Academic/Academic.jsx";
import PersonalInfo from "./Pages/PersonalInfo/PersonalInfo.jsx";
import EncryptionKey from "./Pages/MyEncryptionKey/MEK.jsx";
import StudentSidebar from "./components/StudentSidebar/StudentSidebar.jsx";

// Error pages
import NotFoundPage from "./Pages/Error/NotFoundPage.jsx";
import GeneralErrorPage from "./Pages/Error/GeneralErrorPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";

// Admin pages
import AdminSidebar from "./components/AdminSidebar/AdminSidebar.jsx";
import AdminDashboard from "./Pages/Admin/AdminDashboard.jsx";
import ManagementKey from "./Pages/Admin/ManagementKey.jsx";
import ManageStudentInformation from "./Pages/Admin/ManageStudentInformation.jsx";
import ManageGrades from "./Pages/Admin/ManageGrades.jsx";
import AdminEncryptionKey from "./Pages/Admin/EncryptionKey.jsx";

// Teacher layout
import TeacherSidebar from "./components/TeacherSidebar/TeacherSidebar.jsx";

function RequireRole({ allowedRoleCodes }) {
  const roleCode = localStorage.getItem("roleCode");

  if (roleCode === null) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoleCodes.map(String).includes(String(roleCode))) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* STUDENT */}
          <Route path="/student" element={<StudentSidebar />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="academic" element={<Academic />} />
            <Route path="personal-info" element={<PersonalInfo />} />
            <Route path="encryption-key" element={<EncryptionKey />} />
          </Route>

          {/* ADMIN */}
          <Route element={<RequireRole allowedRoleCodes={[1]} />}>
            <Route path="/admin" element={<AdminSidebar />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="management-key" element={<ManagementKey />} />
              <Route path="students" element={<ManageStudentInformation />} />
            </Route>
          </Route>

          {/* TEACHER */}
          <Route element={<RequireRole allowedRoleCodes={[0]} />}>
            <Route path="/teacher" element={<TeacherSidebar />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="grades" element={<ManageGrades />} />
              <Route path="encryption-key" element={<AdminEncryptionKey />} />
            </Route>
          </Route>

          <Route path="/error" element={<GeneralErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
