import { ImageResponse } from 'next/og';
import { FrameCard as Card } from '../../../components/Card';
import { CARD_DIMENSIONS } from '../../../config';

export async function GET() {
  return new ImageResponse(
    <Card message="Something went wrong. Try again later." />,
    CARD_DIMENSIONS,
  );
}
