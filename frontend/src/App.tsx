import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import HRLayout from "./layouts/HRLayout";
import PortalLayout from "./layouts/PortalLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Unauthorized from "./pages/auth/Unauthorized";
import HRDashboard from "./pages/hr/Dashboard";
import JobList from "./pages/hr/JobList";
import JobDetail from "./pages/hr/JobDetail";
import PortalJobs from "./pages/portal/PortalJobs";
import MyApplications from "./pages/portal/MyApplications";
import JobDetailPortal from "./pages/portal/JobDetailPortal";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import Profile from "./pages/Profile";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to portal */}
        <Route path="/" element={<Navigate to="/portal/jobs" replace />} />

        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* HR Routes */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute requiredRoles={["HR_OFFICER"]}>
              <HRLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HRDashboard />} />
          <Route path="jobs" element={<JobList />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Portal Routes */}
        <Route path="/portal" element={<PortalLayout />}>
          <Route path="jobs" element={<PortalJobs />} />
          <Route path="jobs/:id" element={<JobDetailPortal />} />
          <Route
            path="my-applications"
            element={
              <ProtectedRoute requiredRoles={["CANDIDATE"]}>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute requiredRoles={["CANDIDATE"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="jobs" element={<JobList />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 404 */}
        <Route path="*" element={<div className="min-h-screen flex items-center justify-center">404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
