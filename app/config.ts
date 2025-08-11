export const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
export const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'localhost:3000';

// Gaza donation wallet address
export const DONATION_ADDRESS = '0xFe70d2Fe8a0cCce98fB595f0Ef98C1522d6310b6';

// Supported cryptocurrencies with their contract addresses
export const SUPPORTED_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin (Base)',
    decimals: 6,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
    isNative: false,
    chainId: 8453, // Base
    network: 'base',
  },
  BREAD: {
    symbol: 'BREAD',
    name: 'Bread Token (Gnosis)',
    decimals: 18,
    address: '0xa555d5344f6fb6c65da19e403cb4c1ec4a1a5ee3', // Gnosis Chain BREAD
    isNative: false,
    chainId: 100, // Gnosis Chain
    network: 'gnosis',
  },
};

export const CARD_DIMENSIONS = {
  width: 800,
  height: 800,
};
