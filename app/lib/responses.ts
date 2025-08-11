import { NextResponse } from 'next/server';
import { NEXT_PUBLIC_URL } from '../config';
import { getFrameHtml } from './getFrameHtml';

export function errorResponse() {
  return new NextResponse(
    getFrameHtml({
      image: `${NEXT_PUBLIC_URL}/api/images/error`,
    }),
  );
}

export async function mintResponse() {
  return new NextResponse(
    getFrameHtml({
      buttons: [
        {
          label: 'Donate',
          action: 'link',
          target: `${NEXT_PUBLIC_URL}#donate`,
        },
      ],
      image: `${NEXT_PUBLIC_URL}/api/images/inactive`,
    }),
  );
}
