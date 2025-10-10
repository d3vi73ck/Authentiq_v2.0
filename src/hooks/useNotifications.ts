'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing notifications with SSE support
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/notifications?limit=20');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // SSE connection for real-time notifications
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/notifications/stream');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'notification') {
              // Add new notification to the list
              setNotifications(prev => [data.data, ...prev]);
              setUnreadCount(prev => prev + 1);
            } else if (data.type === 'heartbeat') {
              // Keep connection alive
              console.debug('SSE heartbeat received');
            }
          } catch (err) {
            console.error('Error parsing SSE message:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE connection error:', err);
          eventSource?.close();
          
          // Attempt to reconnect after delay
          setTimeout(connectSSE, 5000);
        };

        eventSource.onopen = () => {
          console.debug('SSE connection established');
        };
      } catch (err) {
        console.error('Failed to establish SSE connection:', err);
      }
    };

    // Connect to SSE
    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}