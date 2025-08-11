import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';
import { NEXT_PUBLIC_URL } from './config';
import { campaignInfo } from './lib/campaignInfo';
import HomePage from './components/HomePage';

export async function generateMetadata(): Promise<Metadata> {
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: 'Donate Now',
        action: 'link',
        target: `${NEXT_PUBLIC_URL}#donate`,
      },
    ],
    image: `${NEXT_PUBLIC_URL}/api/images/start`,
    post_url: `${NEXT_PUBLIC_URL}/api/start`,
  });

  return {
    title: campaignInfo.title,
    description: campaignInfo.subtitle,
    openGraph: {
      title: campaignInfo.title,
      description: campaignInfo.subtitle,
      images: [`${NEXT_PUBLIC_URL}/api/images/start`],
    },
    other: {
      ...frameMetadata,
      'fc:frame:image:aspect_ratio': '1:1',
    },
  };
}

export default function Page() {
  return <HomePage />;
}