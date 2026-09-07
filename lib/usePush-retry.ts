"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/api";

const VAPID_KEY = "BIdUYGMXNJPQAJX0kZ9e9gogt7AiVO5HTLgLm7-9FkIYY8JtEX4A25ZHglvbKeEksqmgSFxAWs1RMZNHO8HDROE";

interface UsePushReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePush(): UsePushReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check browser support and current permission status
  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("🔔 Push: Checking browser support...");
    
    const hasServiceWorker = "serviceWorker" in navigator;
    const hasPushManager = "PushManager" in window;
    const hasNotification = "Notification" in window;
    
    console.log("🔔 Push: ServiceWorker support:", hasServiceWorker);
    console.log("🔔 Push: PushManager support:", hasPushManager);
    console.log("🔔 Push: Notification support:", hasNotification);
    console.log("🔔 Push: User Agent:", navigator.userAgent);
    
    const supported = hasServiceWorker && hasPushManager && hasNotification;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      console.log("🔔 Push: Current permission:", Notification.permission);
      
      // Wait for service worker to be ready before checking subscription
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log("🔔 Push: Service worker ready:", registration.scope);
          checkSubscriptionStatus();
        })
        .catch(err => {
          console.error("🔔 Push: Service worker not ready:", err);
          setError("Service worker failed to load. Please refresh and try again.");
        });
    } else {
      setError("Push notifications are not supported in this browser");
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      console.log("🔔 Push: Checking subscription status...");
      
      if (!("serviceWorker" in navigator)) {
        console.log("🔔 Push: No service worker support");
        return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      console.log("🔔 Push: Registration scope:", registration.scope);
      
      const subscription = await registration.pushManager.getSubscription();
      console.log("🔔 Push: Current subscription:", subscription ? "EXISTS" : "NONE");
      
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error("🔔 Push: Failed to check subscription status:", err);
      setIsSubscribed(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return;
    }

    console.log("🔔 Push: Requesting permission...");
    setLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      console.log("🔔 Push: Permission result:", result);
      setPermission(result);
      
      if (result === "denied") {
        setError("Push notification permission was denied. Please enable it in your browser settings.");
      } else if (result === "granted") {
        console.log("🔔 Push: Permission granted, ready to subscribe");
      }
    } catch (err) {
      console.error("🔔 Push: Permission request failed:", err);
      setError(err instanceof Error ? err.message : "Failed to request permission");
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return;
    }
    
    if (permission !== "granted") {
      setError("Please grant notification permission first");
      return;
    }

    console.log("🔔 Push: Starting subscription process...");
    setLoading(true);
    setError(null);

    try {
      // Ensure service worker is ready
      console.log("🔔 Push: Waiting for service worker...");
      const registration = await navigator.serviceWorker.ready;
      console.log("🔔 Push: Service worker ready, checking existing subscription...");
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log("🔔 Push: Already subscribed:", subscription.endpoint);
      } else {
        console.log("🔔 Push: Creating new subscription...");
        console.log("🔔 Push: VAPID key:", VAPID_KEY.substring(0, 10) + "...");
        
        // First, let's try without any existing subscriptions that might conflict
        try {
          const existingSub = await registration.pushManager.getSubscription();
          if (existingSub) {
            console.log("🔔 Push: Unsubscribing from existing subscription first...");
            await existingSub.unsubscribe();
          }
        } catch (cleanupErr) {
          console.warn("🔔 Push: Failed to clean existing subscription:", cleanupErr);
        }

        // Create new subscription with retry mechanism
        subscription = await createSubscriptionWithRetry(registration);
      }

      if (subscription) {
        console.log("🔔 Push: Sending subscription to server...");
        
        // Send subscription to server
        const subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth')),
          },
        };

        console.log("🔔 Push: Subscription data prepared:", {
          endpoint: subscriptionData.endpoint.substring(0, 50) + "...",
          hasP256dh: !!subscriptionData.keys.p256dh,
          hasAuth: !!subscriptionData.keys.auth
        });

        await subscribeToPush(subscriptionData);
        console.log("🔔 Push: Server registration successful");
        
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error("🔔 Push: General subscription error:", err);
      
      if (err instanceof Error) {
        if (err.message.includes('AbortError') || err.name === 'AbortError') {
          setError("Push subscription was cancelled. This might be due to browser settings or network issues. Try refreshing the page and trying again.");
        } else if (err.message.includes('NetworkError')) {
          setError("Network error occurred. Please check your internet connection and try again.");
        } else if (err.message.includes('NotAllowedError')) {
          setError("Push notifications are blocked. Please check your browser notification settings.");
        } else {
          setError(`Push subscription failed: ${err.message}`);
        }
      } else {
        setError("Failed to subscribe to push notifications. Please refresh the page and try again.");
      }
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
        
        // Unsubscribe from server first
        try {
          await unsubscribeFromPush(subscription.endpoint);
          console.log("🔔 Push: Server unsubscription successful");
        } catch (serverErr) {
          console.warn("🔔 Push: Server unsubscription failed:", serverErr);
          // Continue with local unsubscription even if server fails
        }
        
        // Then unsubscribe locally
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

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

// Helper function to create subscription with retry mechanism
async function createSubscriptionWithRetry(registration: ServiceWorkerRegistration, maxRetries = 3): Promise<PushSubscription | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔔 Push: Subscription attempt ${attempt}/${maxRetries}`);
      
      const vapidKey = urlB64ToUint8Array(VAPID_KEY);
      console.log("🔔 Push: VAPID key converted, length:", vapidKey.length);
      
      // Add a small delay between attempts to avoid rapid failures
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        console.log("🔔 Push: Retrying after delay...");
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey as BufferSource,
      });
      
      console.log("🔔 Push: Subscription created successfully:", subscription.endpoint.substring(0, 50) + "...");
      return subscription;
      
    } catch (subscribeErr) {
      console.error(`🔔 Push: Subscription attempt ${attempt} failed:`, subscribeErr);
      
      // Handle specific error types
      if (subscribeErr instanceof DOMException) {
        if (subscribeErr.name === 'AbortError') {
          if (attempt === maxRetries) {
            throw new Error("Push subscription was cancelled by the browser. This might be due to browser security settings or network issues.");
          }
          console.log("🔔 Push: AbortError, retrying...");
          continue;
        } else if (subscribeErr.name === 'NotSupportedError') {
          throw new Error("Push messaging is not supported by your browser or device.");
        } else if (subscribeErr.name === 'InvalidStateError') {
          throw new Error("Service worker is in an invalid state. Please refresh and try again.");
        } else if (subscribeErr.name === 'NotAllowedError') {
          throw new Error("Push notifications are blocked by browser settings.");
        } else {
          if (attempt === maxRetries) {
            throw new Error(`Push subscription failed: ${subscribeErr.message}`);
          }
        }
      } else {
        if (attempt === maxRetries) {
          throw new Error("Failed to create push subscription after multiple attempts.");
        }
      }
    }
  }
  
  return null;
}

// Utility functions for handling keys
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
