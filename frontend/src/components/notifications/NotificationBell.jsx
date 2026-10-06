import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/api';
import NotificationBadge from './NotificationBadge';
import NotificationDropdown from './NotificationDropdown';

export const NotificationBell = () => {
  const { token, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const bellContainerRef = useRef(null);

  // Fetch unread count
  const fetchCount = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    try {
      const res = await getUnreadNotificationCount(token);
      if (res.success) {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [token, isAuthenticated]);

  // Fetch latest notifications for dropdown
  const fetchDropdownNotifications = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getUserNotifications({ page: 1, limit: 6, status: 'active', sort: 'latest' }, token);
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Error fetching dropdown notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  // Initial fetch and interval polling
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    fetchCount();
    const interval = setInterval(fetchCount, 45000); // 45s heartbeat

    return () => clearInterval(interval);
  }, [isAuthenticated, token, fetchCount]);

  // Fetch notifications when opening dropdown
  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchDropdownNotifications();
      fetchCount();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (bellContainerRef.current && !bellContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Mark single as read
  const handleMarkRead = async (id) => {
    try {
      const res = await markNotificationRead(id, token);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsRead(token);
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="gov-notification-bell-container" ref={bellContainerRef}>
      <button
        type="button"
        className={`gov-notification-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        aria-label={isTa ? 'அறிவிப்புகளைக் காண்க' : 'View notifications'}
        aria-expanded={isOpen}
        title={isTa ? 'அறிவிப்புகள்' : 'Notifications'}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        <NotificationBadge count={unreadCount} />
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
