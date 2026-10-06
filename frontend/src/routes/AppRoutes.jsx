import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Jobs } from '../pages/Jobs';
import { JobDetails } from '../pages/JobDetails';
import { StudyMaterials } from '../pages/StudyMaterials';
import { Syllabus } from '../pages/Syllabus';
import { MaterialDetails } from '../pages/MaterialDetails';
import { AdminMaterials } from '../pages/AdminMaterials';
import { About } from '../pages/About';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { CandidateDashboard } from '../pages/CandidateDashboard';
import { AdminDashboard } from '../pages/AdminDashboard';
import { InitializationPage } from '../pages/InitializationPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ApplyJob } from '../pages/ApplyJob';
import { MyApplications } from '../pages/MyApplications';
import { ApplicationDetails } from '../pages/ApplicationDetails';
import { AdminApplications } from '../pages/AdminApplications';
import { Notifications } from '../pages/Notifications';
import { AdminNotifications } from '../pages/AdminNotifications';

/**
 * Phase 09 Frontend Routes
 * Incorporates In-App Notifications & Alerts System.
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Public Portal Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetails />} />
      <Route path="/study-materials" element={<StudyMaterials />} />
      <Route path="/materials" element={<StudyMaterials />} />
      <Route path="/study-materials/:id" element={<MaterialDetails />} />
      <Route path="/syllabus" element={<Syllabus />} />
      <Route path="/about" element={<About />} />

      {/* 2. Authentication Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 3. Candidate Application Engine (Phase 07) */}
      <Route
        path="/jobs/:id/apply"
        element={
          <ProtectedRoute requiredRole="candidate">
            <ApplyJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-applications"
        element={
          <ProtectedRoute requiredRole="candidate">
            <MyApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications/:id"
        element={
          <ProtectedRoute requiredRole="candidate">
            <ApplicationDetails />
          </ProtectedRoute>
        }
      />

      {/* 4. Protected Dashboard Pages */}
      <Route
        path="/candidate/dashboard"
        element={
          <ProtectedRoute requiredRole="candidate">
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/materials"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminNotifications />
          </ProtectedRoute>
        }
      />

      {/* 5. Candidate Notification Center (Phase 09) */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* 6. Phase 01 Diagnostic Screen */}
      <Route path="/initialization" element={<InitializationPage />} />

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
