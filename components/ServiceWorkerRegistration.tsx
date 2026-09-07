"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker only on the client side
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker();
    } else {
      console.warn("🔧 SW: Service worker not supported in this environment");
    }
  }, []);

  return null; // This component doesn't render anything
}

async function registerServiceWorker() {
  try {
    console.log("🔧 SW: Starting service worker registration...");
    
    // Check if service worker file exists first
    try {
      const swResponse = await fetch("/sw.js", { method: "HEAD" });
      if (!swResponse.ok) {
        console.warn("🔧 SW: sw.js file not found, skipping registration");
        return;
      }
    } catch (fetchErr) {
      console.warn("🔧 SW: Cannot verify sw.js existence, continuing with registration");
    }
    
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("🔧 SW: Registration successful:", {
      scope: registration.scope,
      updateViaCache: registration.updateViaCache,
      active: !!registration.active,
      installing: !!registration.installing,
      waiting: !!registration.waiting
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log("🔧 SW: Service worker is ready and active");

    // Handle updates
    registration.addEventListener("updatefound", () => {
      console.log("🔧 SW: Update found, installing new worker...");
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        console.log("🔧 SW: New worker state:", newWorker.state);
        
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.log("🔧 SW: New service worker available");
          
          // Auto-reload after a short delay instead of showing prompt
          // This provides a smoother UX
          console.log("🔧 SW: Auto-reloading in 3 seconds for update...");
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      });
    });

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("🔧 SW: Message from service worker:", event.data);
    });

    // Handle controller changes (new service worker takes control)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("🔧 SW: Controller changed, new service worker active");
    });

  } catch (error) {
    console.error("🔧 SW: Registration failed:", error);
    
    if (error instanceof Error) {
      if (error.name === 'SecurityError') {
        console.error("🔧 SW: Security error - make sure the app is served over HTTPS in production or localhost in development");
      } else if (error.name === 'TypeError') {
        console.error("🔧 SW: Type error - check if sw.js file exists and is valid JavaScript");
      } else {
        console.error("🔧 SW: Registration error:", error.message);
      }
    }
    
    // Don't throw - let the app work without service worker
    console.log("🔧 SW: App will continue without service worker features");
  }
}
