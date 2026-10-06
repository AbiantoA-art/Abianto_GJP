import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerCandidate, getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = 'gov_job_portal_token';
const USER_STORAGE_KEY = 'gov_job_portal_user';

/**
 * Architectural Security Note: Token Storage Strategy
 * ----------------------------------------------------
 * In this Phase 03 client-side architecture, authentication tokens are stored
 * in browser localStorage with standard Authorization: Bearer <token> headers.
 *
 * Tradeoffs:
 * - Advantage: Complete immunity to Cross-Site Request Forgery (CSRF) without
 *   requiring anti-forgery synchronizer tokens on state-changing API requests.
 *   Enables flexible client-side routing, optimistic UI updates, and decoupled API consumers.
 * - Security Consideration: Tokens in localStorage are accessible to client-side
 *   JavaScript, making them susceptible if a Cross-Site Scripting (XSS) vulnerability
 *   were introduced. This risk is actively mitigated through strict input sanitization,
 *   React DOM escaping, Helmet Content Security Policies, and lack of third-party tracking scripts.
 * - Production Roadmap: For advanced enterprise deployments (Phase 10), this architecture
 *   can be upgraded to an httpOnly, SameSite=Strict cookie for refresh tokens paired with
 *   short-lived in-memory access tokens.
 */

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Synchronize and verify session on initial load
  useEffect(() => {
    let isMounted = true;

    const verifyExistingSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      try {
        const result = await getCurrentUser(storedToken);
        if (isMounted) {
          if (result.success && result.data) {
            setUser(result.data);
            setToken(storedToken);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.data));
          } else {
            // Token is invalid or expired
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
            setUser(null);
            setToken(null);
          }
          setLoading(false);
        }
      } catch (_err) {
        if (isMounted) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
          setToken(null);
          setLoading(false);
        }
      }
    };

    verifyExistingSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user with credentials
   */
  const login = useCallback(async (email, password) => {
    const response = await loginUser({ email, password });

    if (response.success && response.data?.token) {
      const authToken = response.data.token;
      const authUser = response.data.user;

      localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);

      return {
        success: true,
        user: authUser,
        token: authToken,
        message: response.message,
      };
    }

    return {
      success: false,
      message: response.message || 'Invalid credentials.',
      errors: response.errors,
      statusCode: response.statusCode,
    };
  }, []);

  /**
   * Register candidate profile
   */
  const register = useCallback(async (candidateData) => {
    const response = await registerCandidate(candidateData);
    return response;
  }, []);

  /**
   * Log out authenticated user
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
    isCandidate: user?.role === 'candidate',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
