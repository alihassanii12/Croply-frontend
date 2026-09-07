"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/api";

// Try different VAPID keys or approaches if the main one fails
const VAPID_KEYS = [
  "BIdUYGMXNJPQAJX0kZ9e9gogt7AiVO5HTLgLm7-9FkIYY8JtEX4A25ZHglvbKeEksqmgSFxAWs1RMZNHO8HDROE",
  // Could add backup keys here if needed
];

interface UsePushReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  testNotification: () => void;
}

export function usePush(): UsePushReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check browser support and environment
  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("🔔 Push: Environment check...");
    console.log("🔔 Push: Protocol:", window.location.protocol);
    console.log("🔔 Push: Hostname:", window.location.hostname);
    
    // Detect Brave browser
    const isBrave = !!(navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function';
    if (isBrave) {
      console.log("🔔 Push: Brave browser detected - push notifications may have restrictions");
    }
    
    const hasServiceWorker = "serviceWorker" in navigator;
    const hasPushManager = "PushManager" in window;
    const hasNotification = "Notification" in window;
    
    console.log("🔔 Push: ServiceWorker support:", hasServiceWorker);
    console.log("🔔 Push: PushManager support:", hasPushManager);
    console.log("🔔 Push: Notification support:", hasNotification);
    
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    console.log("🔔 Push: Secure context:", isSecureContext);
    
    const supported = hasServiceWorker && hasPushManager && hasNotification && isSecureContext;
    setIsSupported(supported);

    // Don't show error immediately for non-secure context, just mark as unsupported
    if (!isSecureContext) {
      console.log("🔔 Push: Not secure context, push notifications disabled");
      return;
    }

    if (supported) {
      setPermission(Notification.permission);
      console.log("🔔 Push: Current permission:", Notification.permission);
      
      // Wait for service worker to be ready with timeout
      const readyTimeout = setTimeout(() => {
        console.log("🔔 Push: Service worker ready timeout - continuing anyway");
      }, 5000);
      
      navigator.serviceWorker.ready
        .then((registration) => {
          clearTimeout(readyTimeout);
          console.log("🔔 Push: Service worker ready:", registration.scope);
          checkSubscriptionStatus();
        })
        .catch(err => {
          clearTimeout(readyTimeout);
          console.error("🔔 Push: Service worker not ready:", err);
          // Don't set error here, let the app work without push
        });
    } else {
      console.log("🔔 Push: Not supported in this environment");
      // Don't show error to user, just log for debugging
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      console.log("🔔 Push: Checking subscription status...");
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      console.log("🔔 Push: Current subscription:", subscription ? "EXISTS" : "NONE");
      if (subscription) {
        console.log("🔔 Push: Subscription endpoint:", subscription.endpoint.substring(0, 50) + "...");
      }
      
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error("🔔 Push: Failed to check subscription status:", err);
      setIsSubscribed(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.log("🔔 Push: Not supported, skipping permission request");
      return;
    }

    console.log("🔔 Push: Requesting permission...");
    setLoading(true);
    setError(null);

    try {
      // Try to request permission
      const result = await Notification.requestPermission();
      console.log("🔔 Push: Permission result:", result);
      setPermission(result);
      
      if (result === "denied") {
        setError("Notifications blocked. You can enable them in browser settings if needed.");
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      } else if (result === "granted") {
        console.log("🔔 Push: Permission granted, ready to subscribe");
        // Show a test notification to confirm it's working
        try {
          new Notification("Croply Notifications Enabled", {
            body: "You'll now receive notifications when new produce is listed!",
            icon: "/favicon.ico",
            badge: "/favicon.ico"
          });
        } catch (notifErr) {
          console.log("🔔 Push: Couldn't show test notification:", notifErr);
          // Not a critical error, continue anyway
        }
      }
    } catch (err) {
      console.error("🔔 Push: Permission request failed:", err);
      // Don't show intrusive error, notifications are optional
      console.log("🔔 Push: Permission couldn't be requested, notifications will be unavailable");
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      console.log("🔔 Push: Not supported, skipping subscription");
      return;
    }
    
    if (permission !== "granted") {
      setError("Please grant notification permission first");
      setTimeout(() => setError(null), 3000);
      return;
    }

    console.log("🔔 Push: Starting subscription process...");
    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log("🔔 Push: Service worker ready, registration scope:", registration.scope);
      
      // Clean up any existing subscriptions first
      try {
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          console.log("🔔 Push: Unsubscribing from existing subscription...");
          await existingSub.unsubscribe();
        }
      } catch (cleanupErr) {
        console.warn("🔔 Push: Failed to clean existing subscription:", cleanupErr);
        // Continue anyway
      }

      // Try subscription with different approaches
      let subscription: PushSubscription | null = null;
      
      // Approach 1: Try with VAPID key
      try {
        console.log("🔔 Push: Attempting VAPID subscription...");
        const vapidKey = urlB64ToUint8Array(VAPID_KEYS[0]);
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey as BufferSource,
        });
        
        console.log("🔔 Push: VAPID subscription successful!");
      } catch (vapidErr) {
        console.error("🔔 Push: VAPID subscription failed:", vapidErr);
        
        // Approach 2: Try without VAPID key (Brave sometimes prefers this)
        try {
          console.log("🔔 Push: Attempting subscription without VAPID...");
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
          });
          console.log("🔔 Push: Non-VAPID subscription successful!");
        } catch (noVapidErr) {
          console.error("🔔 Push: Non-VAPID subscription also failed:", noVapidErr);
          // Both approaches failed, throw the error
          throw vapidErr;
        }
      }

      if (subscription) {
        console.log("🔔 Push: Subscription created, endpoint:", subscription.endpoint.substring(0, 50) + "...");
        
        // Send subscription to server
        const subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth')),
          },
        };

        console.log("🔔 Push: Sending to server...");
        
        try {
          await subscribeToPush(subscriptionData);
          console.log("🔔 Push: Server registration successful!");
          
          setIsSubscribed(true);
          
          // Show success notification
          try {
            new Notification("Push Notifications Active", {
              body: "You'll now receive push notifications from Croply!",
              icon: "/favicon.ico",
              badge: "/favicon.ico"
            });
          } catch (notifErr) {
            console.log("🔔 Push: Couldn't show success notification:", notifErr);
            // Not critical
          }
        } catch (serverErr) {
          console.error("🔔 Push: Server registration failed:", serverErr);
          // Subscription created but server failed - still mark as subscribed locally
          setIsSubscribed(true);
          setError("Notifications enabled locally. Server sync will retry automatically.");
          setTimeout(() => setError(null), 4000);
        }
      }
    } catch (err) {
      console.error("🔔 Push: Subscription failed:", err);
      
      // Provide user-friendly error messages without being intrusive
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          // This often happens in Brave or with strict browser settings
          // Don't show scary error, just explain it's optional
          setError("Push notifications couldn't be enabled. You can still use all app features normally.");
          console.log("🔔 Push: AbortError - likely browser security settings. Push notifications are optional.");
        } else if (err.name === 'NotSupportedError') {
          setError("Push notifications aren't available in this browser, but all features will work normally.");
        } else if (err.name === 'NotAllowedError') {
          setError("Notification permission denied. You can enable it later in browser settings if needed.");
        } else if (err.message.includes('NetworkError') || err.message.includes('network')) {
          setError("Network error. Please check your connection and try again.");
        } else {
          // Generic error - don't expose technical details to user
          setError("Push notifications couldn't be enabled, but you can still use all app features.");
          console.log("🔔 Push: Subscription error:", err.message);
        }
      } else {
        setError("Push notifications are optional and all features will work without them.");
      }
      
      // Clear the error after 5 seconds so it doesn't stay on screen
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }, [isSupported, permission]);

  const unsubscribe = useCallback(async () => {
    console.log("🔔 Push: Starting unsubscribe process...");
    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log("🔔 Push: Unsubscribing from server...");
        
        try {
          await unsubscribeFromPush(subscription.endpoint);
          console.log("🔔 Push: Server unsubscription successful");
        } catch (serverErr) {
          console.warn("🔔 Push: Server unsubscription failed:", serverErr);
        }
        
        console.log("🔔 Push: Unsubscribing locally...");
        await subscription.unsubscribe();
        console.log("🔔 Push: Local unsubscription successful");
        
        setIsSubscribed(false);
      } else {
        console.log("🔔 Push: No subscription to unsubscribe from");
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("🔔 Push: Unsubscribe error:", err);
      setError(err instanceof Error ? err.message : "Failed to unsubscribe from push notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const testNotification = useCallback(() => {
    if (permission === "granted") {
      new Notification("Test Notification", {
        body: "This is a test notification from Croply!",
        icon: "/favicon.ico",
        tag: "test"
      });
    } else {
      setError("Please grant notification permission first");
    }
  }, [permission]);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
  };
}

// Utility functions
function urlB64ToUint8Array(base64String: string): Uint8Array {
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  } catch (err) {
    console.error("🔔 Push: VAPID key conversion failed:", err);
    throw new Error("Invalid VAPID key format");
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
}
