import { Inter } from 'next/font/google';
import './globals.css';
import FarcasterSDKProvider from './components/FarcasterSDKProvider';

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FarcasterSDKProvider>
          {children}
        </FarcasterSDKProvider>
      </body>
    </html>
  );
}
