import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

export function FrameCard({ message, image }: { message?: string; image?: string }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        width: 800,
        height: 800,
      }}
    >
      {image && <img style={{ width: '100%', height: '100%' }} src={image} alt="" />}
      {message && (
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '0',
            width: '100%',
            background: 'rgb(64, 27, 114)',
            color: 'white',
            fontSize: '24px',
            paddingTop: '58px',
            paddingBottom: '108px',
          }}
        >
          <p style={{ margin: '0 auto' }}>{message}</p>
        </div>
      )}
    </div>
  );
}