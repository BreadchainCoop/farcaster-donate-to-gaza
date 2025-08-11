import { ImageResponse } from 'next/og';
import { DONATION_ADDRESS } from '../../../config';
import { campaignInfo } from '../../../lib/campaignInfo';

export const runtime = 'edge';

export async function GET() {
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
            Support Gaza
          </h1>
          <p
            style={{
              fontSize: '24px',
              textAlign: 'center',
              color: '#6b7280',
              marginBottom: '30px',
            }}
          >
            Direct crypto donations for Ibrahim's family
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
              €150/day for basic food
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
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '10px',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            Donate Now
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
