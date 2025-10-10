'use client';

import { NotificationBell } from './NotificationBell';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * Notification Center Component
 * 
 * Combines the notification bell and dropdown with the notification hook.
 * Provides a complete notification UI that works on both mobile and desktop.
 */
export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <NotificationDropdown
      notifications={notifications}
      unreadCount={unreadCount}
      isLoading={isLoading}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
    >
      <NotificationBell
        unreadCount={unreadCount}
        onClick={() => {}} // Handled by dropdown trigger
        isLoading={isLoading}
      />
    </NotificationDropdown>
  );
}