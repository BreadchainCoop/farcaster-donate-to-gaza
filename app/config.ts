export const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
export const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'localhost:3000';

// Gaza donation wallet address
export const DONATION_ADDRESS = '0xFe70d2Fe8a0cCce98fB595f0Ef98C1522d6310b6';

// Supported cryptocurrencies with their contract addresses (for ERC-20 tokens)
export const SUPPORTED_TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Mainnet USDT
    isNative: false,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Mainnet USDC
    isNative: false,
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Mainnet DAI
    isNative: false,
  },
};

export const CARD_DIMENSIONS = {
  width: 800,
  height: 800,
};
