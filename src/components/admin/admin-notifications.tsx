"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Bell, X, CheckCircle2, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export function AdminNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch("/api/admin/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "WAITLIST_JOINED":
        return <Users className="text-primary h-5 w-5" />;
      case "COURSE_PUBLISHED":
        return <BookOpen className="text-success h-5 w-5" />;
      default:
        return <Bell className="text-primary h-5 w-5" />;
    }
  };

  if (isLoading) {
    return null;
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="text-primary h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-4 text-center text-sm">No notifications yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="text-primary h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                {unreadCount}
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-border max-h-96 divide-y overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`hover:bg-muted/50 cursor-pointer p-4 transition-colors ${
                !notification.read ? "bg-primary/5" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-foreground text-sm font-semibold">
                        {notification.title}
                      </h4>
                      <p className="text-muted-foreground mt-1 text-sm">{notification.message}</p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
