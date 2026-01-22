  import { Bell, X } from 'lucide-react';
  import { Button } from '@/components/ui/button';
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from '@/components/ui/popover';
  import { Badge } from '@/components/ui/badge';
  import { ScrollArea } from '@/components/ui/scroll-area';
  import { Separator } from '@/components/ui/separator';
  import { useNotifications } from '@/hooks/useNotifications';
  import { formatDistanceToNow } from 'date-fns';
  import { useState } from 'react';

  export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const handleNotificationClick = async (notificationId: string) => {
      await markAsRead(notificationId);
    };

    const handleMarkAllRead = async () => {
      await markAllAsRead();
    };

    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'record_update':
          return '📝';
        case 'comment':
          return '💬';
        case 'need_help':
          return '🆘';
        case 'day_plan_update':
          return '📅';
        default:
          return '📢';
      }
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                data-testid="badge-notification-count"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" data-testid="popover-notifications">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-xs"
                  data-testid="button-mark-all-read"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-notifications"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground" data-testid="text-no-notifications">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                      data-testid={`notification-item-${notification.id}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-lg" data-testid={`notification-icon-${notification.type}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground break-words">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {notification.createdByName}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" data-testid="indicator-unread" />
                        )}
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  }