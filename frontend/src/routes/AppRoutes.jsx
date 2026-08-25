import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Pages
import LoginPage from '../pages/LoginPage.jsx';
import RoleSelectPage from '../pages/RoleSelectPage.jsx';

// 3 Unified Role Dashboards
import DoctorDashboard from '../pages/doctor/DoctorDashboard.jsx';
import NurseDashboard from '../pages/nurse/NurseDashboard.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';

export default function AppRoutes() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/role-select" element={<RoleSelectPage />} />

      {/* 3 Core Role-Based Dashboards */}
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />

      <Route path="/nurse/dashboard" element={<NurseDashboard />} />
      <Route path="/nurse" element={<Navigate to="/nurse/dashboard" replace />} />

      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Legacy Subroute Redirects to New Tab Bar System */}
      {/* Doctor Tabs */}
      <Route path="/doctor/request-resource" element={<Navigate to="/doctor/dashboard?tab=request" replace />} />
      <Route path="/doctor/prescribe" element={<Navigate to="/doctor/dashboard?tab=prescribe" replace />} />
      <Route path="/doctor/escalate" element={<Navigate to="/doctor/dashboard?tab=escalate" replace />} />
      <Route path="/doctor/activity-log" element={<Navigate to="/doctor/dashboard?tab=activity" replace />} />

      {/* Nurse Tabs */}
      <Route path="/nurse/log-event" element={<Navigate to="/nurse/dashboard?tab=log" replace />} />
      <Route path="/nurse/flag-issue" element={<Navigate to="/nurse/dashboard?tab=flag" replace />} />

      {/* Pharmacy Folded into Admin Tabs */}
      <Route path="/pharmacy/dashboard" element={<Navigate to="/admin/dashboard?tab=pharmacy" replace />} />
      <Route path="/pharmacy/dispense" element={<Navigate to="/admin/dashboard?tab=pharmacy" replace />} />
      <Route path="/pharmacy" element={<Navigate to="/admin/dashboard?tab=pharmacy" replace />} />

      {/* Admin Tabs */}
      <Route path="/admin/conflict-feed" element={<Navigate to="/admin/dashboard?tab=conflicts" replace />} />
      <Route path="/admin/saga-tracker" element={<Navigate to="/admin/dashboard?tab=sagas" replace />} />
      <Route path="/admin/audit-trail" element={<Navigate to="/admin/dashboard?tab=audit" replace />} />
      <Route path="/admin/failure-demo" element={<Navigate to="/admin/dashboard?tab=demo" replace />} />
      <Route path="/admin/setup" element={<Navigate to="/admin/dashboard?tab=setup" replace />} />

      {/* Default Catch-all */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              role === 'doctor'
                ? '/doctor/dashboard'
                : role === 'nurse'
                ? '/nurse/dashboard'
                : '/admin/dashboard'
            }
            replace
          />
        }
      />
    </Routes>
  );
}
