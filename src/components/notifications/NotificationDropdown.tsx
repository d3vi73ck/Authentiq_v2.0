'use client';

import { useState } from 'react';
import { 
  Check, 
  Clock, 
  MessageSquare, 
  FileText, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/Helpers';
import { Notification } from '@/hooks/useNotifications';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (notificationIds: string[]) => void;
  onMarkAllAsRead: () => void;
  children: React.ReactNode;
}

/**
 * Notification Dropdown Component
 * 
 * Displays a dropdown with recent notifications and actions to mark them as read.
 * Responsive design that works well on both mobile and desktop.
 */
export function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  children
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead([notification.id]);
    }
  };

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission_status_change':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'new_comment':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto"
        sideOffset={8}
      >
        {/* Header */}
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {unreadCount} unread
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Mark all read
              </Button>
            </div>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <DropdownMenuGroup className="p-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex flex-col items-start p-3 cursor-pointer rounded-md',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors duration-150',
                  !notification.read && 'bg-blue-50 dark:bg-blue-950/20'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start w-full gap-3">
                  {/* Notification Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm leading-tight break-words',
                      !notification.read && 'font-medium'
                    )}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {!notification.read && (
                        <Badge variant="outline" className="h-4 px-1 text-[10px]">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Read Status Indicator */}
                  {!notification.read && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}