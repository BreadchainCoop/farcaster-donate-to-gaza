import { NEXT_PUBLIC_URL, DONATION_ADDRESS } from '../config';
import { campaignInfo } from './campaignInfo';

export async function getCollection() {
  return { 
    name: campaignInfo.title, 
    image: `${NEXT_PUBLIC_URL}/gaza-support.png`,
    address: DONATION_ADDRESS, 
    tokenId: '1' 
  };
}
