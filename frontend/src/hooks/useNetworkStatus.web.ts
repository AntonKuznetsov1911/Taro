import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * Web version of useNetworkStatus hook
 * Uses navigator.onLine for web browsers
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isInternetReachable: typeof navigator !== 'undefined' ? navigator.onLine : true,
    type: 'wifi',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setNetworkStatus({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });
    };

    const handleOffline = () => {
      setNetworkStatus({
        isConnected: false,
        isInternetReachable: false,
        type: null,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return networkStatus;
}

/**
 * Check if device is currently online (web version)
 */
export async function checkNetworkConnection(): Promise<boolean> {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Wait for network connection with timeout (web version)
 */
export async function waitForNetwork(timeoutMs: number = 5000): Promise<boolean> {
  if (typeof window === 'undefined') return true;

  if (navigator.onLine) {
    return true;
  }

  return new Promise((resolve) => {
    const handleOnline = () => {
      clearTimeout(timeout);
      window.removeEventListener('online', handleOnline);
      resolve(true);
    };

    const timeout = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      resolve(false);
    }, timeoutMs);

    window.addEventListener('online', handleOnline);
  });
}
