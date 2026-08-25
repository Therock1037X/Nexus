import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Pages
import LoginPage from '../pages/LoginPage.jsx';
import RoleSelectPage from '../pages/RoleSelectPage.jsx';

// Doctor Pages
import DoctorDashboard from '../pages/doctor/DoctorDashboard.jsx';
import RequestResourcePage from '../pages/doctor/RequestResourcePage.jsx';
import PrescribePage from '../pages/doctor/PrescribePage.jsx';
import EscalatePage from '../pages/doctor/EscalatePage.jsx';
import DoctorActivityLogPage from '../pages/doctor/DoctorActivityLogPage.jsx';

// Nurse Pages
import NurseDashboard from '../pages/nurse/NurseDashboard.jsx';
import LogEventPage from '../pages/nurse/LogEventPage.jsx';
import FlagIssuePage from '../pages/nurse/FlagIssuePage.jsx';

// Pharmacy Pages
import PharmacyDashboard from '../pages/pharmacy/PharmacyDashboard.jsx';
import DispensePage from '../pages/pharmacy/DispensePage.jsx';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import ConflictFeedPage from '../pages/admin/ConflictFeedPage.jsx';
import SagaTrackerPage from '../pages/admin/SagaTrackerPage.jsx';
import AuditTrailPage from '../pages/admin/AuditTrailPage.jsx';
import FailureDemoPage from '../pages/admin/FailureDemoPage.jsx';
import AdminSetupPage from '../pages/admin/AdminSetupPage.jsx';

export default function AppRoutes() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/role-select" element={<RoleSelectPage />} />

      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/doctor/request-resource" element={<RequestResourcePage />} />
      <Route path="/doctor/prescribe" element={<PrescribePage />} />
      <Route path="/doctor/escalate" element={<EscalatePage />} />
      <Route path="/doctor/activity-log" element={<DoctorActivityLogPage />} />

      {/* Nurse Routes */}
      <Route path="/nurse/dashboard" element={<NurseDashboard />} />
      <Route path="/nurse/log-event" element={<LogEventPage />} />
      <Route path="/nurse/flag-issue" element={<FlagIssuePage />} />

      {/* Pharmacy Routes */}
      <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
      <Route path="/pharmacy/dispense" element={<DispensePage />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/conflict-feed" element={<ConflictFeedPage />} />
      <Route path="/admin/saga-tracker" element={<SagaTrackerPage />} />
      <Route path="/admin/audit-trail" element={<AuditTrailPage />} />
      <Route path="/admin/failure-demo" element={<FailureDemoPage />} />
      <Route path="/admin/setup" element={<AdminSetupPage />} />

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
                : role === 'pharmacy'
                ? '/pharmacy/dashboard'
                : '/admin/dashboard'
            }
            replace
          />
        }
      />
    </Routes>
  );
}
