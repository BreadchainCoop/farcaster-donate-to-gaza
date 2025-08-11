'use client';

import { useState, useEffect } from 'react';
import { DONATION_ADDRESS, SUPPORTED_TOKENS } from '../config';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export default function SimpleDonationWidget() {
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('base'); // Default to Base for Farcaster
  const [usdEquivalent, setUsdEquivalent] = useState('0.00');

  const networks = {
    base: { name: 'Base', chainId: 8453, explorer: 'https://basescan.org' },
    ethereum: { name: 'Ethereum Mainnet', chainId: 1, explorer: 'https://etherscan.io' },
    optimism: { name: 'Optimism', chainId: 10, explorer: 'https://optimistic.etherscan.io' },
    arbitrum: { name: 'Arbitrum', chainId: 42161, explorer: 'https://arbiscan.io' },
    polygon: { name: 'Polygon', chainId: 137, explorer: 'https://polygonscan.com' },
  };

  // Approximate prices for demo (in production, fetch from API)
  const tokenPrices: Record<string, number> = {
    ETH: 2300,
    USDT: 1,
    USDC: 1,
    DAI: 1,
  };

  // Preset amounts in USD
  const presetAmounts = [
    { label: '$10', value: 10 },
    { label: '$25', value: 25 },
    { label: '$50', value: 50 },
    { label: '$100', value: 100 },
    { label: '$250', value: 250 },
    { label: '$500', value: 500 },
  ];

  // Calculate USD equivalent when amount or token changes
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const price = tokenPrices[selectedToken] || 1;
      const usd = (parseFloat(amount) * price).toFixed(2);
      setUsdEquivalent(usd);
    } else {
      setUsdEquivalent('0.00');
    }
  }, [amount, selectedToken]);

  // Convert USD to token amount
  const setAmountFromUSD = (usdValue: number) => {
    const price = tokenPrices[selectedToken] || 1;
    const tokenAmount = (usdValue / price).toFixed(6);
    setAmount(tokenAmount);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Farcaster Frame Transaction
  const handleFarcasterDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    // Check if we're in a Farcaster context
    const isFarcasterFrame = window.parent !== window;
    
    if (isFarcasterFrame) {
      // Send frame action for Farcaster
      window.parent.postMessage({
        type: 'fc:frame:transaction',
        data: {
          chainId: `eip155:${networks[selectedNetwork as keyof typeof networks].chainId}`,
          method: 'eth_sendTransaction',
          params: {
            to: DONATION_ADDRESS,
            value: '0x' + Math.floor(parseFloat(amount) * 1e18).toString(16),
            data: '0x', // Empty data for simple transfer
          },
        },
      }, '*');
      
      // Show success message
      setTimeout(() => {
        alert(`Transaction initiated in Farcaster! Sending ${amount} ${selectedToken} (≈$${usdEquivalent})`);
        setAmount('');
      }, 1000);
      return;
    }
    
    // Fallback: Check for Web3 wallet
    if (typeof window.ethereum === 'undefined') {
      alert('Please use this in a Farcaster Frame or install a Web3 wallet to donate directly.');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      // Get selected token data
      const token = SUPPORTED_TOKENS[selectedToken as keyof typeof SUPPORTED_TOKENS];
      const network = networks[selectedNetwork as keyof typeof networks];

      // Switch to correct network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          alert(`Please add ${network.name} to your wallet.`);
          return;
        }
        throw switchError;
      }

      if (token.isNative) {
        // Send ETH or native token
        const value = '0x' + (parseFloat(amount) * 1e18).toString(16);
        const transactionParameters = {
          to: DONATION_ADDRESS,
          from: from,
          value: value,
        };

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionParameters],
        });

        alert(`Transaction sent! Hash: ${txHash}\n\nThank you for your donation of ${amount} ${selectedToken} (≈$${usdEquivalent})!`);
        setAmount(''); // Clear amount after successful transaction
      } else {
        // For ERC20 tokens, we need to interact with the contract
        alert(`To send ${token.symbol}, you'll need to:\n\n1. Go to your wallet\n2. Send ${amount} ${token.symbol} to:\n${DONATION_ADDRESS}\n\nMake sure you're on ${network.name}`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      if (error.code === 4001) {
        alert('Transaction was cancelled.');
      } else {
        alert('Transaction failed. Please try again.');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Make a Donation</h2>

      {/* Farcaster Badge */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-purple-600 font-semibold">🟪 Farcaster Integrated</span>
        </div>
        <p className="text-xs text-purple-700">
          Donate directly through your Farcaster wallet on Base network
        </p>
      </div>

      {/* Amount Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Donation Amount
        </label>
        
        {/* Amount Input */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.000001"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(SUPPORTED_TOKENS).map(([key, token]) => (
              <option key={key} value={key}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>

        {/* USD Equivalent Display */}
        {amount && (
          <p className="text-sm text-gray-600 mb-3">
            ≈ ${usdEquivalent} USD
          </p>
        )}

        {/* Preset Amount Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setAmountFromUSD(preset.value)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Network Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Network
        </label>
        <select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          {Object.entries(networks).map(([key, network]) => (
            <option key={key} value={key}>
              {network.name} {key === 'base' && '(Recommended for Farcaster)'}
            </option>
          ))}
        </select>
      </div>

      {/* Farcaster Donate Button */}
      <div className="mb-6">
        <button
          onClick={handleFarcasterDonate}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
        >
          {amount ? `Donate ${amount} ${selectedToken} (≈$${usdEquivalent})` : 'Enter Amount to Donate'}
        </button>
        
        <p className="text-xs text-gray-600 mt-2 text-center">
          Works with Farcaster Wallet, Warpcast, and all Web3 wallets
        </p>
      </div>

      {/* Impact Calculator */}
      {amount && parseFloat(usdEquivalent) > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Your Impact</h4>
          <div className="text-sm text-green-800 space-y-1">
            {parseFloat(usdEquivalent) >= 150 && (
              <p>✓ Feeds the entire family for {Math.floor(parseFloat(usdEquivalent) / 150)} day(s)</p>
            )}
            {parseFloat(usdEquivalent) >= 45 && parseFloat(usdEquivalent) < 150 && (
              <p>✓ Buys {Math.floor(parseFloat(usdEquivalent) / 45)} kg of flour</p>
            )}
            {parseFloat(usdEquivalent) >= 10 && parseFloat(usdEquivalent) < 45 && (
              <p>✓ Provides essential supplies for the children</p>
            )}
            {parseFloat(usdEquivalent) < 10 && (
              <p>✓ Every donation helps - combines with others for daily needs</p>
            )}
          </div>
        </div>
      )}

      {/* Manual Donation Section */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Manual Donation</h3>
        <p className="text-sm text-gray-600 mb-4">
          Send {amount ? `${amount} ${selectedToken}` : 'any amount'} to this address:
        </p>
        
        {/* Address Display */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <code className="text-xs break-all font-mono">{DONATION_ADDRESS}</code>
            <button
              onClick={copyAddress}
              className="ml-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition"
            >
              {copiedAddress ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code Toggle */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="text-sm text-purple-600 hover:underline mb-4"
        >
          {showQR ? 'Hide' : 'Show'} QR Code
        </button>

        {/* QR Code Display */}
        {showQR && (
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-white border-2 border-purple-300 rounded">
              <QRCode 
                value={`ethereum:${DONATION_ADDRESS}${amount ? `?value=${parseFloat(amount) * 1e18}` : ''}`} 
                size={200} 
              />
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="space-y-3">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded">
            <p className="text-xs text-purple-800">
              <strong>Farcaster Users:</strong> Share this frame in your casts to let others donate directly! 
              The frame transaction will process through Base network for lowest fees.
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-800">
              <strong>Daily Goal:</strong> €150 feeds all 27 family members for one day. 
              Your donation of ${usdEquivalent} makes a real difference!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Extend window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}