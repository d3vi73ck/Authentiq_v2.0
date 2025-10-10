'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/Helpers';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
  isLoading?: boolean;
}

/**
 * Notification Bell Component
 * 
 * Displays a bell icon with a badge showing the number of unread notifications.
 * Responsive design that works well on both mobile and desktop.
 */
export function NotificationBell({ 
  unreadCount, 
  onClick, 
  className,
  isLoading = false 
}: NotificationBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'relative p-2 h-9 w-9 rounded-full transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      disabled={isLoading}
      aria-label={`${hasUnread ? `${unreadCount} unread notifications` : 'Notifications'}`}
    >
      <Bell className="h-4 w-4" />
      
      {/* Unread notification badge */}
      {hasUnread && (
        <Badge
          variant="destructive"
          className={cn(
            'absolute -top-1 -right-1 min-w-5 h-5 px-1 text-xs font-medium',
            'flex items-center justify-center rounded-full',
            'animate-pulse transition-all duration-300',
            unreadCount > 99 ? 'px-1.5' : 'px-1'
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </Button>
  );
}