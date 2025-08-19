import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f3f4f6',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '60px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            maxWidth: '700px',
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '20px',
              color: '#111827',
            }}
          >
            Thank You!
          </h1>
          <p
            style={{
              fontSize: '24px',
              textAlign: 'center',
              color: '#6b7280',
              marginBottom: '30px',
            }}
          >
            Your donation makes a real difference
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#2563eb',
              }}
            >
              {amount} {token} donated
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#6b7280',
              }}
            >
              From: {formatAddress(address)}
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#374151',
              }}
            >
              Supporting Ibrahim's family in Gaza
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#374151',
              }}
            >
              27 people supported daily
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#374151',
              }}
            >
              100% goes to the family
            </div>
          </div>
          <div
            style={{
              marginTop: '40px',
              padding: '15px 30px',
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '10px',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            Powered by Breadfunds
          </div>
        </div>
      </div>
    ),
    {
      width: 800,
      height: 800,
    }
  );
}