import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { CARD_DIMENSIONS } from '../../../config';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const amount = searchParams.get('amount') ?? '0';
  const token = searchParams.get('token') ?? 'USDC';
  const address = searchParams.get('address') ?? '';

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return 'Anonymous';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return new ImageResponse(
    (
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: '20px',
            padding: '60px',
            width: '700px',
            height: '600px',
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 20px 0',
            }}
          >
            Thank You!
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#6b7280',
              margin: '0 0 30px 0',
            }}
          >
            Your donation makes a real difference
          </p>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#2563eb',
              margin: '0 0 20px 0',
            }}
          >
            {amount} {token} donated
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#6b7280',
              margin: '0 0 30px 0',
            }}
          >
            From: {formatAddress(address)}
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#374151',
              margin: '0 0 10px 0',
            }}
          >
            Supporting Ibrahim's family in Gaza
          </div>
          <div
            style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: '0 0 30px 0',
            }}
          >
            27 people • 100% direct support
          </div>
          <div
            style={{
              fontSize: '16px',
              color: '#9ca3af',
            }}
          >
            Powered by Breadfunds
          </div>
        </div>
      </div>
    ),
    CARD_DIMENSIONS
  );
}