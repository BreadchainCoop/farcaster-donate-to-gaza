'use client';

import { useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';

export default function FarcasterSDKProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Farcaster SDK and dismiss splash screen when app is ready
    const initializeSDK = async () => {
      try {
        // Check if we're in a Farcaster frame context
        const context = await sdk.context;
        
        if (context) {
          console.log('Farcaster SDK initialized with context:', context);
        }
        
        // Call ready to dismiss the splash screen
        sdk.actions.ready();
        console.log('Farcaster SDK ready() called - splash screen dismissed');
      } catch (error) {
        // Not in a Farcaster context, which is fine for web browsers
        console.log('Not in Farcaster context or SDK not available:', error);
      }
    };

    // Initialize SDK when component mounts
    initializeSDK();
  }, []);

  return <>{children}</>;
}