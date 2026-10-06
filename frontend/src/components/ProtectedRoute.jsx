import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route Guard Component
 * Protects pages from unauthenticated access and enforces role-based restrictions.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {('admin'|'candidate')} [props.requiredRole]
 */
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // 1. Render sleek loading indicator while session token is verified
  if (loading) {
    return (
      <div className="auth-guard-loading" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-spinner-portal" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color, #e2e8f0)', borderTopColor: 'var(--brand-primary, #0f4c81)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.95rem', fontWeight: 500 }}>
          Verifying security clearance & credentials...
        </p>
      </div>
    );
  }

  // 2. Redirect unauthenticated users to Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Enforce strict role authorization
  if (requiredRole && user?.role !== requiredRole) {
    // If a candidate attempts to access admin dashboard
    if (user?.role === 'candidate' && requiredRole === 'admin') {
      return <Navigate to="/candidate/dashboard" replace />;
    }

    // If an official admin attempts to access candidate dashboard
    if (user?.role === 'admin' && requiredRole === 'candidate') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
