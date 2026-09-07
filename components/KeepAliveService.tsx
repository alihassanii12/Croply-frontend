"use client";

import { useEffect } from 'react';

const MODEL_API_URL = 'https://croply-model-training.onrender.com';
const PING_INTERVAL = 8 * 60 * 1000; // 8 minutes (before 15-minute timeout)

export default function KeepAliveService() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pingServer = async () => {
      try {
        // Simple fetch to keep server awake
        const response = await fetch(`${MODEL_API_URL}/health`, {
          method: 'GET',
          // Don't wait too long
          signal: AbortSignal.timeout(15000),
        });

        // Silent success - no logging in production
        if (!response.ok && process.env.NODE_ENV === 'development') {
          console.log('⚠️ Model server ping failed:', response.status);
        }
      } catch (error) {
        // Completely silent - no console spam
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('⏳ Model server ping failed - might be starting up');
        }
      }
    };

    // Start pinging after component mounts
    const startKeepAlive = () => {
      // Initial ping after 30 seconds
      setTimeout(pingServer, 30000);
      
      // Then ping every 8 minutes
      intervalId = setInterval(pingServer, PING_INTERVAL);
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Keep-alive service started for model API');
      }
    };

    startKeepAlive();

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // This component renders nothing
  return null;
}