"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Notification,
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from "@/lib/api";
import RouteGuard from "@/components/RouteGuard";
import { useAuth } from "@/lib/auth";
import { usePush } from "@/lib/usePush";
import {
  ApiOffline,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  btnCls,
  btnOutlineCls,
  formatDate,
} from "@/components/ui";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  CircleDot,
  Smartphone,
  AlertCircle,
  TestTube,
  RefreshCw,
  Settings,
} from "lucide-react";

function NotificationsContent() {
  const { isBuyer } = useAuth();
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    loading: pushLoading, 
    error: pushError, 
    requestPermission, 
    subscribe, 
    unsubscribe,
    testNotification,
  } = usePush();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setOffline(false);
    getNotifications()
      .then(setNotifications)
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function handleMarkRead(id: number) {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
    } catch {
      /* ignore */
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.allSettled(unread.map((n) => markNotificationRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleDelete(id: number) {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      /* ignore */
    }
  }

  const handleEnableNotifications = async () => {
    if (!isSupported) return;
    
    if (permission === "default") {
      console.log("🔔 UI: Requesting permission...");
      await requestPermission();
      return;
    }
    
    if (permission === "granted" && !isSubscribed) {
      console.log("🔔 UI: Subscribing to push notifications...");
      await subscribe();
    }
  };

  const handleDisableNotifications = async () => {
    if (isSubscribed) {
      console.log("🔔 UI: Unsubscribing from push notifications...");
      await unsubscribe();
    }
  };

  const handleTestNotification = () => {
    console.log("🔔 UI: Testing notification...");
    testNotification();
  };

  const getStatusInfo = () => {
    if (!isSupported) {
      return {
        status: "Not Supported",
        color: "gray",
        message: "Your browser doesn't support push notifications"
      };
    }
    
    if (permission === "denied") {
      return {
        status: "Blocked", 
        color: "red",
        message: "Notifications are blocked in browser settings"
      };
    }
    
    if (permission === "default") {
      return {
        status: "Not Enabled",
        color: "yellow", 
        message: "Click 'Enable Notifications' to get started"
      };
    }
    
    if (permission === "granted" && isSubscribed) {
      return {
        status: "Active",
        color: "green",
        message: "You'll receive push notifications when new produce is listed"
      };
    }
    
    if (permission === "granted" && !isSubscribed) {
      return {
        status: "Permission Granted",
        color: "blue",
        message: "Click 'Enable Push' to subscribe to notifications"
      };
    }
    
    return {
      status: "Unknown",
      color: "gray",
      message: "Unknown notification state"
    };
  };

  const statusInfo = getStatusInfo();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
            : "All caught up"
        }
      />

      {/* Push Notifications Settings (for buyers only) */}
      {isBuyer && (
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Push Notifications
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Get notified instantly when new produce is listed for sale
                    </p>
                  </div>
                  
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusInfo.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      statusInfo.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {statusInfo.status}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {statusInfo.message}
                </p>
                
                {pushError && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-900/10 dark:border-amber-500/30">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <div className="font-medium">{pushError}</div>
                        
                        {(pushError.includes('browser') || pushError.includes('security')) && (
                          <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                            <strong>Note:</strong> Push notifications are optional. All app features work without them.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {/* Enable/Disable Button */}
                  {permission === "default" && (
                    <button
                      onClick={handleEnableNotifications}
                      disabled={pushLoading}
                      className={`${btnCls} flex items-center gap-2`}
                    >
                      {pushLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      Enable Notifications
                    </button>
                  )}
                  
                  {permission === "granted" && !isSubscribed && (
                    <button
                      onClick={handleEnableNotifications}
                      disabled={pushLoading}
                      className={`${btnCls} flex items-center gap-2`}
                    >
                      {pushLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      Enable Push
                    </button>
                  )}
                  
                  {isSubscribed && (
                    <button
                      onClick={handleDisableNotifications}
                      disabled={pushLoading}
                      className={`${btnOutlineCls} flex items-center gap-2`}
                    >
                      {pushLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                      Disable Push
                    </button>
                  )}
                  
                  {/* Test Button */}
                  {permission === "granted" && (
                    <button
                      onClick={handleTestNotification}
                      className={`${btnOutlineCls} flex items-center gap-2`}
                    >
                      <TestTube className="h-4 w-4" />
                      Test
                    </button>
                  )}
                  
                  {/* Browser Settings Help */}
                  {permission === "denied" && (
                    <button
                      onClick={() => {
                        const userAgent = navigator.userAgent.toLowerCase();
                        let url = "";
                        if (userAgent.includes('chrome')) {
                          url = "chrome://settings/content/notifications";
                        } else if (userAgent.includes('firefox')) {
                          url = "about:preferences#privacy";
                        } else if (userAgent.includes('edge')) {
                          url = "edge://settings/content/notifications";
                        }
                        
                        if (url) {
                          window.open(url, '_blank');
                        } else {
                          alert('Please check your browser notification settings and allow notifications for this site.');
                        }
                      }}
                      className={`${btnOutlineCls} flex items-center gap-2`}
                    >
                      <Settings className="h-4 w-4" />
                      Browser Settings
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {unreadCount > 0 && (
        <div className="mb-5">
          <button
            onClick={handleMarkAllRead}
            className={`${btnOutlineCls} flex items-center gap-2`}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : offline ? (
        <ApiOffline onRetry={load} />
      ) : notifications.length === 0 ? (
        <EmptyState
          message="No notifications yet."
          icon={<BellOff className="h-7 w-7" />}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`flex items-start gap-4 transition-colors ${
                !n.is_read
                  ? "border-green-300 bg-green-50 dark:border-green-700/50 dark:bg-green-950/20"
                  : ""
              }`}
            >
              {/* Icon */}
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  n.is_read
                    ? "bg-gray-100 dark:bg-neutral-800"
                    : "bg-green-100 dark:bg-green-900/50"
                }`}
              >
                {n.is_read ? (
                  <Bell className="h-4 w-4 text-gray-400" />
                ) : (
                  <CircleDot className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      n.is_read
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {n.title}
                  </p>
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(n.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                  {n.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                    aria-label="Mark as read"
                    title="Mark as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RouteGuard>
      <NotificationsContent />
    </RouteGuard>
  );
}
